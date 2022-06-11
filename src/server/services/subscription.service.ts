import { Interval, Site, Subscription, SubscriptionRun, SubscriptionStatus, UrlStatus } from '@prisma/client';
import { DownloaderService } from '../downloaders/downloader.service.js';
import prisma from '../utils/prisma.js';

export class SubscriptionsService {
    private downloaderService: DownloaderService;
    private isRunning: boolean;

    constructor() {
        this.downloaderService = new DownloaderService();
        this.isRunning = false;
        // start subscriptions that were running when server was shut off
        void this.init();

        // start the subscription scheduler
        setInterval(() => this.runWaitingSubscriptions(), 15 * 60 * 1000);
    }

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

    private static async getCount(run: SubscriptionRun, status: UrlStatus) {
        switch (status) {
            case UrlStatus.downloaded:
                return { downloadedUrlCount: run.downloadedUrlCount + 1 };
            case UrlStatus.skipped:
                return { skippedUrlCount: run.skippedUrlCount + 1 };
            case UrlStatus.failed:
                return { failedUrlCount: run.failedUrlCount + 1 };
            default:
                return run;
        }
    }

    private static async startNewSubscriptionRun(sub: Subscription): Promise<SubscriptionRun> {
        // create new run
        return await prisma.subscriptionRun.create({
            data: {
                site: sub.site,
                tags: sub.tags,
                status: SubscriptionStatus.running,
            },
        });
    }

    private static async updateSubscriptionStatus(sub: Subscription, status: SubscriptionStatus, nextRun?: Date) {
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

    private static async updateRunStatus(subRun: SubscriptionRun, status: SubscriptionStatus, finishTime?: Date): Promise<SubscriptionRun> {
        // update run
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

    private static async updateRunCounts(run: SubscriptionRun, url: string, status: UrlStatus) {
        const data = await SubscriptionsService.getCount(run, status);

        return await prisma.subscriptionRun.update({
                where: { id: run.id },
                data: {
                    ...data,
                    log: {
                        create: {
                            url: url,
                            status: status,
                        },
                    },
                },
            },
        );
    }

    private static async updateRunPage(run: SubscriptionRun, pageNumber: number) {
        return await prisma.subscriptionRun.update({
            where: { id: run.id },
            data: {
                pageNumber: pageNumber,
            },
        });
    }

    private static async getRunningSubscriptionRuns() {
        return await prisma.subscriptionRun.findMany({
            where: {
                status: SubscriptionStatus.running,
            },
        });
    }

    private static async checkIfURLInDatabase(url: string) {
        return await prisma.url.findFirst({
            where: {
                url: url,
            },
        });
    }

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

    public async getSubscriptionByTag(tag: string[], site: Site): Promise<Subscription | null> {
        return await prisma.subscription.findUnique({
            where: {
                site_tags: { tags: tag, site: site },
            },
        });
    }

    private async init() {
        const runningRuns = await SubscriptionsService.getRunningSubscriptionRuns();
        for (const run of runningRuns) {
            // get subscription for run
            const sub = await this.getSubscriptionByTag(run.tags, run.site);
            if (!sub) {
                console.log(`Subscription not found for run with id ${ run.id }.`);
                continue;
            }
            await this.subscriptionRunner(sub, run);
        }
        this.isRunning = false;
    }

    private async runWaitingSubscriptions() {
        if (this.isRunning) return;
        this.isRunning = true;

        console.log('Checking for waiting subscriptions...');
        const waitingSubs = await SubscriptionsService.getWaitingSubscriptions();
        if (waitingSubs.length === 0) {
            console.log('No waiting subscriptions found.');
            return;
        }

        for (const sub of waitingSubs) {
            console.log(`Starting ${ sub.tags.join(' ') } on ${ sub.site }.`);
            await this.subscriptionRunner(sub).then(() => {
                console.log(`Finished ${ sub.tags.join(' ') } on ${ sub.site }.`);
            });
        }

        this.isRunning = false;
    }

    private async processSubscription(run: SubscriptionRun, limit: number, blacklist: string[]) {
        let skippedInARow = 0;
        let prevImg = '';
        let keepRunning = true;
        while (keepRunning) {
            // update page number
            run = await SubscriptionsService.updateRunPage(run, run.pageNumber);
            const gallery = await this.downloaderService.exploreGallery(run.site, run.tags, run.pageNumber);

            // finish run if no files found
            if (gallery.length === 0) {
                keepRunning = false;
                break;
            }

            console.log(`Processing page ${ run.pageNumber }`);

            for (const url of gallery) {
                if (prevImg === 'skipped') skippedInARow++;
                else skippedInARow = 0;

                if (skippedInARow >= 20 || run.downloadedUrlCount >= limit) {
                    keepRunning = false;
                    break;
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
                    switch (file.status) {
                        case 'success':
                            run = await SubscriptionsService.updateRunCounts(run, url, UrlStatus.downloaded);
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

    private async subscriptionRunner(sub: Subscription, run?: SubscriptionRun) {
        console.log(`starting subscription: ${ sub.tags.join(' ') } on ${ sub.site }`);
        if (!run) {
            run = await SubscriptionsService.startNewSubscriptionRun(sub);
            await SubscriptionsService.updateSubscriptionStatus(sub, SubscriptionStatus.running);
        }

        const nextRun = await SubscriptionsService.getNextRunDate(sub.interval);

        await this.processSubscription(run, sub.limit, sub.tagBlacklist);

        await SubscriptionsService.updateRunStatus(run, SubscriptionStatus.finished, new Date());
        await SubscriptionsService.updateSubscriptionStatus(sub, SubscriptionStatus.finished, nextRun);
        console.log(`finished subscription: ${ sub.tags.join(' ') } on ${ sub.site }`);
    }

}
