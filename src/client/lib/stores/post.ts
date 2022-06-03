import { writable } from 'svelte/store';

export type Tag = {
    id: string;
    tag: string;
    namespace: string;
    _count: number;
};

export type Post = {
    id: number;
    filename: string;
    createdAt: string;
    updatedAt: string;
    source: string[];
    approved: boolean;
    rating: string;
    uploader: { username: string };
    tags: Tag[];
}

export const post = writable({} as Post);
