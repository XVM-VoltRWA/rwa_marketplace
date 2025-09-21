#!/usr/bin/env node

/**
 * Sign-in Test Suite
 * 
 * Tests XUMM sign-in functionality and stores JWT tokens for later use
 * Usage: npm run test:signin <username> [--wallet=ADDRESS] [--api-url=URL]
 */

import { RwaMarketplaceClient } from '../src/client';
import { RwaClientConfig, ApiResponse, SignInResponse, SignInStatusResponse } from '../src/types';
import {
    storeToken,
    loadTestConfig,
    promptUser,
    sleep,
    displayTokensSummary
} from './test-utils';

interface SignInTestConfig {
    username: string;
    walletAddress?: string;
    apiBaseUrl?: string;
    timeout?: number;
    skipPrompts?: boolean;
}

/**
 * Parse command line arguments for sign-in test
 */
function parseSignInArgs(): SignInTestConfig | null {
    const args = process.argv.slice(2);

    if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
        displaySignInHelp();
        return null;
    }

    const username = args[0];

    if (!username || username.startsWith('--')) {
        console.error('❌ Username is required as the first argument');
        displaySignInHelp();
        return null;
    }

    const config: SignInTestConfig = { username };

    // Parse optional arguments
    for (const arg of args.slice(1)) {
        if (arg.startsWith('--wallet=')) {
            config.walletAddress = arg.split('=')[1];
        } else if (arg.startsWith('--api-url=')) {
            config.apiBaseUrl = arg.split('=')[1];
        } else if (arg.startsWith('--timeout=')) {
            config.timeout = parseInt(arg.split('=')[1]);
        } else if (arg === '--skip-prompts') {
            config.skipPrompts = true;
        }
    }

    return config;
}

/**
 * Display help for sign-in test
 */
function displaySignInHelp(): void {
    console.log('\n🔐 Sign-in Test Suite - Help');
    console.log('='.repeat(50));
    console.log('');
    console.log('Usage:');
    console.log('  npm run test:signin <username> [options]');
    console.log('');
    console.log('Arguments:');
    console.log('  username              Username to identify the token');
    console.log('');
    console.log('Options:');
    console.log('  --wallet=ADDRESS      Specific wallet address to sign in');
    console.log('  --api-url=URL         API base URL');
    console.log('  --timeout=MS          Request timeout in milliseconds');
    console.log('  --skip-prompts        Skip interactive prompts');
    console.log('  --help, -h            Show this help');
    console.log('');
    console.log('Examples:');
    console.log('  npm run test:signin test1');
    console.log('  npm run test:signin alice --wallet=rAlice123...');
    console.log('  npm run test:signin bob --api-url=https://api.example.com');
    console.log('');
    console.log('💾 Token Storage:');
    console.log('  Successful sign-ins store JWT tokens in:');
    console.log('  tests/tokens/<username>-token.json');
    console.log('='.repeat(50));
}

/**
 * Wait for XUMM signature with status polling
 */
async function waitForSignature(
    client: RwaMarketplaceClient,
    payloadId: string,
    maxAttempts: number = 30
): Promise<SignInStatusResponse | null> {
    console.log('\n⏳ Waiting for signature...');
    console.log(`📱 Please check your XUMM app and sign the request`);
    console.log(`🔄 Polling status every 2 seconds (max ${maxAttempts} attempts)`);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            console.log(`   Attempt ${attempt}/${maxAttempts}...`);

            const response: ApiResponse<SignInStatusResponse> = await client.getXummSignInStatus(payloadId);
            const status = response.data;

            if (status.signed && status.status === 'resolved') {
                console.log('\n✅ Signature received!');
                return status;
            } else if (status.expired) {
                console.error('\n❌ Sign-in payload has expired');
                return null;
            } else if (status.cancelled) {
                console.error('\n❌ Sign-in was cancelled by user');
                return null;
            }

            // Wait before next attempt
            await sleep(2000);

        } catch (error) {
            console.error(`   ❌ Error checking status (attempt ${attempt}):`, error);

            if (attempt === maxAttempts) {
                console.error('\n❌ Max attempts reached');
                return null;
            }

            await sleep(2000);
        }
    }

    console.error('\n❌ Timeout waiting for signature');
    return null;
}

/**
 * Run sign-in test for a username
 */
async function runSignInTest(config: SignInTestConfig): Promise<boolean> {
    console.log('\n🔐 Sign-in Test Suite');
    console.log('='.repeat(50));
    console.log(`👤 Username: ${config.username}`);

    // Load test configuration
    const testConfig = loadTestConfig();
    const apiBaseUrl = config.apiBaseUrl || testConfig.apiBaseUrl;
    const timeout = config.timeout || testConfig.timeout;

    console.log(`🔗 API Base URL: ${apiBaseUrl}`);
    console.log(`⏱️  Timeout: ${timeout}ms`);

    if (config.walletAddress) {
        console.log(`💼 Wallet Address: ${config.walletAddress}`);
    }

    // Create client
    const clientConfig: RwaClientConfig = {
        baseURL: apiBaseUrl,
        timeout: timeout,
        headers: {
            'User-Agent': 'RWA-Test-Suite-SignIn/1.0.0'
        }
    };

    const client = new RwaMarketplaceClient(clientConfig);

    try {
        // Step 1: Create sign-in payload
        console.log('\n📝 Step 1: Creating XUMM sign-in payload...');

        const signInRequest = config.walletAddress ? { wallet_address: config.walletAddress } : {};
        const signInResponse: ApiResponse<SignInResponse> = await client.xummSignIn();

        if (!signInResponse.data.success) {
            console.error('❌ Failed to create sign-in payload:', signInResponse.data.error);
            return false;
        }

        const { payload_id, qr_code, deep_link, message } = signInResponse.data;

        console.log('✅ Sign-in payload created successfully');
        console.log(`📋 Payload ID: ${payload_id}`);
        console.log(`💬 Message: ${message}`);

        if (qr_code) {
            console.log('\n📱 QR Code for XUMM:');
            console.log(qr_code);
        }

        if (deep_link) {
            console.log(`🔗 Deep Link: ${deep_link}`);
        }

        if (!config.skipPrompts) {
            const proceed = await promptUser('\n❓ Please scan the QR code or use the deep link in XUMM app. Press Enter to continue checking status...');
        } else {
            console.log('\n⏭️  Skipping prompts, starting status check...');
        }

        // Step 2: Wait for signature
        console.log('\n🔄 Step 2: Waiting for signature...');

        const statusResponse = await waitForSignature(client, payload_id);

        if (!statusResponse) {
            console.error('❌ Sign-in failed or timed out');
            return false;
        }

        // Step 3: Store token
        console.log('\n💾 Step 3: Storing authentication token...');

        const { user_token, wallet_address, jwt } = statusResponse;

        if (!user_token && !jwt) {
            console.error('❌ No token received in response');
            return false;
        }

        const tokenToStore = jwt || user_token;
        const walletAddr = wallet_address || config.walletAddress || 'unknown';

        if (!tokenToStore) {
            console.error('❌ No valid token to store');
            return false;
        }

        // Store the token
        storeToken(config.username, tokenToStore, walletAddr);

        console.log('\n✅ Sign-in Test Completed Successfully!');
        console.log('='.repeat(50));
        console.log(`👤 Username: ${config.username}`);
        console.log(`💼 Wallet: ${walletAddr}`);
        console.log(`🔑 Token: ${tokenToStore.substring(0, 20)}...`);
        console.log('='.repeat(50));

        return true;

    } catch (error) {
        console.error('❌ Sign-in test failed:', error);
        return false;
    }
}

/**
 * Main function
 */
async function main(): Promise<void> {
    const config = parseSignInArgs();

    if (!config) {
        process.exit(1);
    }

    const success = await runSignInTest(config);

    if (!success) {
        console.error('\n❌ Sign-in test failed');
        process.exit(1);
    }

    // Show tokens summary
    console.log('\n📊 Current Tokens Summary:');
    displayTokensSummary();

    console.log('\n🎉 Sign-in test completed successfully!');
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n\n👋 Sign-in test interrupted');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n\n👋 Sign-in test terminated');
    process.exit(0);
});

// Run if executed directly
if (require.main === module) {
    main().catch(error => {
        console.error('\n💥 Unexpected error:', error);
        process.exit(1);
    });
}

export { runSignInTest, parseSignInArgs };