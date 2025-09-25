import { useState, useEffect } from 'react';
import { useWalletStore } from '../store/walletStore';
import { signIn, checkSignInStatus, type SignInResponse } from '../services/api-client';

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
      const response = await signIn();
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
    const maxAttempts = 150; // 5 minutes with 2 second intervals
    let attempts = 0;

    const poll = async () => {
      try {
        const status = await checkSignInStatus(payloadId);

        if (status.status === 'pending') {
          setStatusMessage('Waiting for you to sign in with XUMM...');

          // Continue polling if not resolved and not exceeded max attempts
          if (attempts < maxAttempts) {
            attempts++;
            setTimeout(poll, 2000); // Poll every 2 seconds
          } else {
            setError('Sign-in request expired. Please try again.');
            setIsLoading(false);
          }
        } else if (status.signed && status.user_token && status.wallet_address) {
          // Success!
          setStatusMessage('Successfully signed in!');

          console.log('Sign-in status response:', status);

          // Save JWT if provided
          if (status.jwt) {
            console.log('JWT token received, saving to localStorage');
            localStorage.setItem('jwt_token', status.jwt);
          } else {
            console.warn('No JWT token in sign-in response');
          }

          setWalletData(status.wallet_address, status.user_token);

          // Close modal after brief success message
          setTimeout(() => {
            onClose();
          }, 1500);
          setIsLoading(false);
        } else if (status.cancelled) {
          setError('Sign-in was cancelled');
          setIsLoading(false);
        } else if (status.expired) {
          setError('Sign-in request expired. Please try again.');
          setIsLoading(false);
        } else {
          setError('Sign-in failed. Please try again.');
          setIsLoading(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Sign-in failed');
        setIsLoading(false);
      }
    };

    // Start polling
    poll();
  };

  const handleRetry = () => {
    setSignInPayload(null);
    setError(null);
    createSignIn();
  };

  if (!isOpen) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-md bg-base-100 shadow-2xl border border-base-300">
        <h3 className="font-bold text-lg mb-4">Connect XUMM Wallet</h3>

        {/* Close button */}
        <button
          className="btn btn-circle btn-ghost absolute right-3 top-3 text-xl"
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
          ) : signInPayload ? (
            <div className="text-center">
              {/* QR Code */}
              <div className="flex justify-center mb-4">
                <div className="bg-white p-4 rounded-lg">
                  <img
                    src={
                      signInPayload.qr_code ||
                      `https://xumm.app/sign/${signInPayload.payload_id}/qr`
                    }
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

      </div>

      {/* Modal backdrop */}
      <form method="dialog" className="modal-backdrop bg-black/60" onClick={onClose}>
        <button>close</button>
      </form>
    </dialog>
  );
};