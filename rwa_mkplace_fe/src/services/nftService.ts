import type { CreateNFTRequest, CreateNFTResponse, NFTMetadata } from "../types/nft.types";

export type { NFTMetadata, CreateNFTResponse };

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:54321/functions/v1";

export const createNFT = async (request: CreateNFTRequest): Promise<CreateNFTResponse> => {
  const response = await fetch(`${API_BASE_URL}/create-nft-v2`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

export const nftService = {
  createNFT,
};
