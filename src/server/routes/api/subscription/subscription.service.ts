import { Interval, Site } from '@prisma/client';
import { Request, Response } from 'express';
import prisma from '../../../utils/prisma.js';
import { logIdSchema, logSchema, newSubscriptionSchema, subscriptionIdSchema } from './subscription.validation.js';

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
    if (subscription) return res.send(subscription);

    // create subscription if one doesn't exist
    const newSubscription = await prisma.subscription.create({
        data: payload,
    });

    if (!newSubscription) return res.status(500).send({ 'error': 'Subscription not created' });
    return res.send(newSubscription);
}

export async function getSubscriptionAllHandler(req: Request, res: Response) {
    const subscriptions = await prisma.subscription.findMany({
        include: {
            _count: {
                select: { runs: true },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    if (!subscriptions) return res.status(404).send({ 'error': 'No subscriptions found' });
    return res.send(subscriptions);
}

export async function getSubscriptionByIdHandler(req: Request, res: Response) {
    let data: { id: number };
    try {
        data = await subscriptionIdSchema.validateAsync(req.params);
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

export async function getRunsByTagsHandler(req: Request, res: Response) {
    let data: {
        site: string;
        tags: string[];
    };
    try {
        data = await logSchema.validateAsync(req.body);
    } catch (err: any) {
        return res.status(400).send(err.details);
    }

    const runs = await prisma.subscriptionRun.findMany({
        where: {
            AND: [
                { tags: { hasEvery: data.tags } },
                { site: await getSite(data.site) },
            ],
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    if (!runs) return res.status(404).send({ 'error': 'No runs found' });
    res.send(runs);
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
            log: true,
        },
    });

    if (!logs) return res.status(404).send({ 'error': 'No logs found' });
    res.send(logs);
}

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
