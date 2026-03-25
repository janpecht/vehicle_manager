-- Update all existing users to ADMIN role
UPDATE "users" SET "role" = 'ADMIN' WHERE "role" = 'USER';

-- Change the default for new users to ADMIN
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'ADMIN';
