import { Client, Wallet } from "npm:xrpl@4.4.0";
import NftService from "./nft/service.ts";
import XummService from "./xumm/index.ts";
import config, { getClioUrl } from "./config/index.ts";
import { getNetworkUrl, getClientOptions } from "./config/index.ts";

export class ServiceProvider {
    private client: Client | null = null;
    private clioClient: Client | null = null;
    private backendWallet: Wallet | null = null;
    private nftService: NftService | null = null;
    private xummService: XummService | null = null;

    async getClient(): Promise<Client> {
        if (this.client) return this.client;
        this.client = new Client(getNetworkUrl(config.NETWORK), getClientOptions());
        await this.client.connect();
        return this.client;
    }

    async getClioClient(): Promise<Client> {
        if (this.clioClient) return this.clioClient;
        if (!config.NETWORK) throw new Error("Clio URL not configured");
        const clioUrl = getClioUrl(config.NETWORK);
        if (!clioUrl) throw new Error("Clio URL not configured for the specified network");
        this.clioClient = new Client(clioUrl, getClientOptions());
        await this.clioClient.connect();
        return this.clioClient;
    }

    getBackendWallet(): Wallet {
        if (!this.backendWallet) {
            if (!config.BACKEND_WALLET_SEED) throw new Error("Backend wallet seed not configured");
            this.backendWallet = Wallet.fromSeed(config.BACKEND_WALLET_SEED);
        }
        return this.backendWallet;
    }

    async getNftService(): Promise<NftService> {
        if (this.nftService) return this.nftService;
        const c = await this.getClient();
        const w = this.getBackendWallet();
        this.nftService = new NftService(c, w);
        return this.nftService;
    }

    getXummService(): XummService {
        if (this.xummService) return this.xummService;
        if (!config.XUMM_API_KEY || !config.XUMM_API_SECRET) {
            throw new Error("XUMM API key/secret not configured");
        }
        this.xummService = new XummService(config.XUMM_API_KEY, config.XUMM_API_SECRET);
        return this.xummService;
    }

    async disconnectAll(): Promise<void> {
        if (this.client) {
            try {
                await this.client.disconnect();
            } catch (err) {
                console.warn("Error disconnecting client:", err);
            }
            this.client = null;
        }
        if (this.clioClient) {
            try {
                await this.clioClient.disconnect();
            } catch (err) {
                console.warn("Error disconnecting clio client:", err);
            }
            this.clioClient = null;
        }
        this.nftService = null;
        this.xummService = null;
        this.backendWallet = null;
    }
}

export function createServiceProvider(): ServiceProvider {
    return new ServiceProvider();
}



