// Centralized environment/config helper for Supabase functions
// Exposes common env vars and helpers for network URLs and explorers.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

export type EnvConfig = {
    BACKEND_WALLET_SEED: string | undefined;
    BACKEND_WALLET_ADDRESS: string | undefined;
    NETWORK: string;
    XUMM_API_KEY: string | undefined;
    XUMM_API_SECRET: string | undefined;
    JWT_SECRET: string | undefined;
    SESSION_TIMEOUT: number;
};

const cfg: EnvConfig = {
    BACKEND_WALLET_SEED: Deno.env.get("BACKEND_WALLET_SEED") ?? undefined,
    BACKEND_WALLET_ADDRESS: Deno.env.get("BACKEND_WALLET_ADDRESS") ?? undefined,
    NETWORK: Deno.env.get("NETWORK") ?? "testnet",
    XUMM_API_KEY: Deno.env.get("XUMM_API_KEY") ?? undefined,
    XUMM_API_SECRET: Deno.env.get("XUMM_API_SECRET") ?? undefined,
    JWT_SECRET: Deno.env.get("JWT_SECRET") ?? undefined,
    SESSION_TIMEOUT: Number(Deno.env.get("SESSION_TIMEOUT") ?? "3600"),
};

export function getNetworkUrl(network = cfg.NETWORK) {
    return network === "mainnet"
        ? "wss://xrplcluster.com"
        : "wss://s.altnet.rippletest.net:51233/";
}

export function getClioUrl(network = cfg.NETWORK) {
    return network === "mainnet"
        // TODO: fill this after setup Clio mainnet instance
        ? ""
        : "wss://clio.altnet.rippletest.net:51233";
}

export function getExplorerBase(network = cfg.NETWORK) {
    return network === "mainnet" ? "https://livenet.xrpl.org" : "https://testnet.xrpl.org";
}

export function getClientOptions() {
    return {
        timeout: 60_000,
        connectionTimeout: 60_000,
    };
}

export default cfg;
