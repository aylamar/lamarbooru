import { Interval, Site, Subscription, SubscriptionRun, SubscriptionStatus, UrlStatus } from '@prisma/client';
import schedule from 'node-schedule';
import { DownloaderService } from '../downloaders/downloader.service.js';
import { logger } from '../server.js';
import prisma from '../utils/prisma.util.js';

export class SubscriptionsService {
    private downloaderService: DownloaderService;
    private isRunning: boolean;

    constructor() {
        this.downloaderService = new DownloaderService();
        this.isRunning = true;
        // start subscriptions that were running when server was shut off
        void this.init();

        // start the subscription scheduler
        schedule.scheduleJob('*/15 * * * *', async () => {
            void await this.runWaitingSubscriptions();
        });
    }

    /*
        Returns the next run for the given subscription.
        @param interval: Interval of the subscription
        @returns Date: next run date
     */
    private static async getNextRunDate(interval: Interval): Promise<Date> {
        const now = new Date();
        switch (interval) {
            case Interval.daily:
                return new Date(now.setDate(now.getDate() + 1));
            case Interval.weekly:
                return new Date(now.setDate(now.getDate() + 7));
            case Interval.monthly:
                return new Date(now.setDate(now.getDate() + 30));
            default:
                return new Date(now.setDate(now.getDate() + 7));
        }
    }

    /*
        Returns the updated count for the given run.
        @param run: Current SubscriptionRun
        @param status: UrlStatus to update count for
     */
    private static async getCount(run: SubscriptionRun, status: UrlStatus) {
        switch (status) {
            case UrlStatus.downloaded:
                return { downloadedUrlCount: run.downloadedUrlCount + 1 };
            case UrlStatus.failed:
                return { failedUrlCount: run.failedUrlCount + 1 };
            default:
                return { skippedUrlCount: run.skippedUrlCount + 1 };

        }
    }

    /*
        Starts a new subscription run.
        @param sub: Subscription to create new run for
        @returns SubscriptionRun: newly created subscription run
     */
    private static async startNewSubscriptionRun(sub: Subscription): Promise<SubscriptionRun> {
        return await prisma.subscriptionRun.create({
            data: {
                site: sub.site,
                tags: sub.tags,
                status: SubscriptionStatus.running,
            },
        });
    }

    /*
        Updates a subscription status
        @param sub: Subscription to update
        @param status: SubscriptionStatus to update to
        @param nextRun?: Date to start the next run
        @returns Subscription: updated subscription
     */
    private static async updateSubscriptionStatus(sub: Subscription, status: SubscriptionStatus, nextRun?: Date): Promise<Subscription> {
        if (nextRun) {
            return prisma.subscription.update({
                where: { id: sub.id },
                data: {
                    status: status,
                    nextRun: nextRun,
                },
            });
        } else {
            return prisma.subscription.update({
                where: { id: sub.id },
                data: { status: status },
            });
        }
    }

    /*
        Updates the status of a subscription run.
        @param run: SubscriptionRun to update
        @param status: SubscriptionStatus to update to
        @param finishTime?: Date to set the finish time to
     */
    private static async updateRunStatus(subRun: SubscriptionRun, status: SubscriptionStatus, finishTime?: Date): Promise<SubscriptionRun> {
        let data: object = { status: status };
        if (finishTime) {
            data = {
                status: status,
                finished: true,
                finishedAt: finishTime,
            };
        }

        return await prisma.subscriptionRun.update({
            where: {
                id: subRun.id,
            },
            data: data,
        });
    }

    /*
        Add a new entry to a subscription run.
        @param run: SubscriptionRun to add entry to
        @param url: URL of the file to add to the log
        @param status: UrlStatus of what happened with the file
        @param fileId?: ID of the file in the database
        @returns SubscriptionRun: updated subscription run
     */
    private static async updateRunCounts(run: SubscriptionRun, url: string, status: UrlStatus, fileId?: number): Promise<SubscriptionRun> {
        const data = await SubscriptionsService.getCount(run, status);

        return await prisma.subscriptionRun.update({
                where: { id: run.id },
                data: {
                    ...data,
                    log: {
                        create: {
                            url: url,
                            status: status,
                            fileId: fileId,
                        },
                    },
                },
            },
        );
    }

    /*
        Updates the current page of a subscription run
        @param run: SubscriptionRun to update
        @param pageNumber: Number of the page most recently processed
        @returns SubscriptionRun: updated subscription run
     */
    private static async updateRunPage(run: SubscriptionRun, pageNumber: number): Promise<SubscriptionRun> {
        return await prisma.subscriptionRun.update({
            where: { id: run.id },
            data: {
                pageNumber: pageNumber,
            },
        });
    }

    /*
        Gets a list of all running subscription runs
        @returns SubscriptionRun[]: list of running subscription runs
     */
    private static async getRunningSubscriptionRuns(): Promise<SubscriptionRun[]> {
        return await prisma.subscriptionRun.findMany({
            where: {
                status: SubscriptionStatus.running,
            },
        });
    }

    /*
        Gets the most recent url from a resumed subscription run
        @param run: SubscriptionRun to get url from
        @returns url?: url of the most recent file
     */
    private static async getMostRecentUrl(sub: Subscription): Promise<string | undefined> {
        const log = await prisma.subscriptionLog.findFirst({
            where: {
                subscriptionRunId: sub.id,
            },
            orderBy: {
                createDate: 'desc',
            },
        });
        return log?.url;
    }

    /*
        Checks to see if a url exists in the database
        @param url: url to check
        @returns urls?: array of matching urls that exist in the database
     */
    private static async checkIfURLInDatabase(url: string) {
        return await prisma.url.findFirst({
            where: {
                url: url,
            },
        });
    }

    /*
        Checks to see if there are any waiting subscriptions
        @returns Subscriptions[]: list of waiting subscriptions
     */
    private static async getWaitingSubscriptions(): Promise<Subscription[]> {
        return await prisma.subscription.findMany({
            where: {
                OR: [
                    {
                        AND: [
                            { status: SubscriptionStatus.active },
                            { nextRun: { lt: new Date() } },
                        ],
                    },
                    {
                        AND: [
                            { status: SubscriptionStatus.finished },
                            { nextRun: { lt: new Date() } },
                        ],
                    },
                ],
            },
        });
    }

    /*
        Gets a list of all subscriptions by tag
        @param tag: list of tags to get subscriptions for
        @param site: site to get subscriptions for
     */
    public async getSubscriptionByTag(tag: string[], site: Site): Promise<Subscription | null> {
        return await prisma.subscription.findUnique({
            where: {
                site_tags: { tags: tag, site: site },
            },
        });
    }

    /*
        Restarts any previously running subscriptions
     */
    private async init() {
        const runningRuns = await SubscriptionsService.getRunningSubscriptionRuns();
        for (const run of runningRuns) {
            // get subscription for run
            const sub = await this.getSubscriptionByTag(run.tags, run.site);
            if (!sub) {
                logger.warn(`Subscription not found for run with id ${ run.id }.`, { label: 'subscription' });
                continue;
            }
            const prevUrl = await SubscriptionsService.getMostRecentUrl(sub);
            logger.info(`Resuming subscription run with id ${ run.id } for subscription ${ sub.id }.`, { label: 'subscription' });
            await this.subscriptionRunner(sub, run, prevUrl);
        }
        this.isRunning = false;
    }

    /*
        Starts any waiting subscriptions
     */
    private async runWaitingSubscriptions() {
        if (this.isRunning) return;
        this.isRunning = true;

        logger.info('Checking for waiting subscriptions...', { label: 'subscription' });
        const waitingSubs = await SubscriptionsService.getWaitingSubscriptions();
        if (waitingSubs.length === 0) {
            logger.info('No waiting subscriptions found.', { label: 'subscription' });
            return;
        }

        for (const sub of waitingSubs) {
            logger.info(`Starting ${ sub.tags.join(' ') } on ${ sub.site }.`, { label: 'subscription' });
            logger.info(`Starting subscription: ${ sub.tags.join(' ') } on ${ sub.site }`, { label: 'subscription' });
            await this.subscriptionRunner(sub);
            logger.info(`Finished ${ sub.tags.join(' ') } on ${ sub.site }.`, { label: 'subscription' });
        }

        this.isRunning = false;
    }

    /*
        Runs a subscription
        @param run: SubscriptionRun being run
        @param limit: Maximum number of files to download process per run
        @param blacklist: List of blacklisted tags
        @param prevUrl?: url of the most recent file processed if run is being resumed
     */
    private async processSubscription(run: SubscriptionRun, limit: number, blacklist: string[], prevUrl?: string) {
        let skippedInARow = 0;
        let prevImg = '';
        let keepRunning = true;
        let resumedRun = false;
        if (prevUrl) resumedRun = true;

        while (keepRunning) {
            // update page number
            run = await SubscriptionsService.updateRunPage(run, run.pageNumber);
            const gallery = await this.downloaderService.exploreGallery(run.site, run.tags, run.pageNumber);

            // finish run if no files found
            if (gallery.length === 0) {
                keepRunning = false;
                break;
            }

            logger.info(`Processing page ${ run.pageNumber } for run id ${ run.id } with ${ run.downloadedUrlCount } files downloaded so far`, { label: 'subscription' });

            for (const url of gallery) {
                if (prevImg === 'skipped') skippedInARow++;
                else skippedInARow = 0;

                if (skippedInARow >= 20 || run.downloadedUrlCount >= limit) {
                    keepRunning = false;
                    break;
                }

                // if this is a resumed run, skip all urls until finding the previous url
                if (resumedRun && url !== prevUrl) continue;
                if (resumedRun && url === prevUrl) {
                    resumedRun = false;
                    continue;
                }

                // check to see if it exists
                const exists = await SubscriptionsService.checkIfURLInDatabase(url);
                if (exists) {
                    run = await SubscriptionsService.updateRunCounts(run, url, UrlStatus.skipped);
                    prevImg = 'skipped';
                    continue;
                }

                // download file
                try {
                    const file = await this.downloaderService.downloadFileFromService(url, blacklist);
                    prevImg = file.status;
                    logger.debug(`URL ${ url } was processed with the ${ file.status.toString() } status.`, { label: 'subscription' });
                    switch (file.status) {
                        case 'success':
                            run = await SubscriptionsService.updateRunCounts(run, url, UrlStatus.downloaded, file.file.id);
                            break;
                        case 'failed':
                            run = await SubscriptionsService.updateRunCounts(run, url, UrlStatus.failed);
                            break;
                        case 'skipped':
                            run = await SubscriptionsService.updateRunCounts(run, url, UrlStatus.skipped);
                            break;
                        case 'exists':
                            run = await SubscriptionsService.updateRunCounts(run, url, UrlStatus.exists);
                            break;
                        case 'blacklisted':
                            run = await SubscriptionsService.updateRunCounts(run, url, UrlStatus.blacklisted);
                            break;
                        default:
                            break;
                    }
                } catch (error) {
                    if (error instanceof Error && error.message.includes('Unsupported Media Type')) {
                        run = await SubscriptionsService.updateRunCounts(run, url, 'skipped');
                        prevImg = 'skipped';
                    } else {
                        run = await SubscriptionsService.updateRunCounts(run, url, 'failed');
                        prevImg = 'failed';
                    }
                }

                // sleep for 1 second to not hammer servers
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            run.pageNumber++;
        }
    }

    /*
        Runs a subscription and generates a run for it
        @param sub: Subscription to run
        @param run: SubscriptionRun if this is a resumed run
        @param prevUrl?: url of the most recent file processed if run is being resumed
     */
    private async subscriptionRunner(sub: Subscription, run?: SubscriptionRun, prevUrl?: string) {
        // if run is not provided, this is a new run so a new run must be created
        if (!run) {
            run = await SubscriptionsService.startNewSubscriptionRun(sub);
            await SubscriptionsService.updateSubscriptionStatus(sub, SubscriptionStatus.running);
        }

        const nextRun = await SubscriptionsService.getNextRunDate(sub.interval);

        await this.processSubscription(run, sub.limit, sub.tagBlacklist, prevUrl);

        await SubscriptionsService.updateRunStatus(run, SubscriptionStatus.finished, new Date());
        await SubscriptionsService.updateSubscriptionStatus(sub, SubscriptionStatus.finished, nextRun);
        logger.info(`finished subscription: ${ sub.tags.join(' ') } on ${ sub.site }`, { label: 'subscription' });
    }
}
