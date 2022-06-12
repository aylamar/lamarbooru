<script lang="ts">
    import { fade } from 'svelte/transition';
    import type { Tag } from '../../stores/file';

    export let tags: Tag[] = [];

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

    // let processedTags: processedTag[] = [];
    $: processedTags = tags.map(tag => {
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
    {#if tags}
        <p></p>
        <ul class="xs">
            {#each processedTags as tag}
                <li transition:fade>
                    <a href="/files/?tags={tag.tag}" class={tag.color}>{tag.tag.replace(/_/g, ' ')}</a> <span
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
