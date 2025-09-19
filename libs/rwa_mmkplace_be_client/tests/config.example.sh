#!/usr/bin/env bash

# Example configuration for RWA Marketplace CLI Tests
# Copy this file to .env or source it before running tests

# =============================================================================
# API Configuration
# =============================================================================

# RWA Marketplace Backend API Base URL
# Replace with your actual API endpoint
export RWA_API_BASE_URL="https://your-api-endpoint.com"

# Request timeout in milliseconds (default: 60000 = 60 seconds)
export RWA_API_TIMEOUT="60000"

# =============================================================================
# Test Configuration
# =============================================================================

# Enable debug logging (optional)
# export DEBUG="rwa:*"

# Default test values (optional - will prompt if not set)
# export TEST_NFT_NAME="Test NFT"
# export TEST_NFT_IMAGE_URL="https://example.com/image.png"
# export TEST_WALLET_ADDRESS="rYourWalletAddressHere"

# =============================================================================
# XRPL Network Configuration
# =============================================================================

# Network type (testnet/mainnet)
export XRPL_NETWORK="testnet"

# =============================================================================
# Usage Instructions
# =============================================================================

echo "Environment configuration loaded successfully!"
echo ""
echo "API Base URL: $RWA_API_BASE_URL"
echo "Timeout: $RWA_API_TIMEOUT ms"
echo "Network: $XRPL_NETWORK"
echo ""
echo "To run the CLI test:"
echo "  npm run test:cli"
echo ""
echo "To run in development mode:"
echo "  npm run test:dev"
echo ""