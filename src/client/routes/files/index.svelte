<script lang="ts">
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import Search from '../../lib/components/search/search.svelte';
    import Tags from '../../lib/components/search/tags.svelte';
    import Thumbnail from '../../lib/components/search/thumbnail.svelte';
    import { hostname } from '../../lib/stores/general';
    import { derivedParams, derivedTags, files, pageSize, params } from '../../lib/stores/search';
    import { callAPI } from '../../lib/utils/api';

    onMount(async () => {
        let param = $page.url.searchParams.get('tags');
        let status = $page.url.searchParams.get('status');
        // split status into array
        let parsedStatus: string[];
        if (status) parsedStatus = status.split('+');

        if (!param) param = '';
        $files = [];
        params.set({
            tagSearchParams: param,
            // searchSpecificStatus: status == 'archive+inbox',
            includeArchive: parsedStatus && parsedStatus.includes('archive'),
            includeInbox: parsedStatus && parsedStatus.includes('inbox'),
            includeTrash: parsedStatus && parsedStatus.includes('trash'),
            isNavigating: true,
            idx: 1,
        });
        void await fetchFiles();
    });

    async function fetchFiles() {
        let endpoint = `/api/file/search/${ $params.idx }?${ $derivedParams }`;
        $params.idx = $params.idx + $pageSize;

        await callAPI({
            host: $hostname, endpoint: endpoint, method: 'GET',
            callback: async (res) => {
                if (res.ok) {
                    $params.isNavigating = false;
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
        <Search searchParams={$params.tagSearchParams}/>
        {#if $derivedTags.length > 0}
            <Tags displayTags={$derivedTags}/>
        {/if}
    </div>

    <div class="flex flex-auto flex-wrap">
        {#each $files as file}
            <Thumbnail filename={file.filename} id={file.id} status={file.status}/>
        {/each}
        {#if $params.isNavigating === false}
            <div on:enterViewport={() => fetchFiles()} use:viewport></div>
        {/if}
    </div>
</div>

<style>
    .sidebar {
        min-width: 15rem;
    }
</style>
