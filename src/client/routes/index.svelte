<script context="module" lang="ts">
    import { stats } from '../lib/stores/stats';


    export async function load({ fetch }) {
        const res = await fetch(`${ import.meta.env.VITE_BASE_URL }api/file/stats`);
        stats.set(await res.json());
        return {
            stats: res.status,
        };
    }
</script>

<script lang="ts">
    import { Tag } from '../lib/stores/file';
    import { params, derivedParams, tags } from '../lib/stores/search';
    import { goto } from '$app/navigation';

    export let handleOnSubmit = (e) => {
        console.log('hit');
        e.preventDefault();

        if ($params.searchParams) {
            goto(`/files?tags=${ $derivedParams }`);
            return {
                status: 200,
            };
        } else {
            goto('/files');
            return {
                status: 200,
            };
        }
    };

    async function searchTags() {
        if (!$params.searchParams) return tags.set([]);
        const param = $params.searchParams.split(' ').pop();
        if (!param) return tags.set([]);
        const res = await fetch(`${ import.meta.env.VITE_BASE_URL }api/file/tags/${ param }`);
        const parsedTags: Tag[] = await res.json();
        tags.set(parsedTags.slice(0, 5));
        return;
    }

    async function updateSearchParams(tag) {
        // remove the last param from the search params and replace with the new tag
        const param = $params.searchParams.split(' ');
        param.pop();
        param.push(tag);
        tags.set([]);
        $params.searchParams = param.join(' ') + ' ';
    }
</script>

<div class="grid place-items-center mt-60">
    <div class="grid content-center md:w-1/2 md:max-w-lg">
        <a class="text-4xl font-bold text-center pb-3" href="/files">Lamarbooru</a>

        <div class="flex justify-center space-x-3">
            <a class="text-center font-bold" href="/files">Files</a>
            <a class="text-center font-bold" href="/subscriptions">Subscriptions</a>
        </div>

        <form class="grid grid-cols-4 pb-3" on:input={searchTags} on:submit={handleOnSubmit}>
            <input bind:value={$params.searchParams}
                   class="w-text-slate-400 bg-slate-800 px-3 py-2 rounded-l-md col-span-3 shadow-sm"
                   placeholder="long_hair 1girl"
                   type="search">
            <button class="rounded-r-md font-semibold px-3 py-2 text-sm bg-sky-500 text-white shadow-sm"
                    onclick={handleOnSubmit}>Search
            </button>
            {#if $tags.length > 0}
                <ul class="rounded-b-md bg-slate-700 col-span-4">
                    {#each $tags as tag}
                        <li class="w-text-slate-400 px-3 py-0.5 hover:bg-sky-800 hover:rounded-b-md "
                            on:click={updateSearchParams(tag.tag)}>
                            { tag.tag }
                        </li>
                    {/each}
                </ul>
            {/if}
        </form>

        <div class="grid grid-cols-3">
            <span class="text-center">{$stats.files} Files</span>
            {#if $stats.fileSize / 1024 > 1024}
                <span class="text-center">{Math.round($stats.fileSize / 1024 / 1024 * 100) / 100} GB</span>
            {:else}
                <span class="text-center">{Math.round($stats.fileSize / 1024 * 100) / 100} MB</span>
            {/if}
            <span class="text-center">{$stats.tags} Tags</span>
        </div>
    </div>
</div>
