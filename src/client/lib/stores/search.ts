import { derived, writable } from 'svelte/store';
import type { File, Tag } from './file';

type Params = {
    tagSearchParams: string,
    searchSpecificStatus: boolean,
    includeArchive: boolean,
    includeInbox: boolean,
    includeTrash: boolean,
    idx: number,
}


export const params = writable<Params>({
    tagSearchParams: '',
    searchSpecificStatus: false,
    includeArchive: true,
    includeInbox: true,
    includeTrash: false,
    idx: 1,
});

export const searchSpecificStatus = writable<boolean>(false);

export type tagData = {
    tag: string,
    _count: number,
    namespace: string,
    accumulator: number,
}
export const derivedParams = derived(params, (params) => {
    let urlString = '';

    if (params.tagSearchParams != null && params.tagSearchParams != '') urlString += `&tags=${ params.tagSearchParams.trim().replace(/\s/g, '+') }`;

    // if searchSpecificStatus is false, do not bother
    if (params.searchSpecificStatus) {
        let statusString = '';
        if (params.includeArchive) statusString += 'archived+';
        if (params.includeInbox) statusString += 'inbox+';
        if (params.includeTrash) statusString += 'trash+';

        // join statuses together with + and remove last + if statusString is not 'archive+inbox+'
        if (statusString != '' && statusString != 'archive+inbox+') urlString += `&status=${ statusString.slice(0, -1) }`;
    }

    return urlString;
});

export const files = writable<File[]>([]);

// iterate through files and return a list of all tags, then remove duplicates
export const derivedTags = derived(files, (files) => {
    let tags: Tag[] = [];

    // get list of all tags
    files.forEach((file) => {
        tags = tags.concat(...file.tags);
    });

    let tagsWithData: tagData[] = [];
    // get tag count for each tag in files
    for (const tag of tags) {
        // if tag.tag is not in tagsWithData, add it
        if (!tagsWithData.some(t => t.tag === tag.tag)) {
            tagsWithData.push({
                tag: tag.tag,
                //@ts-ignore
                _count: tag._count,
                namespace: tag.namespace,
                accumulator: 1,
            });
        } else {
            // increase accumulator of tag
            const tagIndex = tagsWithData.findIndex(t => t.tag === tag.tag);
            tagsWithData[tagIndex].accumulator++;
        }
    }

    // sort tags by accumulator
    tagsWithData = tagsWithData.sort((a, b) => b.accumulator - a.accumulator);
    // get top 20 tags
    tagsWithData = tagsWithData.slice(0, 20);

    return tagsWithData;
});

export const tags = writable<Tag[]>([]);
