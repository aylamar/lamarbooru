<script lang="ts">
    import { goto } from '$app/navigation';
    import { fade } from 'svelte/transition';
    import type { Tag } from '../../stores/file';
    import { hostname } from '../../stores/general';
    import { files, params, tags } from '../../stores/search';
    import { callAPI } from '../../utils/api';

    export let displayTags: Tag[] = [];

    type processedTag = {
        tag: string,
        namespace: string,
        displayTag: string,
        count: number,
        color: string,
    }

    const getColor = (namespace) => {
        switch (namespace) {
            case 'tag':
                return 'text-blue-400';
            case 'creator':
                return 'text-rose-400';
            case 'series':
                return 'text-fuchsia-400';
            case 'character':
                return 'text-emerald-400';
            case 'meta':
                return 'text-slate-400';
            default:
                return 'text-slate-400';
        }
    };

    export let handleTagClick = async (tag: string) => {
        await goto('/files?tags=' + tag, { replaceState: true });
        let endpoint = `/api/file/search/1?tags=${ tag }`;

        files.set([]);
        tags.set([]);
        $params.idx = 1;

        await callAPI({
            host: $hostname, endpoint: endpoint, method: 'GET',
            callback: async (res) => {
                if (res.ok) {
                    $params.idx = $params.idx + 32;
                    $files = [...$files, ...await res.json()];
                }
            },
        });
        return { status: 200 };
    };

    // let processedTags: processedTag[] = [];
    $: processedTags = displayTags.map(tag => {
        return {
            tag: tag.tag,
            namespace: tag.namespace,
            displayTag: tag.tag,
            count: tag._count.files,
            color: getColor(tag.namespace),
        };
    });
</script>

<div class="tags">
    <div class="text-xl font-bold">
        <h3 transition:fade>Tags</h3>
    </div>
    {#if displayTags}
        <p></p>
        <ul class="xs">
            {#each processedTags as tag}
                <li transition:fade>
                    <a on:click={handleTagClick(tag.tag)} class="{tag.color} hover:cursor-pointer">{tag.tag.replace(/_/g, ' ')}</a> <span
                        class="text-slate-500">{tag.count}</span>
                </li>
            {/each}
        </ul>
    {/if}
</div>

<style>
    .xs {
        max-width: 15rem;
    }
</style>
