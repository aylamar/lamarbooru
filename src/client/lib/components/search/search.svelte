<script lang="ts">
    import { goto } from '$app/navigation';
    import { toast } from '@zerodevx/svelte-toast';
    import { Tag } from '../../stores/file';
    import { hostname } from '../../stores/general';
    import { derivedParams, files, pageSize, params, tags } from '../../stores/search';
    import { callAPI } from '../../utils/api';

    export let handleOnSubmit = async (e) => {
        e.preventDefault();

        // reset search results
        files.set([]);
        tags.set([]);
        $params.idx = 1;

        await goto(`/files?${ $derivedParams }`, { replaceState: true });
        let endpoint = `/api/file/search/${ $params.idx }?${ $derivedParams }`;

        await callAPI({
            host: $hostname, endpoint: endpoint, method: 'GET',
            callback: async (res) => {
                if (!res.ok) return toast.push(`Error ${ res.statusText }`, {
                    theme: {
                        '--toastBackground': '#F56565',
                        '--toastBarBackground': '#C53030'
                    }
                });

                $params.idx = $params.idx + $pageSize;
                $files = [...$files, ...await res.json()];
                return
            },
        });
        return { status: 200 };
    };

    async function searchTags() {
        if (!$params.tagSearchParams) return tags.set([]);
        const param = $params.tagSearchParams.split(' ').pop();
        if (!param) return tags.set([]);

        await callAPI({
            host: $hostname, endpoint: `/api/tag/search/${ param }`, method: 'GET',
            callback: async (res: Response) => {
                if (!res.ok) return toast.push(`Error ${ res.statusText }`, {
                    theme: {
                        '--toastBackground': '#F56565',
                        '--toastBarBackground': '#C53030'
                    }
                });

                const parsedTags: Tag[] = await res.json();
                tags.set(parsedTags.slice(0, 5));
            },
        });
        return { status: 200 };
    }

    async function updateSearchParams(tag) {
        // remove the last param from the search params and replace with the new tag
        const param = $params.tagSearchParams.split(' ');
        param.pop();
        param.push(tag);
        tags.set([]);
        $params.tagSearchParams = param.join(' ') + ' ';
        return { status: 200 };
    }

</script>

<div class="search pb-2">
    <form on:input={searchTags} on:submit={handleOnSubmit}>
        <input bind:value={$params.tagSearchParams}
               class="w-60 w-text-slate-400 bg-slate-800 px-3 py-2 rounded-md focus:rounded-t-md"
               placeholder="Search for tags..." type="search"/>
    </form>
    {#if $tags.length > 0}
        <ul class="rounded-b-md bg-slate-700 w-60 absolute">
            {#each $tags as tag}
                <li class="w-text-slate-400 px-3 py-0.5 hover:bg-sky-800 hover:rounded-b-md "
                    on:click={updateSearchParams(tag.tag)}>
                    { tag.tag }
                </li>
            {/each}
        </ul>
    {/if}

    <!--    <div class="">-->
    <!--        <input bind:checked={$params.searchSpecificStatus} class="rounded-full border-2 "-->
    <!--               type="checkbox"/>-->
    <!--        <span class="w-text-slate-400">Search for specific status</span>-->
    <!--    </div>-->

    <!--    {#if $params.searchSpecificStatus === 'tmp'}-->
    <!--        <div class="">-->
    <!--            <input type="checkbox" bind:checked={$params.includeArchive}-->
    <!--                   class="rounded-full border-2 "/>-->
    <!--            <span class="w-text-slate-400">Archive</span>-->
    <!--        </div>-->
    <!--        <div class="">-->
    <!--            <input type="checkbox" bind:checked={$params.includeInbox}-->
    <!--                   class="rounded-full border-2 "/>-->
    <!--            <span class="w-text-slate-400">Inbox</span>-->
    <!--        </div>-->
    <!--        <div class="">-->
    <!--            <input type="checkbox" bind:checked={$params.includeTrash}-->
    <!--                   class="rounded-full border-2 "/>-->
    <!--            <span class="w-text-slate-400">Trash</span>-->
    <!--        </div>-->
    <!--    {/if}-->
</div>
