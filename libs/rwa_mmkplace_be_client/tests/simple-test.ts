#!/usr/bin/env node

/**
 * Simple CLI Test for RWA Marketplace Backend Client
 * 
 * A streamlined version with minimal prompts for quick testing
 */

import { RwaMarketplaceClient } from '../src/client';
import { ApiError } from '../src/types';

// Simple configuration
const client = new RwaMarketplaceClient({
    baseURL: process.env.RWA_API_BASE_URL || 'https://your-api-endpoint.com',
    timeout: 60000
});

/**
 * Display link in terminal
 */
function showLink(data: string, title: string): void {
    console.log(`\n📱 ${title}`);
    console.log('='.repeat(40));
    console.log(`🔗 ${data}`);
    console.log('='.repeat(40));
}

/**
 * Quick test function
 */
async function quickTest(): Promise<void> {
    try {
        console.log('🚀 Quick RWA Client Test');
        console.log('========================');

        // 1. Create XUMM Sign-in
        console.log('\n1️⃣ Creating XUMM sign-in...');
        const signInResponse = await client.xummSignIn();

        if (!signInResponse.data.success) {
            throw new Error(signInResponse.data.error || 'Sign-in failed');
        }

        console.log('✅ Sign-in payload created');
        console.log(`📋 Payload ID: ${signInResponse.data.payload_id}`);

        if (signInResponse.data.qr_code) {
            showLink(signInResponse.data.qr_code, 'XUMM Sign-in QR Code Link');
        }

        if (signInResponse.data.deep_link) {
            console.log(`🔗 Deep Link: ${signInResponse.data.deep_link}`);
        }

        console.log('\n📱 Please sign in your XUMM app and then check status manually');
        console.log(`\n2️⃣ To check status, run:`);
        console.log(`   curl "${client.getBaseURL()}/functions/v1/xumm-signin?payload_id=${signInResponse.data.payload_id}"`);

        console.log('\n3️⃣ Example NFT creation (replace with your data):');
        console.log(`   POST ${client.getBaseURL()}/functions/v1/create-nft`);
        console.log('   Body:');
        console.log('   {');
        console.log('     "name": "Test NFT",');
        console.log('     "image_url": "https://example.com/image.png",');
        console.log('     "owner_address": "YOUR_WALLET_ADDRESS",');
        console.log('     "xumm_user_token": "USER_TOKEN_FROM_SIGNIN"');
        console.log('   }');

        // Example with actual client methods (commented out as they need real data)
        /*
        console.log('\n🎨 Creating example NFT...');
        const nftResponse = await client.createNft({
            name: 'Test NFT',
            image_url: 'https://example.com/image.png',
            owner_address: 'rYourWalletAddress',
            xumm_user_token: 'user_token_from_signin'
        });
        
        if (nftResponse.data.success) {
            console.log('✅ NFT created successfully!');
            console.log(`🎨 Token ID: ${nftResponse.data.nft_token_id}`);
        }
        */

    } catch (error) {
        const apiError = error as ApiError;
        console.error('❌ Error:', apiError.message);
        console.error('Status:', apiError.status);
    }
}

// Run if executed directly
if (require.main === module) {
    quickTest().catch(console.error);
}

export { quickTest };