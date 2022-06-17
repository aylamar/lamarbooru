/*
  Warnings:

  - The values [trash,deleted] on the enum `FileStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "FileStatus_new" AS ENUM ('archived', 'inbox');
ALTER TABLE "files" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "files" ALTER COLUMN "status" TYPE "FileStatus_new" USING ("status"::text::"FileStatus_new");
ALTER TYPE "FileStatus" RENAME TO "FileStatus_old";
ALTER TYPE "FileStatus_new" RENAME TO "FileStatus";
DROP TYPE "FileStatus_old";
ALTER TABLE "files" ALTER COLUMN "status" SET DEFAULT 'inbox';
COMMIT;

-- AlterTable
ALTER TABLE "files" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "trash" BOOLEAN NOT NULL DEFAULT false;
