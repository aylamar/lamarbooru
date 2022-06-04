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
    import { params, derivedParams } from '../lib/stores/search';
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
</script>

<div class="grid place-items-center mt-60">
    <div class="grid grid-rows-4 content-center md:w-1/2 md:max-w-lg">
        <a class="text-4xl font-bold text-center pb-3" href="/files">Lamarbooru</a>
        <div class="flex justify-center">
            <a class="text-center font-bold" href="/files">All Files</a>
        </div>
        <form class="grid grid-cols-4 pb-3" on:submit={handleOnSubmit}>
            <input bind:value={$params.searchParams}
                   class="w-text-slate-400 bg-slate-800 px-3 py-2 rounded-l-md col-span-3 shadow-sm" placeholder="long_hair 1girl"
                   type="search">
            <button class="rounded-r-md font-semibold px-3 py-2 text-sm bg-sky-500 text-white shadow-sm"
                    onclick={handleOnSubmit}>Search
            </button>
        </form>
        <div class="grid grid-cols-2">
            <span class="text-center">{$stats.files} Files</span>
            <span class="text-center">{$stats.tags} Tags</span>
        </div>
    </div>
</div>