Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant XamanAPI
    participant XRPLLedger

    User->>Frontend: Clicks "create NFT" button
    Frontend->>Backend: 1. POST /create-nft
    Backend->>Backend: 2. Mint NFT
    Backend->>Backend: 3. Create sell offer with 0 XRP (give away)
    activate Backend
    Backend->>XamanAPI: 4. Create NFTokenAcceptOffer payload
    activate XamanAPI
    XamanAPI-->>Backend: 5. Returns Payload URL/QR Code
    deactivate XamanAPI
    Backend-->>Frontend: 6. Send URL/QR Code to Frontend
    deactivate Backend

    Frontend->>User: Displays QR Code/URL for user
    User->>XamanAPI: 7. Scans QR Code & signs in Xaman Wallet
    activate XamanAPI
    XamanAPI->>Backend: 6. **Webhook Notification** (Payload UUID)
    activate Backend
    Backend->>XamanAPI: 7. Fetch Full Payload Result
    deactivate XamanAPI
    Backend->>XRPLLedger: 8. Verify Transaction on Ledger (using txid)
    activate XRPLLedger
    XRPLLedger-->>Backend: 9. Ledger Confirmation
    deactivate XRPLLedger

    Backend-->>Frontend: 10. Send Final Status (Success/Failure)
    deactivate Backend
    Frontend->>User: Confirms NFT minted successfully
```
