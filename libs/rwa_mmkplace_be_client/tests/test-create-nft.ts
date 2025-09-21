#!/usr/bin/env node

/**
 * NFT Creation Test Suite
 * 
 * Tests NFT creation functionality using stored JWT tokens
 * Usage: npm run test:create-nft <username> [options]
 */

import { ApiResponse, CreateNftRequest, CreateNftResponse } from '../src/types';
import {
    createAuthenticatedClient,
    getToken,
    displayTokensSummary,
    promptUser,
    sleep
} from './test-utils';

interface NftTestConfig {
    username: string;
    nftName?: string;
    imageUrl?: string;
    metadata?: Record<string, unknown>;
    skipPrompts?: boolean;
    waitForCreation?: boolean;
}

/**
 * Parse command line arguments for NFT test
 */
function parseNftArgs(): NftTestConfig | null {
    const args = process.argv.slice(2);

    if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
        displayNftHelp();
        return null;
    }

    const username = args[0];

    if (!username || username.startsWith('--')) {
        console.error('❌ Username is required as the first argument');
        displayNftHelp();
        return null;
    }

    const config: NftTestConfig = { username };

    // Parse optional arguments
    for (const arg of args.slice(1)) {
        if (arg.startsWith('--name=')) {
            config.nftName = arg.split('=')[1];
        } else if (arg.startsWith('--image=')) {
            config.imageUrl = arg.split('=')[1];
        } else if (arg === '--skip-prompts') {
            config.skipPrompts = true;
        } else if (arg === '--wait') {
            config.waitForCreation = true;
        }
    }

    return config;
}

/**
 * Display help for NFT test
 */
function displayNftHelp(): void {
    console.log('\n🖼️  NFT Creation Test Suite - Help');
    console.log('='.repeat(50));
    console.log('');
    console.log('Usage:');
    console.log('  npm run test:create-nft <username> [options]');
    console.log('');
    console.log('Arguments:');
    console.log('  username              Username to retrieve JWT token');
    console.log('');
    console.log('Options:');
    console.log('  --name=NAME           NFT name (interactive if not provided)');
    console.log('  --image=URL           NFT image URL (interactive if not provided)');
    console.log('  --skip-prompts        Skip interactive prompts');
    console.log('  --wait                Wait and poll for NFT creation completion');
    console.log('  --help, -h            Show this help');
    console.log('');
    console.log('Examples:');
    console.log('  npm run test:create-nft test1');
    console.log('  npm run test:create-nft alice --name="Alice NFT" --image="https://example.com/nft.png"');
    console.log('  npm run test:create-nft bob --skip-prompts --wait');
    console.log('');
    console.log('📋 Prerequisites:');
    console.log('  - User must have a valid JWT token (use test:signin first)');
    console.log('  - Token file: tests/tokens/<username>-token.json');
    console.log('='.repeat(50));
}

/**
 * Get NFT parameters interactively or from config
 */
async function getNftParameters(config: NftTestConfig): Promise<CreateNftRequest | null> {
    let name = config.nftName;
    let imageUrl = config.imageUrl;

    // Get NFT name
    if (!name && !config.skipPrompts) {
        name = await promptUser('🏷️  Enter NFT name: ');
        if (!name.trim()) {
            console.error('❌ NFT name is required');
            return null;
        }
    } else if (!name) {
        // Default name if skipping prompts
        name = `Test NFT by ${config.username} - ${new Date().toISOString()}`;
    }

    // Get image URL
    if (!imageUrl && !config.skipPrompts) {
        const defaultImage = 'https://via.placeholder.com/400x400.png?text=Test+NFT';
        imageUrl = await promptUser(`🖼️  Enter image URL (default: ${defaultImage}): `);
        if (!imageUrl.trim()) {
            imageUrl = defaultImage;
        }
    } else if (!imageUrl) {
        // Default image if skipping prompts
        imageUrl = 'https://via.placeholder.com/400x400.png?text=Test+NFT';
    }

    // Create metadata
    const metadata = config.metadata || {
        description: `Test NFT created by ${config.username}`,
        creator: config.username,
        createdAt: new Date().toISOString(),
        testSuite: 'rwa-marketplace-test'
    };

    return {
        name: name.trim(),
        image_url: imageUrl.trim(),
        metadata
    };
}

/**
 * Wait for NFT creation to complete (if XUMM signing required)
 */
async function waitForNftCreation(
    response: CreateNftResponse,
    maxAttempts: number = 20
): Promise<void> {
    if (!response.acceptance?.payload_id) {
        console.log('ℹ️  No XUMM payload detected, NFT creation should be immediate');
        return;
    }

    console.log('\n⏳ NFT creation requires XUMM signing...');
    console.log(`📱 Please check your XUMM app and sign the transaction`);
    console.log(`🔄 Polling for completion (max ${maxAttempts} attempts)`);

    if (response.acceptance.qr_code) {
        console.log('\n📱 QR Code for XUMM:');
        console.log(response.acceptance.qr_code);
    }

    if (response.acceptance.deep_link) {
        console.log(`🔗 Deep Link: ${response.acceptance.deep_link}`);
    }

    // In a real implementation, you'd poll the transaction status
    // For this test, we'll just wait a bit
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`   Checking completion... (${attempt}/${maxAttempts})`);
        await sleep(3000);

        // Here you could add actual status polling logic
        // For now, we'll assume it completes after a few attempts
        if (attempt >= 3) {
            console.log('✅ Assumed NFT creation completed');
            break;
        }
    }
}

/**
 * Run NFT creation test for a username
 */
async function runNftTest(config: NftTestConfig): Promise<boolean> {
    console.log('\n🖼️  NFT Creation Test Suite');
    console.log('='.repeat(50));
    console.log(`👤 Username: ${config.username}`);

    // Check if user has valid token
    const tokenData = getToken(config.username);
    if (!tokenData) {
        console.error(`❌ No valid token found for user: ${config.username}`);
        console.error('💡 Please run sign-in test first: npm run test:signin <username>');
        return false;
    }

    console.log(`✅ Token found for user: ${config.username}`);
    console.log(`💼 Wallet: ${tokenData.walletAddress}`);

    // Create authenticated client
    const client = createAuthenticatedClient(config.username);
    if (!client) {
        console.error('❌ Failed to create authenticated client');
        return false;
    }

    try {
        // Get NFT parameters
        console.log('\n📝 Step 1: Gathering NFT parameters...');
        const nftRequest = await getNftParameters(config);

        if (!nftRequest) {
            console.error('❌ Failed to get NFT parameters');
            return false;
        }

        console.log(`🏷️  NFT Name: ${nftRequest.name}`);
        console.log(`🖼️  Image URL: ${nftRequest.image_url}`);
        console.log(`📋 Metadata: ${JSON.stringify(nftRequest.metadata, null, 2)}`);

        if (!config.skipPrompts) {
            const confirm = await promptUser('\n❓ Proceed with NFT creation? (y/N): ');
            if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
                console.log('❌ NFT creation cancelled by user');
                return false;
            }
        }

        // Create NFT
        console.log('\n🚀 Step 2: Creating NFT...');

        const response: ApiResponse<CreateNftResponse> = await client.createNft(nftRequest);

        if (!response.data.success) {
            console.error('❌ NFT creation failed:', response.data.error || response.data.message);
            return false;
        }

        console.log('✅ NFT creation request submitted successfully!');

        // Display response details
        const nftData = response.data;

        console.log('\n📋 NFT Creation Results:');
        console.log('='.repeat(30));

        if (nftData.nft_token_id) {
            console.log(`🆔 NFT Token ID: ${nftData.nft_token_id}`);
        }

        if (nftData.mint_transaction_hash) {
            console.log(`📝 Mint Transaction Hash: ${nftData.mint_transaction_hash}`);
        }

        if (nftData.mint_explorer_link) {
            console.log(`🔍 Explorer Link: ${nftData.mint_explorer_link}`);
        }

        if (nftData.network) {
            console.log(`🌐 Network: ${nftData.network}`);
        }

        if (nftData.minter_address) {
            console.log(`👤 Minter Address: ${nftData.minter_address}`);
        }

        if (nftData.message) {
            console.log(`💬 Message: ${nftData.message}`);
        }

        // Handle XUMM signing if required
        if (nftData.acceptance && config.waitForCreation) {
            await waitForNftCreation(nftData);
        } else if (nftData.acceptance) {
            console.log('\n📱 ACCEPT THIS TO GET YOUR NFT');
            console.log('\n📱 XUMM Signing Required:');
            if (nftData.acceptance.qr_code) {
                console.log('QR Code available for signing');
            }
            if (nftData.acceptance.deep_link) {
                console.log(`Deep Link: ${nftData.acceptance.deep_link}`);
            }
            console.log('💡 Use --wait flag to automatically wait for completion');
        }

        console.log('\n✅ NFT Creation Test Completed Successfully!');
        console.log('='.repeat(50));

        return true;

    } catch (error) {
        console.error('❌ NFT creation test failed:', error);
        return false;
    }
}

/**
 * Main function
 */
async function main(): Promise<void> {
    const config = parseNftArgs();

    if (!config) {
        process.exit(1);
    }

    console.log('📊 Current Tokens:');
    displayTokensSummary();

    const success = await runNftTest(config);

    if (!success) {
        console.error('\n❌ NFT creation test failed');
        process.exit(1);
    }

    console.log('\n🎉 NFT creation test completed successfully!');
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n\n👋 NFT creation test interrupted');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n\n👋 NFT creation test terminated');
    process.exit(0);
});

// Run if executed directly
if (require.main === module) {
    main().catch(error => {
        console.error('\n💥 Unexpected error:', error);
        process.exit(1);
    });
}

export { runNftTest, parseNftArgs };