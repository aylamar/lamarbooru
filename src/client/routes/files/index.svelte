<script lang="ts" context="module">
    import { toast } from '@zerodevx/svelte-toast';
    import { get } from 'svelte/store';
    import { derivedParams, files, pageSize, params } from '../../lib/stores/search';
    import { callAPI } from '../../lib/utils/api';

    export async function load({ url }) {
        const urlObj = new URL(url);

        let param = urlObj.searchParams.get('tags');
        const status = urlObj.searchParams.get('status');
        const trash = urlObj.searchParams.get('trash');
        const host = urlObj.host;

        // split status into array
        let parsedStatus: string[];
        if (status) parsedStatus = status.split('+');

        if (!param) param = '';
        params.set({
            tagSearchParams: param,
            // searchSpecificStatus: status == 'archive+inbox',
            includeArchive: parsedStatus && parsedStatus.includes('archived'),
            includeInbox: parsedStatus && parsedStatus.includes('inbox'),
            includeTrash: trash == 'true',
            isNavigating: false,
            idx: 1 + get(pageSize),
        });

        let endpoint = `/api/file/search/1?${ get(derivedParams) }`;
        return await callAPI({
            host: host, endpoint: endpoint, method: 'GET',
            callback: async (res) => {
                if (!res.ok) return toast.push(`Error ${ res.statusText }`, {
                    theme: {
                        '--toastBackground': '#F56565',
                        '--toastBarBackground': '#C53030'
                    }
                });
                let body = await res.json();
                files.set(body);
                return {
                    files: body,
                    params: get(params)
                };
            },
        });
    }


</script>

<script lang="ts">
    import Search from '../../lib/components/search/search.svelte';
    import Tags from '../../lib/components/search/tags.svelte';
    import Thumbnail from '../../lib/components/search/thumbnail.svelte';
    import { hostname } from '../../lib/stores/general';
    import { derivedTags } from '../../lib/stores/search';

    async function fetchFiles() {
        let endpoint = `/api/file/search/${ $params.idx }?${ $derivedParams }`;
        $params.idx = $params.idx + $pageSize;

        await callAPI({
            host: $hostname, endpoint: endpoint, method: 'GET',
            callback: async (res) => {
                if (!res.ok) return toast.push(`Error ${ res.statusText }`, {
                    theme: {
                        '--toastBackground': '#F56565',
                        '--toastBarBackground': '#C53030'
                    }
                });
                let body = await res.json();
                if (body.length == 0) {
                    toast.push(`Displaying all matching files.`, {
                        theme: {
                            '--toastBackground': '#48BB78',
                            '--toastBarBackground': '#2F855A'
                        }
                    });
                    return $params.isNavigating = true;
                }

                $params.isNavigating = false;
                $files = [...$files, ...body];
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
