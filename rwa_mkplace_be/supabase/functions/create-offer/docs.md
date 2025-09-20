Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant XummAPI
    participant XRPLClio

    User->>Frontend: Initiates create-offer (sell/buy)
    Frontend->>Backend: POST /create-offer with offer details
    activate Backend
    Backend->>XummAPI: 1. Create XUMM payload (nft offer)
    activate XummAPI
    XummAPI-->>Backend: 2. Returns payload (uuid, deep link, pushed)
    deactivate XummAPI

    alt payload created
      Backend->>Database: 3. Store offer record with payload_id (async)
      Backend-->>Frontend: 4. Return payload info (uuid, deep link, message)
      deactivate Backend

      alt pushed notification
        XummAPI->>User: 5a. Push notification delivered to user's XUMM
        User->>XummAPI: 6a. User signs payload in XUMM
      else QR/deep link
        Frontend->>User: 5b. Show QR or deep link
        User->>XummAPI: 6b. Scans link and signs payload
      end

      XummAPI->>Backend: 7. Webhook or Backend polls payload status
      activate Backend
      Backend->>XRPLClio: 8. Verify transaction / ledger acceptance
      XRPLClio-->>Backend: 9. Ledger confirms or rejects
      Backend-->>Frontend: 10. Final status update (success/failure)
      deactivate Backend
    else payload failed
      Backend-->>Frontend: Error creating payload
      deactivate Backend
    end

```

Notes:

- The backend prepares an XUMM payload for either a sell or buy offer.
- When `pushed` is true, XUMM attempts to deliver a push notification to the user's wallet (requires `xumm_user_token`).
- The backend stores an offer record with `payload_id` so it can reconcile results when XUMM calls the webhook or when polled.
- For buy offers the backend checks token owner using Clio (`nft_info`) before payload creation.
