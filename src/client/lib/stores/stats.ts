import { writable } from 'svelte/store';

export type stats = {
    files: number,
    tags: number,
    fileSize: number,
}

export const stats = writable({
    files: 0,
    tags: 0,
    fileSize: 0,
});
