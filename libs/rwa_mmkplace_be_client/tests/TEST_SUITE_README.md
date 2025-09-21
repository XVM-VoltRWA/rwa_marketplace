# RWA Marketplace Test Suite

A comprehensive test suite for the RWA Marketplace backend client with JWT token management and user-based testing.

## Overview

This test suite provides separate commands for testing different marketplace functionality:

- **Sign-in**: Authenticate users and store JWT tokens
- **NFT Creation**: Create NFTs using stored authentication
- **Offer Creation**: Create buy/sell offers using stored authentication

Each test stores JWT tokens mapped to usernames, enabling multi-user testing scenarios.

## Quick Start

### 1. Sign in a user

```bash
npm run test:signin alice
```

This will:

- Create XUMM sign-in payload
- Display QR code for mobile signing
- Store JWT token in `tests/tokens/alice-token.json`

### 2. Create NFT

```bash
npm run test:create-nft alice
```

Uses stored JWT token to create an NFT.

### 3. Create Sell Offer

```bash
npm run test:offer alice sell
```

Creates a sell offer using stored authentication.

### 4. Create Buy Offer (different user)

```bash
npm run test:signin bob
npm run test:offer bob buy
```

## Available Commands

### Test Suite Runner (Recommended)

```bash
# Interactive help
npm run test:suite --help

# Sign in user
npm run test:suite signin <username>

# Create NFT
npm run test:suite nft <username>

# Create offers
npm run test:suite offer <username> sell
npm run test:suite offer <username> buy

# Management commands
npm run test:suite tokens          # List all stored tokens
npm run test:suite delete <user>   # Delete stored token
npm run test:suite config          # Manage configuration
npm run test:suite workflow        # Interactive workflow guide
npm run test:suite clean          # Delete all tokens
```

### Individual Test Commands

```bash
# Sign-in test
npm run test:signin <username> [options]
npm run test:signin alice --wallet=rAlice123...

# NFT creation test
npm run test:create-nft <username> [options]
npm run test:create-nft alice --name="My NFT" --image="https://example.com/nft.png"

# Offer creation test
npm run test:offer <username> <type> [options]
npm run test:offer alice sell --nft-token-id=000B013A... --price=1.5
npm run test:offer bob buy --nft-token-id=000B013A... --price=2.0
```

## Command Options

### Sign-in Options

- `--wallet=ADDRESS`: Specific wallet address to sign in
- `--api-url=URL`: API base URL
- `--timeout=MS`: Request timeout
- `--skip-prompts`: Skip interactive prompts

### NFT Creation Options

- `--name=NAME`: NFT name
- `--image=URL`: NFT image URL
- `--skip-prompts`: Skip interactive prompts
- `--wait`: Wait for NFT creation completion

### Offer Creation Options

- `--nft-token-id=ID`: NFT Token ID (required, 64-character hex)
- `--price=XRP`: Offer price in XRP (e.g., --price=1.5)
- `--skip-prompts`: Skip interactive prompts (requires --nft-token-id and --price)
- `--wait`: Wait for offer creation completion

## Multi-User Workflow Example

```bash
# 1. Seller workflow
npm run test:suite signin seller
npm run test:suite nft seller
npm run test:suite offer seller sell

# 2. Buyer workflow (different wallet)
npm run test:suite signin buyer
npm run test:suite offer buyer buy

# 3. Check stored tokens
npm run test:suite tokens
```

## Detailed Examples

### Create Sell Offers

```bash
# Sell for 1.5 XRP
npm run test:offer alice sell --nft-token-id=000B013A95F14B0E... --price=1.5

# Transfer NFT (0 price)
npm run test:offer alice sell --nft-token-id=000B013A95F14B0E... --price=0

# Interactive mode (will prompt for price)
npm run test:offer alice sell --nft-token-id=000B013A95F14B0E...
```

### Create Buy Offers

```bash
# Buy offer for 2.0 XRP
npm run test:offer bob buy --nft-token-id=000B013A95F14B0E... --price=2.0

# Interactive mode (will prompt for price)
npm run test:offer charlie buy --nft-token-id=000B013A95F14B0E...
```

### Automated Testing

```bash
# Skip prompts (requires all parameters)
npm run test:offer alice sell --nft-token-id=000B013A95F14B0E... --price=1.0 --skip-prompts

# Wait for XUMM completion
npm run test:offer bob buy --nft-token-id=000B013A95F14B0E... --price=1.2 --wait
```

## Token Storage

JWT tokens are stored in `tests/tokens/<username>-token.json`:

```json
{
  "jwt": "eyJhbGciOiJIUzI1NiIs...",
  "walletAddress": "rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "username": "alice",
  "createdAt": "2025-09-21T10:30:00.000Z",
  "expiresAt": "2025-09-22T10:30:00.000Z"
}
```

Tokens are automatically validated for expiry before use.

## Configuration

Test configuration is stored in `tests/test-config.json`:

```json
{
  "apiBaseUrl": "http://127.0.0.1:54321",
  "timeout": 60000
}
```

Manage configuration:

```bash
npm run test:suite config
```

## Interactive Workflow Guide

For complete step-by-step testing:

```bash
npm run test:suite workflow
```

This guides you through:

1. Seller sign-in
2. NFT creation
3. Sell offer creation
4. Buyer sign-in
5. Buy offer creation

## File Structure

```
tests/
├── test-utils.ts      # Utility functions and token management
├── test-signin.ts     # Sign-in test suite
├── test-create-nft.ts # NFT creation test suite
├── test-offer.ts      # Offer creation test suite
├── test-suite.ts      # Main test runner
├── tokens/            # Stored JWT tokens (auto-created)
│   ├── alice-token.json
│   └── bob-token.json
└── test-config.json   # Test configuration (auto-created)
```

## Error Handling

Common issues and solutions:

### No token found

```
❌ No valid token found for user: alice
💡 Please run sign-in test first: npm run test:signin alice
```

### Token expired

```
⚠️ Token for alice has expired
```

Re-run sign-in: `npm run test:signin alice`

### API connection failed

Check API URL in configuration:

```bash
npm run test:suite config
```

## Environment Variables

You can also use environment variables:

```bash
export RWA_API_BASE_URL="https://api.example.com"
export RWA_WALLET_ADDRESS="rYourWallet..."
export RWA_SKIP_PROMPTS="true"

npm run test:signin alice
```

## Notes

- Each test can be run independently
- Tests preserve state through stored JWT tokens
- Multiple users can be tested simultaneously
- QR codes are displayed for XUMM mobile app signing
- All tests include comprehensive error handling and help messages
- The `--skip-prompts` flag enables automated testing
