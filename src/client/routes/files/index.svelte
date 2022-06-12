<script lang="ts">
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import Search from '../../lib/components/search/search.svelte';
    import Tags from '../../lib/components/search/tags.svelte';
    import Thumbnail from '../../lib/components/search/thumbnail.svelte';
    import { hostname } from '../../lib/stores/general';
    import { derivedTags, files, params } from '../../lib/stores/search';
    import { callAPI } from '../../lib/utils/api';

    onMount(async () => {
        let param = $page.url.searchParams.get('tags');
        if (!param) param = '';
        $files = [];
        params.set({
            searchParams: param,
            idx: 1,
        });
        void await fetchFiles();
    });

    async function fetchFiles() {
        let endpoint = `/api/file/search/${ $params.idx }`;
        if ($params.searchParams) endpoint += `?tags=${ $params.searchParams }`;
        $params.idx = $params.idx + 32;

        await callAPI({
            host: $hostname, endpoint: endpoint, method: 'GET',
            callback: async (res) => {
                if (res.ok) {
                    $files = [...$files, ...await res.json()];
                }
            },
        });

    }

    let intersectionObserver;

    function ensureIntersectionObserver() {
        if (intersectionObserver) return;
        intersectionObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    // console.log(entry.isIntersecting);
                    const eventName = entry.isIntersecting ? 'enterViewport' : 'exitViewport';
                    entry.target.dispatchEvent(new CustomEvent(eventName));
                });
            },
            {
                threshold: 0.5,
                rootMargin: '0px',
            },
        );
    }

    function viewport(element) {
        ensureIntersectionObserver();
        intersectionObserver.observe(element);
        return {
            destroy() {
                intersectionObserver.unobserve(element);
            },
        };
    }
</script>

<div class="flex-none space-x-4 md:flex">
    <div class="w-60 sidebar">
        <Search searchParams={$params.searchParams}/>
        {#if $derivedTags.length > 0}
            <Tags tags={$derivedTags}/>
        {/if}
    </div>

    <div class="flex flex-auto flex-wrap">
        {#each $files as file}
            <Thumbnail filename={file.filename} id={file.id} status={file.status}/>
        {/each}
        <div on:enterViewport={() => fetchFiles()} use:viewport></div>
    </div>
</div>

<style>
    .sidebar {
        min-width: 15rem;
    }
</style>
