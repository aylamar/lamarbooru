import { Interval, Prisma, Site, SubscriptionStatus } from '@prisma/client';
import { Request, Response } from 'express';
import prisma from '../../../utils/prisma.util.js';
import { logIdSchema, newSubscriptionSchema, subIdSchema, subStatusSchema } from './subscription.validation.js';

interface newSubscriptionPayload {
    site: Site;
    tags: string[];
    tagBlacklist: string[];
    interval: Interval;
    limit?: number;
}

export async function newSubscriptionHandler(req: Request, res: Response) {
    let data: {
        site: string;
        tags: string[];
        tagBlacklist?: string[];
        interval: string;
        limit?: number;
    };

    try {
        data = await newSubscriptionSchema.validateAsync(req.body);
    } catch (err: any) {
        return res.status(400).send(err.details);
    }

    const payload: newSubscriptionPayload = {
        site: await getSite(data.site),
        tags: data.tags,
        tagBlacklist: data.tagBlacklist || [],
        interval: await getInterval(data.interval),
        limit: data.limit || 200,
    };

    // check to see if the subscription already exists
    const subscription = await prisma.subscription.findFirst({
        where: {
            AND: [
                { tags: { equals: payload.tags } },
                { site: payload.site },
            ],
        },
    });
    if (subscription) return res.status(200).send(subscription);

    // create subscription if one doesn't exist
    const newSubscription = await prisma.subscription.create({
        data: payload,
    });

    if (!newSubscription) return res.status(500).send({ 'error': 'Subscription not created' });
    return res.status(201).send(newSubscription);
}

export async function getSubscriptionAllHandler(req: Request, res: Response) {
    const subscriptions = await prisma.subscription.findMany({
        include: {
            _count: {
                select: { runs: true },
            },
        },
        orderBy: {
            createDate: 'desc',
        },
    });

    if (!subscriptions) return res.status(404).send({ 'error': 'No subscriptions found' });
    return res.send(subscriptions);
}

export async function getSubscriptionByIdHandler(req: Request, res: Response) {
    let data: { id: number };
    try {
        data = await subIdSchema.validateAsync(req.params);
    } catch (err: any) {
        return res.status(400).send(err.details);
    }

    const subscription = await prisma.subscription.findFirst({
        where: {
            id: data.id,
        },
        include: {
            runs: true,
            _count: {
                select: { runs: true },
            },
        },
        orderBy: {
            id: 'desc',
        },
    });

    if (!subscription) return res.status(404).send({ 'error': 'Subscription not found' });
    res.send(subscription);
}

export async function getLogsByIdHandler(req: Request, res: Response) {
    let data: { id: number };
    try {
        data = await logIdSchema.validateAsync(req.params);
    } catch (err: any) {
        return res.status(400).send(err.details);
    }

    const logs = await prisma.subscriptionRun.findFirst({
        where: {
            id: data.id,
        },
        include: {
            log: {
                include: {
                    file: { include: { tags: true } },
                },
                orderBy: {
                    createDate: 'desc'
                }
            },
        },
    });

    if (!logs) return res.status(404).send({ 'error': 'No logs found' });
    res.send(logs);
}

export async function updateSubStatusHandler(req: Request, res: Response) {
    let params: { id: number };
    let query: { status: string };
    try {
        params = await subIdSchema.validateAsync(req.params);
        query = await subStatusSchema.validateAsync(req.query);
    } catch (err: any) {
        return res.status(400).send(err.details);
    }
    const status = await getStatus(query.status);

    try {
        const subscription = await prisma.subscription.update({
            where: { id: params.id },
            data: { status: status },
        });
        res.status(200).send(subscription);
    } catch (err: any) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) return res.status(404).send({ 'error': 'Subscription not found' });
        return res.status(500).send({ 'error': 'Error updating subscription' });
    }
}

/*


    Begin helper functions


 */

async function getSite(site: string): Promise<Site> {
    switch (site) {
        case 'danbooru':
            return Site.danbooru;
        default:
            return Site.danbooru;
    }
}

async function getInterval(interval: string): Promise<Interval> {
    switch (interval) {
        case 'daily':
            return Interval.daily;
        case 'weekly':
            return Interval.weekly;
        case 'monthly':
            return Interval.monthly;
        default:
            return Interval.weekly;
    }
}

async function getStatus(status: string): Promise<SubscriptionStatus> {
    switch (status) {
        case 'waiting':
            return SubscriptionStatus.waiting;
        case 'paused':
            return SubscriptionStatus.paused;
        case 'running':
            return SubscriptionStatus.running;
        case 'finished':
            return SubscriptionStatus.finished;
        default:
            return SubscriptionStatus.waiting;
    }
}