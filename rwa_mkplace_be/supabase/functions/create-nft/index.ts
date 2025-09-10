/**
 * Basic NFT Creation Endpoint
 * 
 * Simple NFT minting on XRPL using backend wallet
 * 
 * Method: POST
 * 
 * Input:
 * {
 *   name: string,
 *   image_url: string,
 *   owner_address: string,
 *   metadata?: object
 * }
 * 
 * Output:
 * {
 *   success: boolean,
 *   nft_token_id: string,
 *   transaction_hash: string,
 *   explorer_link: string
 * }
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Client, Wallet } from "npm:xrpl@3.1.0";
import { XummSdk } from "npm:xumm-sdk@1.11.2";
import QRCode from "npm:qrcode@1.5.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { name, image_url, owner_address, metadata } = await req.json();

    if (!name || !image_url || !owner_address) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: name, image_url, owner_address" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get environment variables
    const BACKEND_WALLET_SEED = Deno.env.get("BACKEND_WALLET_SEED");
    const BACKEND_WALLET_ADDRESS = Deno.env.get("BACKEND_WALLET_ADDRESS");
    const NETWORK = Deno.env.get("NETWORK") || "testnet";
    const XUMM_API_KEY = Deno.env.get("XUMM_API_KEY");
    const XUMM_API_SECRET = Deno.env.get("XUMM_API_SECRET");

    if (!BACKEND_WALLET_SEED || !BACKEND_WALLET_ADDRESS) {
      throw new Error("Backend wallet not configured");
    }

    // Connect to XRPL
    const networkUrl =
      NETWORK === "mainnet"
        ? "wss://xrplcluster.com"
        : "wss://s.altnet.rippletest.net:51233";

    console.log(`Connecting to ${NETWORK} at ${networkUrl}...`);
    const client = new Client(networkUrl);
    await client.connect();

    // Create wallet from seed
    const wallet = Wallet.fromSeed(BACKEND_WALLET_SEED);
    console.log("Minting NFT from wallet:", wallet.address);

    // Prepare NFT metadata
    const nftMetadata = {
      name,
      image: image_url,
      ...(metadata || {}),
    };

    // Convert metadata to hex-encoded URI
    const metadataString = JSON.stringify(nftMetadata);
    const encoder = new TextEncoder();
    const metadataBytes = encoder.encode(metadataString);
    const metadataHex = Array.from(metadataBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();

    // Create NFT mint transaction
    const nftMint = {
      TransactionType: "NFTokenMint" as const,
      Account: wallet.address,
      URI: metadataHex,
      Flags: 8, // tfTransferable
      NFTokenTaxon: 0,
      TransferFee: 0, // No royalties for simplicity
    };

    console.log("Submitting NFT mint transaction...");

    // Submit and wait for validation
    const mintResponse = await client.submitAndWait(nftMint, {
      wallet,
      autofill: true,
    });

    const txMeta = mintResponse.result.meta as unknown as Record<string, unknown>;
    const txResult = txMeta?.TransactionResult as string;

    if (txResult !== "tesSUCCESS") {
      await client.disconnect();
      throw new Error(`NFT minting failed: ${txResult}`);
    }

    const txHash = mintResponse.result.hash;
    console.log("NFT minted successfully! Transaction:", txHash);

    // Extract NFT Token ID from metadata
    let nftTokenId = (txMeta?.nftoken_id as string) || null;

    // If not directly available, search in AffectedNodes
    if (!nftTokenId) {
      const affectedNodes =
        (txMeta?.AffectedNodes as Array<Record<string, unknown>>) || [];
      for (const node of affectedNodes) {
        const createdNode = node.CreatedNode as Record<string, unknown>;
        const modifiedNode = node.ModifiedNode as Record<string, unknown>;

        if (
          createdNode?.LedgerEntryType === "NFTokenPage" ||
          modifiedNode?.LedgerEntryType === "NFTokenPage"
        ) {
          const nodeData = createdNode || modifiedNode;
          const nfTokens =
            ((nodeData?.NewFields as Record<string, unknown>)
              ?.NFTokens as Array<Record<string, unknown>>) ||
            ((nodeData?.FinalFields as Record<string, unknown>)
              ?.NFTokens as Array<Record<string, unknown>>) ||
            [];

          // For created pages, all NFTs are new
          if (createdNode && nfTokens.length > 0) {
            const nfToken = nfTokens[0].NFToken as Record<string, unknown>;
            nftTokenId = nfToken.NFTokenID as string;
            break;
          }

          // For modified pages, find the new NFT
          if (modifiedNode) {
            const prevTokens =
              ((nodeData?.PreviousFields as Record<string, unknown>)
                ?.NFTokens as Array<Record<string, unknown>>) || [];
            const finalTokens =
              ((nodeData?.FinalFields as Record<string, unknown>)
                ?.NFTokens as Array<Record<string, unknown>>) || [];

            // Find token that exists in final but not in previous
            for (const finalToken of finalTokens) {
              const nfToken = finalToken.NFToken as Record<string, unknown>;
              const tokenId = nfToken.NFTokenID as string;
              const existedBefore = prevTokens.some((pt) => {
                const prevToken = pt.NFToken as Record<string, unknown>;
                return prevToken.NFTokenID === tokenId;
              });
              if (!existedBefore) {
                nftTokenId = tokenId;
                break;
              }
            }
          }
        }
      }
    }

    // Create transfer offer to owner_address
    if (!nftTokenId) {
      await client.disconnect();
      throw new Error("Failed to extract NFT Token ID from mint transaction");
    }

    console.log(`Creating transfer offer to owner: ${owner_address}...`);
    
    const transferOffer = {
      TransactionType: "NFTokenCreateOffer" as const,
      Account: wallet.address,
      NFTokenID: nftTokenId,
      Destination: owner_address,
      Amount: "0", // Free transfer
      Flags: 1 // tfSellToken flag for sell offer
    };

    const transferResponse = await client.submit(transferOffer, {
      wallet,
      autofill: true
    });

    let transferTxHash = null;
    let transferStatus = "failed";
    let offerIndex = null;
    let xummQrCode = null;
    let xummDeepLink = null;
    let xummPayloadId = null;
    
    if (transferResponse.result.engine_result === "tesSUCCESS") {
      transferTxHash = transferResponse.result.tx_json.hash;
      transferStatus = "success";
      console.log(`Transfer offer created successfully: ${transferTxHash}`);

      // Get the offer index from the transaction result
      // Wait a moment for the transaction to be validated
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Query for NFT sell offers
      const sellOffersRequest = {
        command: "nft_sell_offers",
        nft_id: nftTokenId
      };

      try {
        const sellOffersResponse = await client.request(sellOffersRequest as any);
        const offers = (sellOffersResponse.result as any).offers || [];
        
        // Find our offer (free transfer to owner_address)
        const ourOffer = offers.find((offer: any) => 
          offer.amount === "0" && 
          offer.destination === owner_address
        );

        if (ourOffer) {
          offerIndex = ourOffer.nft_offer_index;
          console.log(`Found offer index: ${offerIndex}`);

          // Create XUMM payload for accepting the offer
          if (XUMM_API_KEY && XUMM_API_SECRET) {
            const xumm = new XummSdk(XUMM_API_KEY, XUMM_API_SECRET);

            const payload = await xumm.payload.create({
              txjson: {
                TransactionType: "NFTokenAcceptOffer",
                Account: owner_address,
                NFTokenSellOffer: offerIndex
              },
              options: {
                submit: true,
                expire: 10
              }
            });

            if (payload) {
              xummPayloadId = payload.uuid;
              xummDeepLink = `https://xumm.app/sign/${payload.uuid}`;
              xummQrCode = await QRCode.toDataURL(xummDeepLink);
              console.log(`Created XUMM payload for acceptance: ${xummPayloadId}`);
            }
          }
        }
      } catch (err) {
        console.log("Could not fetch offer index:", err);
      }
    } else {
      console.log(`Transfer offer failed: ${transferResponse.result.engine_result}`);
    }

    await client.disconnect();

    // Generate explorer links
    const explorerBase =
      NETWORK === "mainnet"
        ? "https://livenet.xrpl.org"
        : "https://testnet.xrpl.org";

    const mintExplorerLink = `${explorerBase}/transactions/${txHash}`;
    const transferExplorerLink = transferTxHash ? `${explorerBase}/transactions/${transferTxHash}` : null;

    const response: any = {
      success: true,
      nft_token_id: nftTokenId,
      mint_transaction_hash: txHash,
      mint_explorer_link: mintExplorerLink,
      transfer_offer_hash: transferTxHash,
      transfer_offer_link: transferExplorerLink,
      transfer_status: transferStatus,
      network: NETWORK,
      minter_address: wallet.address,
      owner_address: owner_address
    };

    // Add XUMM acceptance info if available
    if (xummQrCode && xummDeepLink && xummPayloadId) {
      response.acceptance = {
        qr_code: xummQrCode,
        deep_link: xummDeepLink,
        payload_id: xummPayloadId,
        offer_index: offerIndex,
        instruction: "Scan this QR code with XUMM to accept the NFT transfer"
      };
      response.message = "NFT minted! Scan the QR code to accept the transfer to your wallet.";
    } else if (transferStatus === "success") {
      response.message = "NFT minted and transfer offer created! Accept the offer in XUMM manually.";
      response.manual_acceptance = {
        offer_index: offerIndex,
        instruction: "Open XUMM and look for pending NFT offers to accept this transfer"
      };
    } else {
      response.message = "NFT minted successfully but transfer offer failed. NFT remains with minter.";
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error minting NFT:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Failed to mint NFT",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});