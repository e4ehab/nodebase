-- AlterTable
ALTER TABLE "Credential" ADD COLUMN "type" "CredentialType" NOT NULL DEFAULT 'OPENAI';

-- Remove default after backfilling existing rows
ALTER TABLE "Credential" ALTER COLUMN "type" DROP DEFAULT;
