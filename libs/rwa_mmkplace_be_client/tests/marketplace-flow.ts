#!/usr/bin/env node

/**
 * NFT Marketplace Orchestrator - Single Operation Mode
 * 
 * Modes:
 * 1. Create NFT + Sell Offer (for NFT creators)
 * 2. Create Buy Offer (for NFT buyers, requires existing NFT Token ID)
 * 
 * This approach allows different wallets to participate in the marketplace
 */

import { RwaMarketplaceClient } from '../src/client';
import {
    SignInResponse,
    SignInStatusResponse,
    CreateNftRequest,
    CreateNftResponse,
    CreateOfferRequest,
    CreateOfferResponse,
    ApiResponse,
    ApiError
} from '../src/types';
import readline from 'readline';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Utility functions for CLI arguments and configuration
 */
function getArgValue(arg: string): string | undefined {
    const argIndex = process.argv.findIndex(a => a.startsWith(arg));
    if (argIndex === -1) return undefined;

    const argValue = process.argv[argIndex];
    if (argValue.includes('=')) {
        return argValue.split('=')[1];
    }

    return process.argv[argIndex + 1];
}

function hasArg(arg: string): boolean {
    return process.argv.some(a => a === arg || a.startsWith(`${arg}=`));
}

/**
 * Configuration file handling
 */
interface ConfigFile {
    walletAddress?: string;
    apiBaseUrl?: string;
    skipPrompts?: boolean;
    userToken?: string;
    tokenExpiry?: string;
    offerAmount?: string;
}

const CONFIG_FILE_PATH = join(process.cwd(), 'rwa-orchestrator-config.json');

function loadConfig(): ConfigFile {
    if (existsSync(CONFIG_FILE_PATH)) {
        try {
            const configData = readFileSync(CONFIG_FILE_PATH, 'utf-8');
            return JSON.parse(configData);
        } catch (error) {
            console.warn('⚠️ Failed to load config file, using defaults');
        }
    }
    return {};
}

function saveConfig(config: ConfigFile): void {
    try {
        writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2));
        console.log(`✅ Configuration saved to ${CONFIG_FILE_PATH}`);
    } catch (error) {
        console.warn('⚠️ Failed to save config file');
    }
}

function isTokenValid(config: ConfigFile): boolean {
    if (!config.userToken || !config.tokenExpiry) {
        return false;
    }

    try {
        const expiry = new Date(config.tokenExpiry);
        const now = new Date();
        return now < expiry;
    } catch (error) {
        return false;
    }
}

// CLI Interface setup
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Load configuration from file
const fileConfig = loadConfig();

// Configuration
const CLIENT_CONFIG = {
    baseURL: getArgValue('--api-url') || process.env.RWA_API_BASE_URL || fileConfig.apiBaseUrl || 'http://127.0.0.1:54321',
    timeout: 60000,
    headers: {
        'User-Agent': 'RWA-Orchestrator/1.0.0'
    }
};

// Determine operation mode
const isBuyMode = hasArg('--buy') || getArgValue('--nft-token-id');
const mode = isBuyMode ? 'buy' : 'sell';

const TEST_CONFIG = {
    mode,
    walletAddress: getArgValue('--wallet') || process.env.RWA_WALLET_ADDRESS || fileConfig.walletAddress,
    skipPrompts: hasArg('--skip-prompts') || process.env.RWA_SKIP_PROMPTS === 'true' || fileConfig.skipPrompts || false,
    userToken: getArgValue('--token') || process.env.RWA_USER_TOKEN || fileConfig.userToken,
    forceSignIn: hasArg('--force-signin') || process.env.RWA_FORCE_SIGNIN === 'true',
    offerAmount: getArgValue('--amount') || process.env.RWA_OFFER_AMOUNT || fileConfig.offerAmount || '1000000',
    nftTokenId: getArgValue('--nft-token-id') || process.env.RWA_NFT_TOKEN_ID,
    nftName: getArgValue('--nft-name') || process.env.RWA_NFT_NAME || `Orchestrated NFT ${Date.now()}`,
    imageUrl: getArgValue('--image-url') || process.env.RWA_IMAGE_URL || 'https://via.placeholder.com/400x400.png?text=RWA+Marketplace'
};

// Session data
interface OrchestratorSession {
    userToken?: string;
    walletAddress?: string;
    payloadId?: string;
    nftTokenId?: string;
    offerId?: string;
    step: number;
}

const session: OrchestratorSession = {
    step: 0
};

function promptUser(question: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Step 1: Authentication
 */
async function authenticate(client: RwaMarketplaceClient): Promise<boolean> {
    try {
        console.log('\n🔐 Step 1: Authentication');
        session.step = 1;

        // Check for stored authentication
        if (!TEST_CONFIG.forceSignIn && isTokenValid(fileConfig) && fileConfig.userToken && fileConfig.walletAddress) {
            console.log('✅ Using stored authentication');
            console.log(`👤 User Token: ${fileConfig.userToken.substring(0, 20)}...`);
            console.log(`💼 Wallet Address: ${fileConfig.walletAddress}`);

            session.userToken = fileConfig.userToken;
            session.walletAddress = fileConfig.walletAddress;

            return true;
        }

        console.log('Creating new XUMM sign-in payload...');

        let walletAddress = TEST_CONFIG.walletAddress;

        if (!walletAddress && !TEST_CONFIG.skipPrompts) {
            walletAddress = await promptUser('Enter wallet address (optional): ');
        }

        if (walletAddress) {
            console.log(`📋 Using wallet address: ${walletAddress}`);
        }

        const signInRequest = walletAddress ? { wallet_address: walletAddress } : {};
        const response: ApiResponse<SignInResponse> = await client.xummSignIn(signInRequest);

        if (!response.data.success) {
            console.error('❌ Failed to create sign-in payload:', response.data.error);
            return false;
        }

        console.log('✅ Sign-in payload created successfully!');
        console.log(`📋 Payload ID: ${response.data.payload_id}`);
        session.payloadId = response.data.payload_id;

        if (response.data.deep_link) {
            console.log(`🔗 Deep Link: ${response.data.deep_link}`);
        }

        console.log('\n📱 Please sign in your XUMM app');
        console.log('⏳ Waiting for signature...');

        return await waitForSignature(client);

    } catch (error) {
        const apiError = error as ApiError;
        console.error('❌ Authentication error:', apiError.message);
        return false;
    }
}

async function waitForSignature(client: RwaMarketplaceClient): Promise<boolean> {
    if (!session.payloadId) {
        console.error('❌ No payload ID found');
        return false;
    }

    const maxAttempts = 30;
    let attempts = 0;

    while (attempts < maxAttempts) {
        try {
            const statusResponse: ApiResponse<SignInStatusResponse> =
                await client.getXummSignInStatus(session.payloadId);

            const status = statusResponse.data;

            if (status.expired) {
                console.error('❌ Sign-in payload has expired');
                return false;
            }

            if (status.cancelled) {
                console.error('❌ Sign-in was cancelled by user');
                return false;
            }

            if (status.signed && status.status === 'resolved') {
                console.log('✅ Sign-in successful!');

                session.userToken = status.user_token;
                session.walletAddress = status.wallet_address;

                console.log(`👤 User Token: ${session.userToken?.substring(0, 20)}...`);
                console.log(`💼 Wallet Address: ${session.walletAddress}`);

                return true;
            }

            if (status.status === 'pending') {
                process.stdout.write('.');
                await sleep(10000);
                attempts++;
                continue;
            }

        } catch (error) {
            const apiError = error as ApiError;
            console.error('❌ Error checking status:', apiError.message);
            await sleep(5000);
            attempts++;
        }
    }

    console.error('\n❌ Timeout waiting for signature');
    return false;
}

/**
 * Step 2: Create NFT (Sell Mode Only)
 */
async function createNFT(client: RwaMarketplaceClient): Promise<boolean> {
    try {
        console.log('\n🎨 Step 2: Creating NFT');
        session.step = 2;

        if (!session.userToken || !session.walletAddress) {
            console.error('❌ Missing authentication data');
            return false;
        }

        console.log(`🎨 NFT Name: ${TEST_CONFIG.nftName}`);
        console.log(`🖼️ Image URL: ${TEST_CONFIG.imageUrl}`);

        const createNftRequest: CreateNftRequest = {
            name: TEST_CONFIG.nftName,
            image_url: TEST_CONFIG.imageUrl,
            metadata: {
                description: `NFT created by RWA Marketplace Orchestrator (${TEST_CONFIG.mode} mode)`,
                created_at: new Date().toISOString(),
                creator: session.walletAddress,
                orchestrator: 'rwa-marketplace-orchestrator'
            },
            owner_address: session.walletAddress,
            xumm_user_token: session.userToken
        };

        console.log('\n📤 Creating NFT...');
        const response: ApiResponse<CreateNftResponse> = await client.createNft(createNftRequest);

        if (!response.data.success) {
            console.error('❌ Failed to create NFT:', response.data.error);
            return false;
        }

        console.log('✅ NFT created successfully!');
        const nftData = response.data;

        if (nftData.nft_token_id) {
            session.nftTokenId = nftData.nft_token_id;
            console.log(`🎨 NFT Token ID: ${nftData.nft_token_id}`);
        }

        if (nftData.mint_transaction_hash) {
            console.log(`🔗 Mint Transaction: ${nftData.mint_transaction_hash}`);
        }

        if (nftData.mint_explorer_link) {
            console.log(`🌐 Explorer Link: ${nftData.mint_explorer_link}`);
        }

        if (nftData.acceptance?.deep_link) {
            console.log(`🔗 Acceptance Deep Link: ${nftData.acceptance.deep_link}`);
        }

        return true;

    } catch (error) {
        const apiError = error as ApiError;
        console.error('❌ NFT creation error:', JSON.stringify(apiError, null, 2));
        return false;
    }
}

/**
 * Step 3: Create Offer
 */
async function createOffer(client: RwaMarketplaceClient): Promise<boolean> {
    try {
        const stepNum = TEST_CONFIG.mode === 'sell' ? 3 : 2;
        const offerTypeIcon = TEST_CONFIG.mode === 'sell' ? '💰' : '🛒';
        const offerTypeText = TEST_CONFIG.mode === 'sell' ? 'Sell' : 'Buy';

        console.log(`\n${offerTypeIcon} Step ${stepNum}: Creating ${offerTypeText} Offer`);
        session.step = stepNum;

        // For buy mode, use provided NFT Token ID
        if (TEST_CONFIG.mode === 'buy') {
            if (!TEST_CONFIG.nftTokenId) {
                console.error('❌ NFT Token ID is required for buy offers');
                console.log('💡 Use --nft-token-id=YOUR_NFT_TOKEN_ID');
                return false;
            }
            session.nftTokenId = TEST_CONFIG.nftTokenId;
            console.log(`📄 Using NFT Token ID: ${session.nftTokenId}`);
        }

        if (!session.nftTokenId || !session.userToken || !session.walletAddress) {
            console.error('❌ Missing required data for offer creation');
            return false;
        }

        console.log(`💵 ${offerTypeText} Amount: ${TEST_CONFIG.offerAmount} drops (${parseInt(TEST_CONFIG.offerAmount) / 1000000} XRP)`);

        const createOfferRequest: CreateOfferRequest = {
            nft_token_id: session.nftTokenId,
            type: TEST_CONFIG.mode as 'sell' | 'buy',
            user_address: session.walletAddress,
            amount: TEST_CONFIG.offerAmount,
            xumm_user_token: session.userToken
        };

        console.log(`\n📤 Creating ${TEST_CONFIG.mode} offer...`);
        const response: ApiResponse<CreateOfferResponse> = await client.createOffer(createOfferRequest);

        if (!response.data.success) {
            console.error(`❌ Failed to create ${TEST_CONFIG.mode} offer:`, response.data.error);
            return false;
        }

        console.log(`✅ ${offerTypeText} offer created successfully!`);
        const offerData = response.data;

        if (offerData.payload_id) {
            session.offerId = offerData.payload_id;
            console.log(`📋 ${offerTypeText} Offer Payload ID: ${offerData.payload_id}`);
        }

        if (offerData.deep_link) {
            console.log(`🔗 Deep Link: ${offerData.deep_link}`);
        }

        if (offerData.pushed) {
            console.log('📲 Payload was pushed to your XUMM app');
        }

        if (offerData.message) {
            console.log(`💬 Message: ${offerData.message}`);
        }

        return true;

    } catch (error) {
        const apiError = error as ApiError;
        console.error(`❌ ${TEST_CONFIG.mode} offer creation error:`, JSON.stringify(apiError, null, 2));
        return false;
    }
}

/**
 * Save configuration
 */
async function saveSessionConfig(): Promise<void> {
    if (!TEST_CONFIG.skipPrompts) {
        const save = await promptUser('💾 Save settings for future use? (y/n): ');
        if (save.toLowerCase() === 'y') {
            const tokenExpiry = new Date();
            tokenExpiry.setDate(tokenExpiry.getDate() + 30);

            const configToSave: ConfigFile = {
                walletAddress: session.walletAddress,
                apiBaseUrl: CLIENT_CONFIG.baseURL,
                userToken: session.userToken,
                tokenExpiry: tokenExpiry.toISOString(),
                offerAmount: TEST_CONFIG.offerAmount,
                skipPrompts: false
            };
            saveConfig(configToSave);
        }
    } else if (session.userToken) {
        const tokenExpiry = new Date();
        tokenExpiry.setDate(tokenExpiry.getDate() + 30);

        const configToSave: ConfigFile = {
            ...fileConfig,
            walletAddress: session.walletAddress,
            apiBaseUrl: CLIENT_CONFIG.baseURL,
            userToken: session.userToken,
            tokenExpiry: tokenExpiry.toISOString(),
            offerAmount: TEST_CONFIG.offerAmount
        };
        saveConfig(configToSave);
        console.log('🔐 Configuration automatically saved.');
    }
}

/**
 * Display summary
 */
function displaySummary(): void {
    console.log('\n📊 Orchestration Summary');
    console.log('='.repeat(60));
    console.log(`Mode: ${TEST_CONFIG.mode === 'sell' ? '💰 Create NFT + Sell Offer' : '🛒 Create Buy Offer'}`);
    console.log(`Authentication: ${session.userToken ? '✅ Success' : '❌ Failed'}`);

    if (TEST_CONFIG.mode === 'sell') {
        console.log(`NFT Creation: ${session.nftTokenId ? '✅ Success' : '❌ Failed'}`);
    }

    console.log(`${TEST_CONFIG.mode === 'sell' ? 'Sell' : 'Buy'} Offer: ${session.offerId ? '✅ Success' : '❌ Failed'}`);

    if (session.nftTokenId) {
        console.log(`\n🎨 NFT Token ID: ${session.nftTokenId}`);
    }
    if (session.offerId) {
        const offerTypeText = TEST_CONFIG.mode === 'sell' ? 'Sell' : 'Buy';
        console.log(`${TEST_CONFIG.mode === 'sell' ? '💰' : '🛒'} ${offerTypeText} Offer ID: ${session.offerId}`);
    }

    console.log(`\n💵 Amount: ${TEST_CONFIG.offerAmount} drops (${parseInt(TEST_CONFIG.offerAmount) / 1000000} XRP)`);
    console.log('='.repeat(60));
}

/**
 * Display help
 */
function displayHelp(): void {
    console.log('\n📝 RWA Marketplace Orchestrator - Help');
    console.log('='.repeat(70));
    console.log('');
    console.log('🎯 Two Operation Modes:');
    console.log('');
    console.log('1️⃣ SELL MODE (Default):');
    console.log('   Creates NFT + Sell Offer (for NFT creators)');
    console.log('   npm run orchestrate');
    console.log('');
    console.log('2️⃣ BUY MODE:');
    console.log('   Creates Buy Offer for existing NFT (for NFT buyers)');
    console.log('   npm run orchestrate -- --nft-token-id=YOUR_NFT_TOKEN_ID');
    console.log('   or');
    console.log('   npm run orchestrate -- --buy --nft-token-id=YOUR_NFT_TOKEN_ID');
    console.log('');
    console.log('Environment Variables:');
    console.log('  RWA_WALLET_ADDRESS     - Wallet address');
    console.log('  RWA_USER_TOKEN         - Stored user token');
    console.log('  RWA_API_BASE_URL       - API endpoint');
    console.log('  RWA_OFFER_AMOUNT       - Offer amount in drops');
    console.log('  RWA_NFT_TOKEN_ID       - NFT Token ID (for buy mode)');
    console.log('  RWA_SKIP_PROMPTS       - Skip interactive prompts');
    console.log('');
    console.log('CLI Arguments:');
    console.log('  --wallet=ADDRESS       - Wallet address');
    console.log('  --token=TOKEN          - User token');
    console.log('  --amount=DROPS         - Offer amount in drops');
    console.log('  --nft-token-id=ID      - NFT Token ID (enables buy mode)');
    console.log('  --buy                  - Force buy mode');
    console.log('  --nft-name=NAME        - NFT name (sell mode only)');
    console.log('  --image-url=URL        - NFT image URL (sell mode only)');
    console.log('  --skip-prompts         - Skip prompts');
    console.log('  --force-signin         - Force new sign-in');
    console.log('  --api-url=URL          - API endpoint');
    console.log('  --help, -h             - Show this help');
    console.log('');
    console.log('💡 Examples:');
    console.log('');
    console.log('# Create NFT + Sell Offer');
    console.log('npm run orchestrate -- --amount=2000000 --nft-name="My NFT"');
    console.log('');
    console.log('# Create Buy Offer for existing NFT');
    console.log('npm run orchestrate -- --nft-token-id=000B013A95F14B0E... --amount=1500000');
    console.log('');
    console.log('# Use different wallets for sell vs buy');
    console.log('# Seller:');
    console.log('export RWA_WALLET_ADDRESS="rSellerWallet..."');
    console.log('npm run orchestrate -- --skip-prompts');
    console.log('# Buyer:');
    console.log('export RWA_WALLET_ADDRESS="rBuyerWallet..."');
    console.log('npm run orchestrate -- --nft-token-id=NFT_FROM_ABOVE --skip-prompts');
    console.log('='.repeat(70));
}

/**
 * Main orchestrator function
 */
async function runOrchestrator(): Promise<void> {
    console.log('🎭 RWA Marketplace Orchestrator');
    console.log('='.repeat(60));

    // Show help if requested
    if (hasArg('--help') || hasArg('-h')) {
        displayHelp();
        rl.close();
        return;
    }

    const modeIcon = TEST_CONFIG.mode === 'sell' ? '💰' : '🛒';
    const modeText = TEST_CONFIG.mode === 'sell' ? 'Sell Mode: Create NFT + Sell Offer' : 'Buy Mode: Create Buy Offer';

    console.log(`${modeIcon} ${modeText}`);
    console.log('='.repeat(60));

    // Show current configuration
    console.log('\n⚙️ Configuration:');
    console.log(`API Base URL: ${CLIENT_CONFIG.baseURL}`);
    console.log(`Mode: ${TEST_CONFIG.mode === 'sell' ? '💰 Sell (NFT Creator)' : '🛒 Buy (NFT Buyer)'}`);
    console.log(`Wallet: ${TEST_CONFIG.walletAddress || '(will prompt/sign-in)'}`);
    console.log(`Token: ${TEST_CONFIG.userToken ? TEST_CONFIG.userToken.substring(0, 20) + '...' : fileConfig.userToken ? '✅ Stored' : '(will sign-in)'}`);

    if (TEST_CONFIG.mode === 'sell') {
        console.log(`NFT Name: ${TEST_CONFIG.nftName}`);
    } else {
        console.log(`NFT Token ID: ${TEST_CONFIG.nftTokenId || '❌ Required!'}`);
        if (!TEST_CONFIG.nftTokenId) {
            console.log('💡 Use --nft-token-id=YOUR_NFT_TOKEN_ID');
            rl.close();
            return;
        }
    }

    console.log(`Amount: ${TEST_CONFIG.offerAmount} drops (${parseInt(TEST_CONFIG.offerAmount) / 1000000} XRP)`);
    console.log(`Skip Prompts: ${TEST_CONFIG.skipPrompts ? 'Yes' : 'No'}`);

    if (!TEST_CONFIG.skipPrompts) {
        const proceed = await promptUser('\n🚀 Start orchestration? (y/n): ');
        if (proceed.toLowerCase() !== 'y') {
            console.log('Orchestration cancelled.');
            rl.close();
            return;
        }
    }

    const client = new RwaMarketplaceClient(CLIENT_CONFIG);
    console.log(`\n🔗 Connected to: ${client.getBaseURL()}`);

    try {
        // Step 1: Authentication
        const authSuccess = await authenticate(client);
        if (!authSuccess) {
            console.error('❌ Authentication failed, aborting orchestration');
            displaySummary();
            rl.close();
            return;
        }

        // Step 2: Create NFT (sell mode only)
        if (TEST_CONFIG.mode === 'sell') {
            const nftSuccess = await createNFT(client);
            if (!nftSuccess) {
                console.error('❌ NFT creation failed, aborting orchestration');
                displaySummary();
                rl.close();
                return;
            }
        }

        // Step 3: Create Offer
        const offerSuccess = await createOffer(client);
        if (!offerSuccess) {
            console.error(`❌ ${TEST_CONFIG.mode} offer creation failed`);
        }

        // Save configuration
        await saveSessionConfig();

        // Final summary
        displaySummary();

        const expectedSteps = TEST_CONFIG.mode === 'sell' ? 3 : 2;
        if (session.step >= expectedSteps) {
            console.log('\n🎉 Orchestration completed successfully!');
            console.log(`🎯 ${TEST_CONFIG.mode === 'sell' ? 'NFT created and listed for sale!' : 'Buy offer submitted!'}`);

            if (TEST_CONFIG.mode === 'sell') {
                console.log('\n💡 Next steps:');
                console.log(`• Share NFT Token ID: ${session.nftTokenId}`);
                console.log('• Buyers can create buy offers using:');
                console.log(`  npm run orchestrate -- --nft-token-id=${session.nftTokenId} --amount=THEIR_AMOUNT`);
            }
        } else {
            console.log('\n⚠️ Orchestration partially completed.');
        }

    } catch (error) {
        console.error('❌ Unexpected error:', error);
        displaySummary();
    } finally {
        rl.close();
    }
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n\n👋 Orchestration interrupted');
    displaySummary();
    rl.close();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n\n👋 Orchestration terminated');
    displaySummary();
    rl.close();
    process.exit(0);
});

// Run orchestrator if executed directly
if (require.main === module) {
    runOrchestrator().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

export { runOrchestrator, session as orchestratorSession };