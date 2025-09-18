import { useState, useEffect } from 'react';
import { useWalletStore } from '../store/walletStore';
import { xummService } from '../services/xummService';
import type { SignInResponse } from '../types/xumm.types';

interface XummSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const XummSignInModal = ({ isOpen, onClose }: XummSignInModalProps) => {
  const [signInPayload, setSignInPayload] = useState<SignInResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  const { setWalletData } = useWalletStore();

  // Create sign-in request when modal opens
  useEffect(() => {
    if (isOpen && !signInPayload) {
      createSignIn();
    }
  }, [isOpen]);

  // Cleanup when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSignInPayload(null);
      setError(null);
      setStatusMessage('');
      setIsLoading(false);
    }
  }, [isOpen]);

  const createSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await xummService.createSignInRequest();
      setSignInPayload(response);
      setStatusMessage('Scan the QR code with your XUMM wallet to sign in');

      // Start polling for sign-in completion
      pollForSignIn(response.payload_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create sign-in request');
      setIsLoading(false);
    }
  };

  const pollForSignIn = async (payloadId: string) => {
    try {
      const status = await xummService.pollSignInStatus(
        payloadId,
        (statusUpdate) => {
          // Update status message based on current state
          if (statusUpdate.status === 'pending') {
            setStatusMessage('Waiting for you to sign in with XUMM...');
          }
        },
        150 // 5 minutes timeout
      );

      if (status.signed && status.user_token && status.wallet_address) {
        // Success!
        setStatusMessage('Successfully signed in!');
        setWalletData(status.wallet_address, status.user_token);

        // Close modal after brief success message
        setTimeout(() => {
          onClose();
        }, 1500);
      } else if (status.cancelled) {
        setError('Sign-in was cancelled');
      } else if (status.expired) {
        setError('Sign-in request expired. Please try again.');
      } else {
        setError('Sign-in failed. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setSignInPayload(null);
    setError(null);
    createSignIn();
  };

  if (!isOpen) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-md">
        <h3 className="font-bold text-lg mb-4">Connect XUMM Wallet</h3>

        {/* Close button */}
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onClose}
        >
          ✕
        </button>

        <div className="py-4">
          {error ? (
            <div className="text-center">
              <div className="alert alert-error mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
              <button className="btn btn-primary" onClick={handleRetry}>
                Try Again
              </button>
            </div>
          ) : signInPayload?.qr_code ? (
            <div className="text-center">
              {/* QR Code */}
              <div className="flex justify-center mb-4">
                <div className="bg-white p-4 rounded-lg">
                  <img
                    src={signInPayload.qr_code}
                    alt="XUMM Sign-In QR Code"
                    className="w-64 h-64"
                  />
                </div>
              </div>

              {/* Status Message */}
              <p className="text-sm text-base-content/70 mb-4">
                {statusMessage}
              </p>

              {/* Deep Link Button (for mobile) */}
              {signInPayload.deep_link && (
                <a
                  href={signInPayload.deep_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm"
                >
                  Open in XUMM App
                </a>
              )}

              {/* Loading indicator */}
              {isLoading && (
                <div className="mt-4">
                  <span className="loading loading-spinner loading-md"></span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <span className="loading loading-spinner loading-lg"></span>
              <p className="mt-4 text-base-content/70">Preparing sign-in...</p>
            </div>
          )}
        </div>

        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>

      {/* Modal backdrop */}
      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button>close</button>
      </form>
    </dialog>
  );
};