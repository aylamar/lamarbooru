<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { toast } from '@zerodevx/svelte-toast';
    import { hostname } from '../../stores/general';
    import { files, pageSize, params, tags } from '../../stores/search';
    import { callAPI } from '../../utils/api';

    export let handleFileClick = async (status?: string) => {
        let endpoint = `/api/file/search/1`;
        params.set({
            tagSearchParams: '',
            // searchSpecificStatus: false,
            includeInbox: status === 'inbox',
            includeTrash: status === 'trash',
            includeArchive: status === 'archived',
            isNavigating: true,
            idx: 1,
        });

        let path: string;
        if (status === 'archived') {
            path = `?status=archived`;
        } else if (status === 'inbox') {
            path = `?status=inbox`;
        } else if (status === 'trash') {
            path = `?trash=true`;
        } else {
            path = '';
        }
        endpoint = endpoint + path;
        await goto(`/files${ path }`, { replaceState: true });

        files.set([]);
        tags.set([]);
        $params.idx = 1;

        await callAPI({
            host: $hostname, endpoint: endpoint, method: 'GET',
            callback: async (res) => {
                if (!res.ok) return toast.push(`Error ${ res.statusText }`, {
                    theme: {
                        '--toastBackground': '#F56565',
                        '--toastBarBackground': '#C53030'
                    }
                });

                $params.isNavigating = false;
                $params.idx = $params.idx + $pageSize;
                $files = [...$files, ...await res.json()];
            },
        });
        return { status: 200 };
    };
</script>

<header class="pt-1">
    <nav>
        <a class="pl-4 text-3xl font-bold" href="/">Lamarbooru</a>
        <div class="sm:flex pl-4 py-0.5">
            {#if $page.url.pathname.includes('/files')}
                <a class="bg-slate-800 px-2" href="/files">Files</a>
            {:else}
                <a class="px-2" href="/files">Files</a>
            {/if}
            <a class="px-2" href="/subscriptions">Subscriptions</a>
            <a class="px-2" href="/upload">Upload</a>
        </div>
        {#if $page.url.pathname.includes('/files')}
            <div class="bg-slate-800 pl-2 py-0.5">
                <div class="pl-4 sm:flex space-x-6 bg-slate-800">
                    <a class="hover:cursor-pointer" on:click={handleFileClick()}>Files</a>
                    <a class="hover:cursor-pointer" on:click={handleFileClick('archived')}>Archive</a>
                    <a class="hover:cursor-pointer" on:click={handleFileClick('inbox')}>Inbox</a>
                    <a class="hover:cursor-pointer" on:click={handleFileClick('trash')}>Trash</a>
                </div>
            </div>
        {/if}
    </nav>
</header>
