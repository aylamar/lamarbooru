import { derived, writable } from 'svelte/store';

export type Tag = {
    id: string;
    tag: string;
    namespace: string;
    _count: {
        files: number;
    };
};

export type File = {
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

export const file = writable({} as File);
export const fileSettings = writable({
    isEditing: false,
});

export const fileUrl = writable('');
export const originalUrl = writable('');

export const artistTags = derived(file, (file) => {
    let artists = [];
    for (const i in file.tags) {
        if (file.tags[i].namespace === 'creator') {
            artists.push(file.tags[i]);
        }
    }
    return artists;
});

export const characterTags = derived(file, (file) => {
    let characterTags = [];
    for (const i in file.tags) {
        if (file.tags[i].namespace === 'character') {
            characterTags.push(file.tags[i]);
        }
    }
    return characterTags;
});

export const seriesTags = derived(file, (file) => {
    let series = [];
    for (const i in file.tags) {
        if (file.tags[i].namespace === 'series') {
            series.push(file.tags[i]);
        }
    }
    return series;
});

export const metaTags = derived(file, (file) => {
    let meta = [];
    for (const i in file.tags) {
        if (file.tags[i].namespace === 'meta') {
            meta.push(file.tags[i]);
        }
    }
    return meta;
});

export const normalTags = derived(file, (file) => {
    let artists = [];
    for (const i in file.tags) {
        if (file.tags[i].namespace === 'tag') {
            artists.push(file.tags[i]);
        }
    }
    return artists;
});