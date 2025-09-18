import type { SignInRequest, SignInResponse, SignInStatusResponse } from "../types/xumm.types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:54321/functions/v1";

/**
 * Create a XUMM sign-in request and get QR code
 */
export const createSignInRequest = async (request?: SignInRequest): Promise<SignInResponse> => {
  const response = await fetch(`${API_BASE_URL}/xumm-signin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request || {}),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Sign-in request failed: ${error}`);
  }

  return await response.json();
};

/**
 * Check the status of a sign-in request and retrieve user token
 */
export const checkSignInStatus = async (payloadId: string): Promise<SignInStatusResponse> => {
  const response = await fetch(`${API_BASE_URL}/xumm-signin?payload_id=${payloadId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Status check failed: ${error}`);
  }

  return await response.json();
};

/**
 * Poll for sign-in completion
 * Checks every 2 seconds for up to 5 minutes
 */
export const pollSignInStatus = async (
  payloadId: string,
  onStatusUpdate?: (status: SignInStatusResponse) => void,
  maxAttempts = 150 // 5 minutes with 2 second intervals
): Promise<SignInStatusResponse> => {
  let attempts = 0;

  const checkStatus = async (): Promise<SignInStatusResponse> => {
    attempts++;

    const status = await checkSignInStatus(payloadId);

    if (onStatusUpdate) {
      onStatusUpdate(status);
    }

    // Return if signed, expired, or cancelled
    if (status.signed || status.expired || status.cancelled) {
      return status;
    }

    // Continue polling if still pending
    if (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      return checkStatus();
    }

    // Timeout after max attempts
    throw new Error("Sign-in request timed out");
  };

  return checkStatus();
};

export const xummService = {
  createSignInRequest,
  checkSignInStatus,
  pollSignInStatus,
};