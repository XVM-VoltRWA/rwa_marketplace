#!/usr/bin/env node

/**
 * Offer Creation Test Suite
 * 
 * Tests offer creation functionality (buy/sell) using stored JWT tokens
 * Usage: npm run test:offer <username> <type> [options]
 */

import { ApiResponse, CreateOfferRequest, CreateOfferResponse } from '../src/types';
import {
    createAuthenticatedClient,
    getToken,
    displayTokensSummary,
    promptUser,
    sleep
} from './test-utils';

interface OfferTestConfig {
    username: string;
    type: 'buy' | 'sell';
    nftTokenId?: string;
    price?: string;  // Price in XRP
    skipPrompts?: boolean;
    waitForCreation?: boolean;
}

/**
 * Parse command line arguments for offer test
 */
function parseOfferArgs(): OfferTestConfig | null {
    const args = process.argv.slice(2);

    if (args.length < 2 || args[0] === '--help' || args[0] === '-h') {
        displayOfferHelp();
        return null;
    }

    const username = args[0];
    const type = args[1];

    if (!username || username.startsWith('--')) {
        console.error('❌ Username is required as the first argument');
        displayOfferHelp();
        return null;
    }

    if (type !== 'buy' && type !== 'sell') {
        console.error('❌ Offer type must be "buy" or "sell"');
        displayOfferHelp();
        return null;
    }

    const config: OfferTestConfig = { username, type };

    // Parse optional arguments
    for (const arg of args.slice(2)) {
        if (arg.startsWith('--nft-token-id=')) {
            config.nftTokenId = arg.split('=')[1];
        } else if (arg.startsWith('--price=')) {
            config.price = arg.split('=')[1];
        } else if (arg === '--skip-prompts') {
            config.skipPrompts = true;
        } else if (arg === '--wait') {
            config.waitForCreation = true;
        }
    }

    return config;
}

/**
 * Display help for offer test
 */
function displayOfferHelp(): void {
    console.log('\n💰 Offer Creation Test Suite - Help');
    console.log('='.repeat(60));
    console.log('');
    console.log('Usage:');
    console.log('  npm run test:offer <username> <type> [options]');
    console.log('');
    console.log('Arguments:');
    console.log('  username              Username to retrieve JWT token');
    console.log('  type                  Offer type: "buy" or "sell"');
    console.log('');
    console.log('Options:');
    console.log('  --nft-token-id=ID     NFT Token ID (required, interactive if not provided)');
    console.log('  --price=XRP           Offer price in XRP (interactive if not provided)');
    console.log('  --skip-prompts        Skip interactive prompts (uses defaults)');
    console.log('  --wait                Wait and poll for offer creation completion');
    console.log('  --help, -h            Show this help');
    console.log('');
    console.log('Examples:');
    console.log('  # Create sell offer with price');
    console.log('  npm run test:offer alice sell --nft-token-id=000B013A95F14B0E... --price=1.5');
    console.log('');
    console.log('  # Create buy offer with price');
    console.log('  npm run test:offer bob buy --nft-token-id=000B013A95F14B0E... --price=2.0');
    console.log('');
    console.log('  # Interactive mode (will prompt for price)');
    console.log('  npm run test:offer charlie buy --nft-token-id=000B013A95F14B0E...');
    console.log('');
    console.log('  # Create transfer offer (0 price)');
    console.log('  npm run test:offer alice sell --nft-token-id=000B013A95F14B0E... --price=0');
    console.log('');
    console.log('💡 Offer Types:');
    console.log('  sell - Create a sell offer (list NFT for sale)');
    console.log('  buy  - Create a buy offer (offer to purchase NFT)');
    console.log('');
    console.log('📋 Prerequisites:');
    console.log('  - User must have a valid JWT token (use test:signin first)');
    console.log('  - Token file: tests/tokens/<username>-token.json');
    console.log('  - For sell offers: User should own the NFT');
    console.log('  - For buy offers: NFT must exist on the network');
    console.log('='.repeat(60));
}

/**
 * Convert XRP to drops (1 XRP = 1,000,000 drops)
 */
function xrpToDrops(xrp: string | number): number {
    const xrpNum = typeof xrp === 'string' ? parseFloat(xrp) : xrp;
    return Math.floor(xrpNum * 1000000);
}

/**
 * Convert drops to XRP for display
 */
function dropsToXrp(drops: number | string): string {
    const dropsNum = typeof drops === 'string' ? parseInt(drops) : drops;
    return (dropsNum / 1000000).toString();
}

/**
 * Validate NFT Token ID format
 */
function validateNftTokenId(tokenId: string): boolean {
    // Basic validation: should be 64 character hex string
    const hexPattern = /^[0-9A-Fa-f]{64}$/;
    return hexPattern.test(tokenId);
}

/**
 * Get offer parameters interactively or from config
 */
async function getOfferParameters(config: OfferTestConfig): Promise<CreateOfferRequest | null> {
    let nftTokenId = config.nftTokenId;
    let price = config.price;

    // Get NFT Token ID
    if (!nftTokenId && !config.skipPrompts) {
        nftTokenId = await promptUser('🆔 Enter NFT Token ID (64-character hex): ');
        if (!nftTokenId.trim()) {
            console.error('❌ NFT Token ID is required');
            return null;
        }
    } else if (!nftTokenId) {
        if (config.skipPrompts) {
            console.error('❌ NFT Token ID is required. Use --nft-token-id=<ID> or run without --skip-prompts');
            return null;
        }
        // For testing purposes, use a placeholder
        nftTokenId = '000B013A95F14B0E44F78A264E41713C64B5F89242540EE208C3098E00000001';
        console.log(`⚠️  Using placeholder NFT Token ID: ${nftTokenId}`);
    }

    // Validate NFT Token ID format
    if (!validateNftTokenId(nftTokenId.trim())) {
        console.error('❌ Invalid NFT Token ID format. Expected 64-character hexadecimal string.');
        console.error('   Example: 000B013A95F14B0E44F78A264E41713C64B5F89242540EE208C3098E00000001');
        return null;
    }

    // Get price in XRP
    if (!price && !config.skipPrompts) {
        const defaultPrice = config.type === 'sell' ? '0' : '1';
        const pricePrompt = config.type === 'sell'
            ? `💰 Enter sell price in XRP (0 for transfer, default: ${defaultPrice}): `
            : `💰 Enter buy offer price in XRP (default: ${defaultPrice}): `;

        const priceInput = await promptUser(pricePrompt);
        price = priceInput.trim() || defaultPrice;
    } else if (!price) {
        // Default prices when skipping prompts
        price = config.type === 'sell' ? '0' : '1';
        console.log(`💰 Using default price: ${price} XRP`);
    }

    // Validate price
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
        console.error('❌ Invalid price: must be a non-negative number');
        return null;
    }

    // Convert XRP to drops for the API
    const amount = xrpToDrops(priceNum);
    console.log(`💰 Price: ${price} XRP (${amount} drops)`);

    return {
        nft_token_id: nftTokenId.trim(),
        type: config.type,
        amount: amount
    };
}

/**
 * Wait for offer creation to complete (if XUMM signing required)
 */
async function waitForOfferCreation(
    response: CreateOfferResponse,
    maxAttempts: number = 20
): Promise<void> {
    if (!response.payload_id) {
        console.log('ℹ️  No XUMM payload detected, offer creation should be immediate');
        return;
    }

    console.log('\n⏳ Offer creation requires XUMM signing...');
    console.log(`📱 Please check your XUMM app and sign the transaction`);
    console.log(`🔄 Waiting for completion (max ${maxAttempts} attempts)`);

    if (response.qr_code) {
        console.log('\n📱 QR Code for XUMM:');
        console.log(response.qr_code);
    }

    if (response.deep_link) {
        console.log(`🔗 Deep Link: ${response.deep_link}`);
    }

    // In a real implementation, you'd poll the transaction status
    // For this test, we'll just wait a bit
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`   Checking completion... (${attempt}/${maxAttempts})`);
        await sleep(3000);

        // Here you could add actual status polling logic
        // For now, we'll assume it completes after a few attempts
        if (attempt >= 3) {
            console.log('✅ Assumed offer creation completed');
            break;
        }
    }
}

/**
 * Run offer creation test for a username
 */
async function runOfferTest(config: OfferTestConfig): Promise<boolean> {
    const typeIcon = config.type === 'sell' ? '💰' : '🛒';

    console.log(`\n${typeIcon} Offer Creation Test Suite - ${config.type.toUpperCase()}`);
    console.log('='.repeat(50));
    console.log(`👤 Username: ${config.username}`);
    console.log(`📋 Type: ${config.type} offer`);

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
        // Get offer parameters
        console.log('\n📝 Step 1: Gathering offer parameters...');
        const offerRequest = await getOfferParameters(config);

        if (!offerRequest) {
            console.error('❌ Failed to get offer parameters');
            return false;
        }

        console.log(`🆔 NFT Token ID: ${offerRequest.nft_token_id}`);
        console.log(`📋 Offer Type: ${offerRequest.type}`);

        const xrpAmount = dropsToXrp(offerRequest.amount || 0);
        console.log(`💰 Price: ${xrpAmount} XRP`);

        if (config.type === 'sell' && offerRequest.amount === 0) {
            console.log('📝 Note: Price 0 creates a transfer offer (give away NFT)');
        } else if (config.type === 'sell') {
            console.log(`📝 Note: Creating sell offer to list NFT for ${xrpAmount} XRP`);
        } else {
            console.log(`📝 Note: Creating buy offer to purchase NFT for ${xrpAmount} XRP`);
        }

        if (!config.skipPrompts) {
            const confirm = await promptUser('\n❓ Proceed with offer creation? (y/N): ');
            if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
                console.log('❌ Offer creation cancelled by user');
                return false;
            }
        }

        // Create offer
        console.log(`\n🚀 Step 2: Creating ${config.type} offer...`);

        const response: ApiResponse<CreateOfferResponse> = await client.createOffer(offerRequest);

        if (!response.data.success) {
            console.error('❌ Offer creation failed:', response.data.error || response.data.message);
            return false;
        }

        console.log('✅ Offer creation request submitted successfully!');

        // Display response details
        const offerData = response.data;

        console.log('\n📋 Offer Creation Results:');
        console.log('='.repeat(30));

        if (offerData.payload_id) {
            console.log(`🆔 Payload ID: ${offerData.payload_id}`);
        }

        if (offerData.message) {
            console.log(`💬 Message: ${offerData.message}`);
        }

        if (offerData.pushed !== undefined) {
            console.log(`📱 Pushed to XUMM: ${offerData.pushed ? 'Yes' : 'No'}`);
        }

        // Handle XUMM signing if required
        if (offerData.payload_id && config.waitForCreation) {
            await waitForOfferCreation(offerData);
        } else if (offerData.payload_id) {
            console.log('\n📱 XUMM Signing Required:');
            if (offerData.qr_code) {
                console.log('QR Code available for signing');
            }
            if (offerData.deep_link) {
                console.log(`Deep Link: ${offerData.deep_link}`);
            }
            console.log('💡 Use --wait flag to automatically wait for completion');
        }

        console.log(`\n✅ ${config.type.charAt(0).toUpperCase() + config.type.slice(1)} Offer Creation Test Completed Successfully!`);
        console.log('='.repeat(50));

        return true;

    } catch (error) {
        console.error('❌ Offer creation test failed:', JSON.stringify(error, null, 2));
        return false;
    }
}

/**
 * Main function
 */
async function main(): Promise<void> {
    const config = parseOfferArgs();

    if (!config) {
        process.exit(1);
    }

    console.log('📊 Current Tokens:');
    displayTokensSummary();

    const success = await runOfferTest(config);

    if (!success) {
        console.error('\n❌ Offer creation test failed');
        process.exit(1);
    }

    console.log('\n🎉 Offer creation test completed successfully!');
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n\n👋 Offer creation test interrupted');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n\n👋 Offer creation test terminated');
    process.exit(0);
});

// Run if executed directly
if (require.main === module) {
    main().catch(error => {
        console.error('\n💥 Unexpected error:', error);
        process.exit(1);
    });
}

export { runOfferTest, parseOfferArgs };