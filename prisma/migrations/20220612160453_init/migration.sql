-- CreateEnum
CREATE TYPE "FileStatus" AS ENUM ('archived', 'inbox', 'trash', 'deleted');

-- CreateEnum
CREATE TYPE "UrlStatus" AS ENUM ('downloaded', 'skipped', 'failed', 'deleted', 'exists', 'blacklisted');

-- CreateEnum
CREATE TYPE "Site" AS ENUM ('danbooru', 'gelbooru', 'pixiv', 'yandere', 'fanbox', 'twitter', 'unknown');

-- CreateEnum
CREATE TYPE "Namespace" AS ENUM ('character', 'creator', 'series', 'tag', 'meta');

-- CreateEnum
CREATE TYPE "Rating" AS ENUM ('safe', 'questionable', 'explicit');

-- CreateEnum
CREATE TYPE "Interval" AS ENUM ('daily', 'weekly', 'monthly');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'running', 'paused', 'finished');

-- CreateTable
CREATE TABLE "files" (
    "id" SERIAL NOT NULL,
    "createDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateDate" TIMESTAMP(3) NOT NULL,
    "filename" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "hash" TEXT NOT NULL,
    "status" "FileStatus" NOT NULL DEFAULT E'inbox',
    "rating" "Rating" NOT NULL DEFAULT E'explicit',

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" SERIAL NOT NULL,
    "tag" TEXT NOT NULL,
    "namespace" "Namespace" NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "urls" (
    "id" TEXT NOT NULL,
    "site" "Site" NOT NULL,
    "url" TEXT NOT NULL,
    "status" "UrlStatus" NOT NULL DEFAULT E'downloaded',

    CONSTRAINT "urls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" SERIAL NOT NULL,
    "createDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateDate" TIMESTAMP(3) NOT NULL,
    "site" "Site" NOT NULL,
    "tags" TEXT[],
    "tagBlacklist" TEXT[],
    "limit" INTEGER NOT NULL DEFAULT 200,
    "status" "SubscriptionStatus" NOT NULL DEFAULT E'active',
    "interval" "Interval" NOT NULL DEFAULT E'daily',
    "nextRun" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "runs" (
    "id" SERIAL NOT NULL,
    "createDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateDate" TIMESTAMP(3) NOT NULL,
    "site" "Site" NOT NULL,
    "tags" TEXT[],
    "status" "SubscriptionStatus" NOT NULL DEFAULT E'running',
    "pageNumber" INTEGER NOT NULL DEFAULT 1,
    "downloadedUrlCount" INTEGER NOT NULL DEFAULT 0,
    "skippedUrlCount" INTEGER NOT NULL DEFAULT 0,
    "failedUrlCount" INTEGER NOT NULL DEFAULT 0,
    "finished" BOOLEAN NOT NULL DEFAULT false,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionLog" (
    "id" TEXT NOT NULL,
    "subscriptionRunId" INTEGER,
    "fileId" INTEGER,
    "url" TEXT NOT NULL,
    "status" "UrlStatus" NOT NULL,
    "createDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_FileToTag" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_FileToUrl" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "files_filename_key" ON "files"("filename");

-- CreateIndex
CREATE UNIQUE INDEX "files_hash_key" ON "files"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "tags_tag_namespace_key" ON "tags"("tag", "namespace");

-- CreateIndex
CREATE UNIQUE INDEX "urls_id_key" ON "urls"("id");

-- CreateIndex
CREATE UNIQUE INDEX "urls_url_key" ON "urls"("url");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_id_key" ON "subscriptions"("id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_site_tags_key" ON "subscriptions"("site", "tags");

-- CreateIndex
CREATE UNIQUE INDEX "runs_id_key" ON "runs"("id");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionLog_id_key" ON "SubscriptionLog"("id");

-- CreateIndex
CREATE UNIQUE INDEX "_FileToTag_AB_unique" ON "_FileToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_FileToTag_B_index" ON "_FileToTag"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_FileToUrl_AB_unique" ON "_FileToUrl"("A", "B");

-- CreateIndex
CREATE INDEX "_FileToUrl_B_index" ON "_FileToUrl"("B");

-- AddForeignKey
ALTER TABLE "runs" ADD CONSTRAINT "runs_site_tags_fkey" FOREIGN KEY ("site", "tags") REFERENCES "subscriptions"("site", "tags") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionLog" ADD CONSTRAINT "SubscriptionLog_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionLog" ADD CONSTRAINT "SubscriptionLog_subscriptionRunId_fkey" FOREIGN KEY ("subscriptionRunId") REFERENCES "runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FileToTag" ADD CONSTRAINT "_FileToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FileToTag" ADD CONSTRAINT "_FileToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FileToUrl" ADD CONSTRAINT "_FileToUrl_A_fkey" FOREIGN KEY ("A") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FileToUrl" ADD CONSTRAINT "_FileToUrl_B_fkey" FOREIGN KEY ("B") REFERENCES "urls"("id") ON DELETE CASCADE ON UPDATE CASCADE;
