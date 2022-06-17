<script lang="ts">
    import { goto } from '$app/navigation';
    import { Tag } from '../../stores/file';
    import { hostname } from '../../stores/general';
    import { files, params, tags } from '../../stores/search';
    import { callAPI } from '../../utils/api';

    export let handleOnSubmit = async (e) => {
        e.preventDefault();

        if ($params.searchParams) {
            files.set([]);
            $params.idx = 1;
            await goto(`/files?tags=${ $params.searchParams }`, { replaceState: true });
            let endpoint = `/api/file/search/${ $params.idx }`;
            if ($params.searchParams) endpoint += `?tags=${ $params.searchParams }`;

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
        await callAPI({
            host: $hostname, endpoint: `/api/tag/search/${ param }`, method: 'GET',
            callback: async (res: Response) => {
                const parsedTags: Tag[] = await res.json();
                tags.set(parsedTags.slice(0, 5));
            },
        });
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

<div class="search pb-2">
    <form on:input={searchTags} on:submit={handleOnSubmit}>
        <input bind:value={$params.searchParams}
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
</div>
