import { writable } from 'svelte/store';

export type Run = {
    id: number,
    createdAt: Date,
    updatedAt: Date,
    site: string,
    tags: string[],
    status: string,
    pageNumber: number,
    downloadedUrlCount: number,
    skippedUrlCount: number,
    failedUrlCount: number,
    finished: boolean,
    finishedAt: Date,
}

export type Subscription = {
    id: number,
    createdAt: Date,
    updatedAt: Date,
    site: string,
    tags: string[],
    tagBlacklist: string[],
    limit: number,
    status: string,
    interval: string,
    nextRun: Date,
    runs: Run[],
    _count: {
        runs: number
    }
}

export type Log = {
    'id': string,
    'subscriptionRunId': number,
    'url': string,
    'status': string,
    'createdAt': Date,
    'updatedAt': Date
}

export const subscription = writable({} as Subscription);
