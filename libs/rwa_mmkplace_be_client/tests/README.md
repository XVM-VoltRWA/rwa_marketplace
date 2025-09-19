# RWA Marketplace Backend Client - CLI Testing

This directory contains CLI tests for the RWA Marketplace Backend Client, demonstrating complete marketplace flows from XUMM sign-in to NFT creation and trading.

## 🚀 Available Test Scripts

### 🎭 **Marketplace Flow (Recommended)**
Complete marketplace workflow with flexible operation modes:
```bash
npm run marketplace
```

### 🔧 **Legacy Test Scripts**
```bash
npm run test         # Interactive CLI test with XUMM sign-in + NFT creation
npm run test:simple  # Simple test without interaction
npm run orchestrate  # Legacy orchestrator (deprecated)
```

## 🎯 **Marketplace Flow Operations**

The marketplace flow supports two main operation modes:

### **1️⃣ SELL MODE** (Default)
Creates NFT + Sell Offer - for NFT creators
```bash
npm run marketplace
```

### **2️⃣ BUY MODE** 
Creates Buy Offer for existing NFT - for NFT buyers
```bash
npm run marketplace -- --nft-token-id=YOUR_NFT_TOKEN_ID
```

## 📝 **Command Examples**

### 🔐 **Sign-in Only**
```bash
# Interactive sign-in with prompts
npm run marketplace

# Sign-in with specific wallet
npm run marketplace -- --wallet=rYourWalletAddress

# Force new sign-in (ignore stored token)
npm run marketplace -- --force-signin

# Sign-in and save configuration
npm run marketplace -- --wallet=rYourWallet --skip-prompts
```

### 🎨 **Create NFT + Sell Offer** (Sell Mode)
```bash
# Default: Create NFT and sell for 1 XRP
npm run marketplace

# Custom NFT with sell offer
npm run marketplace -- \
  --nft-name="My Awesome NFT" \
  --image-url="https://example.com/nft.png" \
  --amount=2000000

# Automated NFT creation (no prompts)
npm run marketplace -- \
  --wallet=rYourWallet \
  --nft-name="Automated NFT" \
  --amount=5000000 \
  --skip-prompts

# Quick NFT with stored authentication
npm run marketplace -- \
  --amount=1500000 \
  --nft-name="Quick NFT" \
  --skip-prompts
```

### 💰 **Create Sell Offer** (for existing NFT)
```bash
# Create sell offer for existing NFT
npm run marketplace -- \
  --nft-token-id=000B013A95F14B0E44F78A264E41713C... \
  --amount=3000000

# Automated sell offer
npm run marketplace -- \
  --nft-token-id=YOUR_NFT_TOKEN_ID \
  --amount=2500000 \
  --skip-prompts
```

### 🛒 **Create Buy Offer** (Buy Mode)
```bash
# Create buy offer for 1.5 XRP
npm run marketplace -- \
  --nft-token-id=000B013A95F14B0E44F78A264E41713C... \
  --amount=1500000

# Automated buy offer
npm run marketplace -- \
  --buy \
  --nft-token-id=YOUR_NFT_TOKEN_ID \
  --amount=1000000 \
  --skip-prompts

# Buy offer with different wallet
npm run marketplace -- \
  --wallet=rBuyerWalletAddress \
  --nft-token-id=YOUR_NFT_TOKEN_ID \
  --amount=2000000 \
  --skip-prompts
```

## 🎮 **Complete Marketplace Scenarios**

### **Scenario 1: NFT Creator Journey**
```bash
# Step 1: Create and list NFT for sale
npm run marketplace -- \
  --wallet=rCreatorWallet \
  --nft-name="Premium Digital Art" \
  --image-url="https://myart.com/premium.png" \
  --amount=10000000 \
  --skip-prompts

# Result: NFT Token ID = 000B013A95F14B0E...
```

### **Scenario 2: NFT Buyer Journey**
```bash
# Step 2: Create buy offer for the NFT
npm run marketplace -- \
  --wallet=rBuyerWallet \
  --nft-token-id=000B013A95F14B0E44F78A264E41713C... \
  --amount=9500000 \
  --skip-prompts
```

### **Scenario 3: Testing Different Price Points**
```bash
# Create NFT and sell offer
npm run marketplace -- --amount=5000000 --nft-name="Test NFT"

# Create competing buy offers (run separately with different wallets)
npm run marketplace -- --nft-token-id=NFT_ID --amount=4500000 --wallet=rBuyer1
npm run marketplace -- --nft-token-id=NFT_ID --amount=4800000 --wallet=rBuyer2
```

## 🏁 **Quick Start Examples**

### **Fastest Test** (with stored authentication)
```bash
npm run marketplace -- --skip-prompts
```

### **Complete Demo Flow**
```bash
# 1. Seller creates NFT + sell offer
export RWA_WALLET_ADDRESS="rSellerWallet..."
npm run marketplace -- --amount=3000000 --skip-prompts

# 2. Buyer creates buy offer (use NFT Token ID from step 1)
export RWA_WALLET_ADDRESS="rBuyerWallet..."
npm run marketplace -- --nft-token-id=NFT_FROM_STEP_1 --amount=2800000 --skip-prompts
```

## ⚙️ **Configuration Flags**

### **Operation Mode**
| Flag | Description | Example |
|------|-------------|---------|
| `--buy` | Force buy mode | `--buy` |
| `--nft-token-id=ID` | NFT Token ID (enables buy mode) | `--nft-token-id=000B013A...` |

### **Authentication**
| Flag | Description | Example |
|------|-------------|---------|
| `--wallet=ADDRESS` | Wallet address | `--wallet=rN7n7otQ...` |
| `--token=TOKEN` | User token | `--token=ABC123...` |
| `--force-signin` | Force new sign-in | `--force-signin` |

### **NFT Configuration** (Sell Mode Only)
| Flag | Description | Example |
|------|-------------|---------|
| `--nft-name=NAME` | NFT name | `--nft-name="My NFT"` |
| `--image-url=URL` | NFT image URL | `--image-url="https://..."` |

### **Offer Configuration**
| Flag | Description | Example |
|------|-------------|---------|
| `--amount=DROPS` | Offer amount in drops | `--amount=2000000` |

### **Behavior**
| Flag | Description | Example |
|------|-------------|---------|
| `--skip-prompts` | Skip interactive prompts | `--skip-prompts` |
| `--api-url=URL` | API endpoint | `--api-url="https://api..."` |
| `--help`, `-h` | Show help | `--help` |

## 💰 **Amount Reference** (XRP to Drops)

```bash
# 0.5 XRP = 500,000 drops
--amount=500000

# 1 XRP = 1,000,000 drops (default)
--amount=1000000

# 2 XRP = 2,000,000 drops
--amount=2000000

# 5 XRP = 5,000,000 drops
--amount=5000000

# 10 XRP = 10,000,000 drops
--amount=10000000
```

## 🌍 **Environment Variables**

```bash
export RWA_WALLET_ADDRESS="rYourWalletAddress"
export RWA_USER_TOKEN="yourStoredToken"
export RWA_API_BASE_URL="https://your-api-endpoint.com"
export RWA_OFFER_AMOUNT="1000000"
export RWA_NFT_TOKEN_ID="000B013A95F14B0E..."
export RWA_NFT_NAME="My NFT"
export RWA_IMAGE_URL="https://example.com/nft.png"
export RWA_SKIP_PROMPTS="true"
export RWA_FORCE_SIGNIN="true"
```

## 📋 **Configuration Priority**

1. **CLI Arguments** (highest priority)
2. **Environment Variables**
3. **Config File** (`rwa-orchestrator-config.json`)
4. **Interactive Prompts** (lowest priority)

## 🎯 **Common Workflows**

### **Development Testing**
```bash
# Quick marketplace test
npm run marketplace -- --skip-prompts

# Test with custom amounts
npm run marketplace -- --amount=5000000 --skip-prompts
```

### **Demo Preparation**
```bash
# Create demo NFT with specific details
npm run marketplace -- \
  --nft-name="Demo NFT Collection #1" \
  --image-url="https://demo.com/nft1.png" \
  --amount=1000000

# Show buy interest
npm run marketplace -- \
  --nft-token-id=DEMO_NFT_ID \
  --amount=900000 \
  --wallet=rDemoBuyerWallet
```

### **Load Testing**
```bash
# Automated NFT creation loop
for i in {1..10}; do
  npm run marketplace -- \
    --nft-name="Load Test NFT $i" \
    --amount=$((1000000 + i * 100000)) \
    --skip-prompts
done
```

## 🔍 **Help and Documentation**

```bash
# Show complete help
npm run marketplace -- --help

# Show available flags and examples
npm run marketplace -- -h
```

## 📊 **Example Output**

### **Sell Mode** (Create NFT + Sell Offer)
```bash
npm run marketplace -- --amount=2000000 --nft-name="Premium NFT"
```

```
🎭 RWA Marketplace Orchestrator
============================================================
� Sell Mode: Create NFT + Sell Offer
============================================================

⚙️ Configuration:
API Base URL: http://127.0.0.1:54321
Mode: 💰 Sell (NFT Creator)
Wallet: rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzY6
Token: ✅ Stored
NFT Name: Premium NFT
Amount: 2000000 drops (2 XRP)

🔐 Step 1: Authentication
✅ Using stored authentication
👤 User Token: ABC123XYZ789...
💼 Wallet Address: rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzY6

🎨 Step 2: Creating NFT
✅ NFT created successfully!
🎨 NFT Token ID: 000B013A95F14B0E44F78A264E41713C64B5F89242540E70C9

💰 Step 3: Creating Sell Offer
✅ Sell offer created successfully!
📋 Sell Offer Payload ID: 12345678-abcd-1234-efgh-123456789abc

📊 Orchestration Summary
============================================================
Mode: 💰 Create NFT + Sell Offer
Authentication: ✅ Success
NFT Creation: ✅ Success
Sell Offer: ✅ Success

🎨 NFT Token ID: 000B013A95F14B0E44F78A264E41713C64B5F89242540E70C9
� Sell Offer ID: 12345678-abcd-1234-efgh-123456789abc

💵 Amount: 2000000 drops (2 XRP)
============================================================

🎉 Orchestration completed successfully!
🎯 NFT created and listed for sale!

💡 Next steps:
• Share NFT Token ID: 000B013A95F14B0E44F78A264E41713C64B5F89242540E70C9
• Buyers can create buy offers using:
  npm run marketplace -- --nft-token-id=000B013A95F14B0E44F78A264E41713C64B5F89242540E70C9 --amount=THEIR_AMOUNT
```

### **Buy Mode** (Create Buy Offer)
```bash
npm run marketplace -- --nft-token-id=000B013A95F14B0E44F78A264E41713C64B5F89242540E70C9 --amount=1800000
```

```
🎭 RWA Marketplace Orchestrator
============================================================
🛒 Buy Mode: Create Buy Offer
============================================================

⚙️ Configuration:
API Base URL: http://127.0.0.1:54321
Mode: 🛒 Buy (NFT Buyer)
NFT Token ID: 000B013A95F14B0E44F78A264E41713C64B5F89242540E70C9
Amount: 1800000 drops (1.8 XRP)

🔐 Step 1: Authentication
✅ Using stored authentication

🛒 Step 2: Creating Buy Offer
📄 Using NFT Token ID: 000B013A95F14B0E44F78A264E41713C64B5F89242540E70C9
✅ Buy offer created successfully!
📋 Buy Offer Payload ID: 87654321-dcba-4321-hgfe-987654321cba

📊 Orchestration Summary
============================================================
Mode: 🛒 Create Buy Offer
Authentication: ✅ Success
Buy Offer: ✅ Success

🛒 Buy Offer ID: 87654321-dcba-4321-hgfe-987654321cba
💵 Amount: 1800000 drops (1.8 XRP)

🎉 Orchestration completed successfully!
🎯 Buy offer submitted!
```
## 🛠️ **Prerequisites**

1. **XUMM App**: Install XUMM on your mobile device
2. **XRPL Account**: A funded testnet or mainnet XRPL account
3. **Network Access**: Internet connection for API calls
4. **Node.js**: Version 16.0.0 or higher

## 📦 **Installation**

```bash
npm install
```

## 🔧 **Troubleshooting**

### **Common Issues**
- **"NFT Token ID required"**: Use `--nft-token-id=YOUR_ID` for buy mode
- **Timeout errors**: Check network and API endpoint
- **Authentication failed**: Try `--force-signin`
- **Invalid amounts**: Use drops (1 XRP = 1,000,000 drops)

### **Debug Mode**
```bash
export DEBUG="rwa:*"
npm run marketplace -- --your-flags
```

## 🔐 **Security Notes**

- User tokens are stored locally in `rwa-orchestrator-config.json`
- Tokens automatically expire after 30 days
- Use `--force-signin` to refresh authentication
- Always verify API endpoints in production

## 🎪 **Ready to Start!**

```bash
# Quick start - Create NFT and sell offer
npm run marketplace

# Quick start - Create buy offer
npm run marketplace -- --nft-token-id=YOUR_NFT_TOKEN_ID --amount=1500000
```

The marketplace flow provides comprehensive testing of all RWA Marketplace operations! 🎭✨
