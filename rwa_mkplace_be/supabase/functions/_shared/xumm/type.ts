export type XummPayloadResult = {
    uuid: string;
    deepLink: string;
    qrCodeDataUrl: string;
};

export type XummPayloadBody = {
    txjson: Record<string, unknown>;
    options?: { submit?: boolean; expire?: number };
};