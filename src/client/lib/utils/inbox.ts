import { writable } from 'svelte/store';

export type InboxItem = {
    id: number,
    status: Status,
}

enum Status {
    archived = 'archived',
    trash = 'trash',
    skipped = 'skipped',
}

export const inboxChanges = writable([] as InboxItem[]);
export const inboxIndex = writable(0);

type inboxEntry = {
    newIdx: number;
    inboxItem: InboxItem
}

export function processInboxItem(key: string, idx: number, fileId: number): inboxEntry {
    switch (key) {
        case 'ArrowRight':
            return {
                newIdx: idx + 1, inboxItem:
                    { id: fileId, status: Status.archived },
            };
        case 'ArrowUp':
            return {
                newIdx: idx + 1, inboxItem:
                    { id: fileId, status: Status.skipped },
            };
        case 'ArrowDown':
            return {
                newIdx: idx + 1, inboxItem:
                    { id: fileId, status: Status.trash },
            };
        case 'ArrowLeft':
            return {
                newIdx: idx - 1, inboxItem:
                    { id: fileId, status: Status.skipped },
            };
        default:
            throw new Error(`Unknown key: ${ key }`);
    }
}
