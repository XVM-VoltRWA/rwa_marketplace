export interface XummWebhookPayload {
    meta: {
        exists: boolean;
        uuid: string;
        multisign: boolean;
        submit: boolean;
        destination: string;
        resolved_destination: string;
        resolved: boolean;
        signed: boolean;
        cancelled: boolean;
        expired: boolean;
        pushed: boolean;
        app_opened: boolean;
        return_url_app: string | null;
        return_url_web: string | null;
    };
    custom_meta: {
        identifier: string | null;
        blob: string | null;
        instruction: string | null;
    };
    payloadResponse: {
        txid: string;
        resolved_at: string;
        dispatched_nodetype: string;
        dispatched_to: string;
        account: string;
        environment_nodeuri: string;
        environment_networkendpoint: string;
    } | null;
}

export interface WebhookResponse {
    success: boolean;
    message: string;
    offer_id?: string;
}