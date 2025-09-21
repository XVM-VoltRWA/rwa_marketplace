#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { RwaMarketplaceClient } from '../src/client';
import { RwaClientConfig } from '../src/types';

/**
 * Test utilities for JWT token storage and management
 */

interface StoredToken {
    jwt: string;
    walletAddress: string;
    username: string;
    createdAt: string;
    expiresAt?: string;
}

const TOKENS_DIR = join(__dirname, 'tokens');
const CONFIG_FILE = join(__dirname, 'test-config.json');

interface TestConfig {
    apiBaseUrl: string;
    timeout: number;
}

/**
 * Ensure tokens directory exists
 */
export function ensureTokensDir(): void {
    if (!existsSync(TOKENS_DIR)) {
        mkdirSync(TOKENS_DIR, { recursive: true });
    }
}

/**
 * Load test configuration
 */
export function loadTestConfig(): TestConfig {
    const defaultConfig: TestConfig = {
        apiBaseUrl: 'http://127.0.0.1:54321',
        timeout: 60000
    };

    if (existsSync(CONFIG_FILE)) {
        try {
            const config = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
            return { ...defaultConfig, ...config };
        } catch (error) {
            console.warn('⚠️  Failed to load test config, using defaults');
        }
    }

    return defaultConfig;
}

/**
 * Save test configuration
 */
export function saveTestConfig(config: Partial<TestConfig>): void {
    const currentConfig = loadTestConfig();
    const newConfig = { ...currentConfig, ...config };

    try {
        writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2));
        console.log('✅ Test configuration saved');
    } catch (error) {
        console.error('❌ Failed to save test configuration:', error);
    }
}

/**
 * Get token file path for a username
 */
function getTokenFilePath(username: string): string {
    return join(TOKENS_DIR, `${username}-token.json`);
}

/**
 * Store JWT token for a username
 */
export function storeToken(username: string, jwt: string, walletAddress: string, expiresAt?: string): void {
    ensureTokensDir();

    const tokenData: StoredToken = {
        jwt,
        walletAddress,
        username,
        createdAt: new Date().toISOString(),
        expiresAt
    };

    const filePath = getTokenFilePath(username);

    try {
        writeFileSync(filePath, JSON.stringify(tokenData, null, 2));
        console.log(`✅ Token stored for user: ${username}`);
        console.log(`📁 File: ${filePath}`);
    } catch (error) {
        console.error(`❌ Failed to store token for ${username}:`, error);
        throw error;
    }
}

/**
 * Retrieve JWT token for a username
 */
export function getToken(username: string): StoredToken | null {
    const filePath = getTokenFilePath(username);

    if (!existsSync(filePath)) {
        console.warn(`⚠️  No token found for user: ${username}`);
        return null;
    }

    try {
        const tokenData = JSON.parse(readFileSync(filePath, 'utf-8')) as StoredToken;

        // Check if token has expired
        if (tokenData.expiresAt) {
            const expiry = new Date(tokenData.expiresAt);
            const now = new Date();
            if (now >= expiry) {
                console.warn(`⚠️  Token for ${username} has expired`);
                return null;
            }
        }

        console.log(`✅ Token retrieved for user: ${username}`);
        return tokenData;
    } catch (error) {
        console.error(`❌ Failed to retrieve token for ${username}:`, error);
        return null;
    }
}

/**
 * List all stored tokens
 */
export function listTokens(): StoredToken[] {
    ensureTokensDir();

    try {
        const files = require('fs').readdirSync(TOKENS_DIR);
        const tokenFiles = files.filter((f: string) => f.endsWith('-token.json'));

        const tokens: StoredToken[] = [];

        for (const file of tokenFiles) {
            try {
                const content = readFileSync(join(TOKENS_DIR, file), 'utf-8');
                const tokenData = JSON.parse(content) as StoredToken;
                tokens.push(tokenData);
            } catch (error) {
                console.warn(`⚠️  Failed to read token file ${file}`);
            }
        }

        return tokens;
    } catch (error) {
        console.error('❌ Failed to list tokens:', error);
        return [];
    }
}

/**
 * Delete stored token for a username
 */
export function deleteToken(username: string): boolean {
    const filePath = getTokenFilePath(username);

    if (!existsSync(filePath)) {
        console.warn(`⚠️  No token found for user: ${username}`);
        return false;
    }

    try {
        require('fs').unlinkSync(filePath);
        console.log(`✅ Token deleted for user: ${username}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to delete token for ${username}:`, error);
        return false;
    }
}

/**
 * Create authenticated RWA client for a username
 */
export function createAuthenticatedClient(username: string): RwaMarketplaceClient | null {
    const tokenData = getToken(username);

    if (!tokenData) {
        console.error(`❌ Cannot create authenticated client: no valid token for ${username}`);
        return null;
    }

    const config = loadTestConfig();
    const clientConfig: RwaClientConfig = {
        baseURL: config.apiBaseUrl,
        timeout: config.timeout,
        headers: {
            'Authorization': `Bearer ${tokenData.jwt}`,
            'User-Agent': 'RWA-Test-Suite/1.0.0'
        }
    };

    console.log(`✅ Created authenticated client for user: ${username}`);
    return new RwaMarketplaceClient(clientConfig);
}

/**
 * Prompt user for input
 */
export function promptUser(question: string): Promise<string> {
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(question, (answer: string) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Display stored tokens summary
 */
export function displayTokensSummary(): void {
    const tokens = listTokens();

    console.log('\n📋 Stored Tokens Summary');
    console.log('='.repeat(50));

    if (tokens.length === 0) {
        console.log('No stored tokens found');
        return;
    }

    tokens.forEach(token => {
        const status = token.expiresAt ?
            (new Date() < new Date(token.expiresAt) ? '✅ Valid' : '❌ Expired') :
            '⏰ Unknown';

        console.log(`👤 ${token.username}`);
        console.log(`   Wallet: ${token.walletAddress}`);
        console.log(`   Created: ${new Date(token.createdAt).toLocaleString()}`);
        console.log(`   Status: ${status}`);
        console.log('');
    });

    console.log('='.repeat(50));
}