import { derived, writable } from 'svelte/store';
import type { Post, Tag } from './post';

type Params = {
    searchParams: string;
    idx: number;
}

export const params = writable<Params>({
    searchParams: "",
    idx: 1,
});

type tagData = {
    tag: string,
    _count: number,
    namespace: string,
    accumulator: number,
}
export const derivedParams = derived(params, (params) => {
    if (params.searchParams == null) return ""
    return params.searchParams.replace(/\s/g, "+");
})

export const posts = writable<Post[]>([]);

// iterate through posts and return a list of all tags, then remove duplicates
export const derivedTags = derived(posts, (posts) => {
    let tags: Tag[] = [];

    // get list of all tags
    posts.forEach((post) => {
        tags = tags.concat(...post.tags);
    });

    let tagsWithData: tagData[] = []
    // get tag count for each tag in posts
    for (const tag of tags) {
        // if tag.tag is not in tagsWithData, add it
        if (!tagsWithData.some(t => t.tag === tag.tag)) {
            tagsWithData.push({
                tag: tag.tag,
                _count: tag._count.files,
                namespace: tag.namespace,
                accumulator: 1
            })
        } else {
            // increase accumulator of tag
            const tagIndex = tagsWithData.findIndex(t => t.tag === tag.tag)
            tagsWithData[tagIndex].accumulator++
        }
    }

    // sort tags by accumulator
    tagsWithData = tagsWithData.sort((a, b) => b.accumulator - a.accumulator)
    // get top 20 tags
    tagsWithData = tagsWithData.slice(0, 20)

    return tagsWithData;
})