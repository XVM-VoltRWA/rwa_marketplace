import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WalletState } from '../types/xumm.types';
import { signIn, checkSignInStatus } from '../services/api-client';

interface WalletStore extends WalletState {
  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  setWalletData: (address: string, userToken: string) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  pollPayloadStatus: (payloadId: string) => Promise<void>;
}

export const useWalletStore = create<WalletStore>()(
  persist(
    (set) => ({
      // Initial state
      isConnected: false,
      isConnecting: false,
      walletAddress: null,
      xummUserToken: null,
      error: null,

      // Connect wallet via XUMM
      connect: async () => {
        set({ isConnecting: true, error: null });

        try {
          // Create sign-in request
          const signInResponse = await signIn();

          if (!signInResponse.success) {
            throw new Error(signInResponse.error || 'Failed to create sign-in request');
          }

          // Store payload ID for polling
          // This will be handled by the modal component which will call pollPayloadStatus
          set({
            isConnecting: true,
            error: null,
          });

          // Return the payload data to the UI for QR display
          // The modal will handle the polling
          (window as any).__xummSignInPayload = signInResponse;

        } catch (error) {
          set({
            isConnecting: false,
            error: error instanceof Error ? error.message : 'Failed to connect wallet',
          });
          throw error;
        }
      },

      // Poll for sign-in completion
      pollPayloadStatus: async (payloadId: string) => {
        const maxAttempts = 150; // 5 minutes with 2 second intervals
        let attempts = 0;

        const poll = async (): Promise<void> => {
          try {
            const status = await checkSignInStatus(payloadId);
            console.log('Sign-in status:', status.status);

            if (status.status === 'pending') {
              // Continue polling if not resolved and not exceeded max attempts
              if (attempts < maxAttempts) {
                attempts++;
                await new Promise(resolve => setTimeout(resolve, 2000));
                return poll();
              } else {
                throw new Error('Sign-in request expired');
              }
            } else if (status.signed && status.user_token && status.wallet_address) {
              // Successfully signed in
              // Save JWT if provided
              if (status.jwt) {
                localStorage.setItem('jwt_token', status.jwt);
              }

              set({
                isConnected: true,
                isConnecting: false,
                walletAddress: status.wallet_address,
                xummUserToken: status.user_token,
                error: null,
              });
            } else if (status.cancelled) {
              throw new Error('Sign-in was cancelled');
            } else if (status.expired) {
              throw new Error('Sign-in request expired');
            } else {
              throw new Error('Sign-in failed');
            }
          } catch (error) {
            set({
              isConnecting: false,
              error: error instanceof Error ? error.message : 'Failed to complete sign-in',
            });
            throw error;
          }
        };

        return poll();
      },

      // Disconnect wallet
      disconnect: () => {
        set({
          isConnected: false,
          isConnecting: false,
          walletAddress: null,
          xummUserToken: null,
          error: null,
        });
      },

      // Set wallet data (used after successful sign-in)
      setWalletData: (address: string, userToken: string) => {
        set({
          isConnected: true,
          isConnecting: false,
          walletAddress: address,
          xummUserToken: userToken,
          error: null,
        });
      },

      // Error management
      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'rwa-wallet-storage', // localStorage key
      partialize: (state) => ({
        // Only persist these fields
        isConnected: state.isConnected,
        walletAddress: state.walletAddress,
        xummUserToken: state.xummUserToken,
      }),
    }
  )
);