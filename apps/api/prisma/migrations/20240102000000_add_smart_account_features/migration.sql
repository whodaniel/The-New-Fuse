-- Add Smart Account fields to existing Wallet table
ALTER TABLE "Wallet" ADD COLUMN "smartAccountAddress" VARCHAR(42);
ALTER TABLE "Wallet" ADD COLUMN "smartAccountSalt" VARCHAR(66);
ALTER TABLE "Wallet" ADD COLUMN "smartAccountDeployed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Wallet" ADD COLUMN "smartAccountEnabled" BOOLEAN NOT NULL DEFAULT false;

-- Add userType to User table for backward compatibility
ALTER TABLE "User" ADD COLUMN "userType" VARCHAR(10);
ALTER TABLE "User" ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "User" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Create unique index for Smart Account addresses
CREATE UNIQUE INDEX "Wallet_smartAccountAddress_key" ON "Wallet"("smartAccountAddress");

-- Create index for Smart Account address lookups
CREATE INDEX "Wallet_smartAccountAddress_idx" ON "Wallet"("smartAccountAddress");

-- Update existing wallets to be backward compatible
UPDATE "Wallet" SET "wallet_type" = 'EOA' WHERE "wallet_type" IS NULL OR "wallet_type" = '';
UPDATE "User" SET "userType" = 'HUMAN' WHERE "userType" IS NULL;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();