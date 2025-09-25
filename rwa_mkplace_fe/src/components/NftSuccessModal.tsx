import type { CreateNftResponse } from "../services/api-client";

interface NftSuccessModalProps {
  isOpen: boolean;
  nftResult: CreateNftResponse | null;
  onClose: () => void;
  onCreateAnother: () => void;
}

export const NftSuccessModal = ({
  isOpen,
  nftResult,
  onClose,
  onCreateAnother
}: NftSuccessModalProps) => {
  if (!isOpen || !nftResult) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-md bg-base-100 shadow-2xl border border-base-300">
        {/* Close button */}
        <button
          className="btn btn-circle btn-ghost absolute right-3 top-3 text-xl"
          onClick={onClose}
        >
          ✕
        </button>

        <div className="mb-6 text-center">
          <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-success-content"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-base-content mb-2">
            NFT Created Successfully! 🎉
          </h2>
          <p className="text-base-content/70 text-sm">{nftResult.message}</p>
        </div>

        {/* QR Code Section */}
        {nftResult.acceptance?.qr_code && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">
              Scan with XUMM Wallet to Receive Your NFT
            </h3>
            <div className="bg-white p-4 rounded-xl mx-auto inline-block">
              <img
                src={nftResult.acceptance.qr_code}
                alt="XUMM QR Code"
                className="w-48 h-48 mx-auto"
              />
            </div>
            <p className="text-xs text-base-content/50 mt-2">
              {nftResult.acceptance.instruction}
            </p>
          </div>
        )}

        {/* Manual Instructions */}
        {nftResult.manual_acceptance && (
          <div className="mb-6 text-left">
            <h3 className="text-lg font-semibold mb-2">Manual Instructions</h3>
            <p className="text-sm text-base-content/70 mb-2">
              {nftResult.manual_acceptance.instruction}
            </p>
            <div className="bg-base-200 p-3 rounded-lg">
              <p className="text-xs font-mono break-all">
                Offer Index: {nftResult.manual_acceptance.offer_index}
              </p>
            </div>
          </div>
        )}

        {/* Deep Link for Desktop */}
        {nftResult.acceptance?.deep_link && (
          <div className="mb-6">
            <p className="text-sm text-base-content/70 mb-3">
              On desktop? Click the button below:
            </p>
            <a
              href={nftResult.acceptance.deep_link}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm"
            >
              Open in XUMM App
            </a>
          </div>
        )}

        {/* Transaction Links */}
        <div className="mb-6 text-left">
          <h4 className="font-semibold mb-2">Transaction Details</h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-base-content/70">NFT Token ID:</span>
              <p className="font-mono text-xs break-all bg-base-200 p-2 rounded mt-1">
                {nftResult.nft_token_id}
              </p>
            </div>
            <div className="flex gap-2">
              <a
                href={nftResult.mint_explorer_link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline btn-xs flex-1"
              >
                View Mint
              </a>
              {nftResult.transfer_offer_hash && (
                <a
                  href={`https://testnet.xrpl.org/transactions/${nftResult.transfer_offer_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-xs flex-1"
                >
                  View Transfer
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onCreateAnother} className="btn btn-outline flex-1">
            Create Another
          </button>
          <button onClick={onClose} className="btn btn-primary flex-1">
            Done
          </button>
        </div>
      </div>

      {/* Modal backdrop */}
      <form method="dialog" className="modal-backdrop bg-black/60" onClick={onClose}>
        <button>close</button>
      </form>
    </dialog>
  );
};