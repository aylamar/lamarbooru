<script context="module" lang="ts">
    import type { File } from '../../lib/stores/file';
    import { files, params } from '../../lib/stores/search';

    export async function load({ fetch, url }) {
        const param: string = url.searchParams.get('tags');
        let res: Response;

        if (param) {
            res = await fetch(`${ import.meta.env.VITE_BASE_URL }api/file/search/1?tags=${ param }`);
        } else {
            res = await fetch(`${ import.meta.env.VITE_BASE_URL }api/file/search/1`);
        }

        if (res.ok) {
            params.set({
                searchParams: param,
                idx: 1,
            });

            const filesVar: File[] = await res.json();
            files.set(filesVar);
            return { status: 200 };
        } else {
            return {
                status: res.status,
                error: new Error(res.statusText),
            };
        }
    }
</script>

<script lang="ts">
    import { derivedTags } from '../../lib/stores/search';
    import Tags from '../../lib/components/search/tags.svelte';
    import Search from '../../lib/components/search/search.svelte';
    import Thumbnail from '../../lib/components/search/thumbnail.svelte';

    async function fetchFiles() {
        let res: Response;

        if ($params.searchParams) {
            res = await fetch(`${ import.meta.env.VITE_BASE_URL }api/file/search/${ $params.idx + 32 }/${ $params.searchParams }`);
        } else {
            res = await fetch(`${ import.meta.env.VITE_BASE_URL }api/file/search/${ $params.idx + 32 }`);
        }

        if (res.ok) {
            $params.idx = $params.idx + 32;
            $files = [...$files, ...await res.json()];
        }
    }

    let intersectionObserver;

    function ensureIntersectionObserver() {
        if (intersectionObserver) return;
        intersectionObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    console.log(entry.isIntersecting);
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
        <Tags tags={$derivedTags}/>
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