-- Create NFT offers table to track sell and buy offers
CREATE TABLE nft_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nft_token_id TEXT NOT NULL,
    offer_type TEXT NOT NULL CHECK (offer_type IN ('sell', 'buy')),
    user_address TEXT NOT NULL,
    amount TEXT NOT NULL DEFAULT '0', -- Amount in drops (XRP)
    owner_address TEXT, -- For buy offers, this is the NFT owner
    
    -- XUMM payload tracking
    payload_id TEXT UNIQUE NOT NULL,
    payload_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    payload_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '10 minutes'),
    
    -- Transaction status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'rejected', 'expired', 'completed', 'failed')),
    tx_hash TEXT, -- XRPL transaction hash when completed
    signed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Additional metadata
    deep_link TEXT,
    qr_code TEXT,
    pushed BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_nft_offers_nft_token_id ON nft_offers(nft_token_id);
CREATE INDEX idx_nft_offers_user_address ON nft_offers(user_address);
CREATE INDEX idx_nft_offers_payload_id ON nft_offers(payload_id);
CREATE INDEX idx_nft_offers_status ON nft_offers(status);
CREATE INDEX idx_nft_offers_offer_type ON nft_offers(offer_type);
CREATE INDEX idx_nft_offers_created_at ON nft_offers(created_at);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_nft_offers_updated_at 
    BEFORE UPDATE ON nft_offers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically expire old pending offers
CREATE OR REPLACE FUNCTION expire_old_offers()
RETURNS void AS $$
BEGIN
    UPDATE nft_offers 
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'pending' 
    AND payload_expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE nft_offers ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see their own offers
CREATE POLICY "Users can view their own offers" ON nft_offers
    FOR SELECT USING (user_address = auth.jwt() ->> 'user_address' OR auth.role() = 'service_role');

-- Policy to allow service role to do everything
CREATE POLICY "Service role can do everything" ON nft_offers
    FOR ALL USING (auth.role() = 'service_role');

-- Policy to allow authenticated users to create offers
CREATE POLICY "Authenticated users can create offers" ON nft_offers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');