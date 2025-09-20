Flow

- 6. 7. 8 is not implemented

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant YourBackend
    participant XamanAPI
    participant XRPLLedger

    User->>Frontend: Clicks "Mint NFT" button
    Frontend->>YourBackend: 1. Request to Start Minting Process
    activate YourBackend
    YourBackend->>XamanAPI: 2. Create Payload (Signed Request)
    activate XamanAPI
    XamanAPI-->>YourBackend: 3. Returns Payload URL/QR Code
    deactivate XamanAPI
    YourBackend-->>Frontend: 4. Send URL/QR Code to Frontend
    deactivate YourBackend

    Frontend->>User: Displays QR Code/URL for user
    User->>XamanAPI: 5. Scans QR Code & signs in Xaman Wallet
    activate XamanAPI
    XamanAPI->>YourBackend: 6. **Webhook Notification** (Payload UUID)
    activate YourBackend
    YourBackend->>XamanAPI: 7. Fetch Full Payload Result
    deactivate XamanAPI
    YourBackend->>XRPLLedger: 8. Verify Transaction on Ledger (using txid)
    activate XRPLLedger
    XRPLLedger-->>YourBackend: 9. Ledger Confirmation
    deactivate XRPLLedger

    YourBackend-->>Frontend: 10. Send Final Status (Success/Failure)
    deactivate YourBackend
    Frontend->>User: Confirms NFT minted successfully
```
