<script lang="ts">
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import Thumbnail from '../../../lib/components/search/thumbnail.svelte';
    import { hostname } from '../../../lib/stores/general';
    import { subscriptionLog } from '../../../lib/stores/subscriptionLog';
    import { callAPI } from '../../../lib/utils/api';
    import { formatDate } from '../../../lib/utils/formatting.js';
    import { getStatusStyle, getStyle } from '../../../lib/utils/subscription.js';

    $: isLoading = true;
    $: showImages = false;

    onMount(async () => {
        await callAPI({
            host: $hostname, endpoint: `/api/subscription/logs/${ $page.params.id }`, method: 'GET',
            callback: async (res) => {
                if (res.ok) {
                    subscriptionLog.set(await res.json());
                    isLoading = false;
                }
            },
        });
    });

    function handleToggleImages() {
        showImages = !showImages;
    }

</script>

<div>

    {#if !isLoading}
        <div class="grid place-items-center pb-4">
            <div class="grid grid-cols-4 gap-6 min-w-fit w-3/4 p-4 rounded-lg bg-slate-800/25">
                <div class="px-3 py-2">
                    <span>Run Status: </span><span class="text-right {getStatusStyle($subscriptionLog.status)}">{$subscriptionLog.status}</span>
                </div>
                <div class="px-3 py-2">
                    <p>Download Count: <span>{$subscriptionLog.downloadedUrlCount}</span></p>
                </div>
                <div class="px-3 py-2">
                    <p>Skip Count: <span>{$subscriptionLog.skippedUrlCount}</span></p>
                </div>
                <div class="px-3 py-2">
                    <p>Fail Count: <span>{$subscriptionLog.failedUrlCount}</span></p>
                </div>
                <div>
                    <p>Started: <span>{formatDate($subscriptionLog.createDate)}</span></p>
                </div>
                {#if $subscriptionLog.finishDate != null}
                    <div>
                        <span>Finished: </span><span class="text-right">{formatDate($subscriptionLog.finishDate)}</span>
                    </div>
                {/if}
                <button class="rounded-md font-semibold pl-3 py-2 text-sm bg-sky-500 text-white shadow-sm"
                        on:click={handleToggleImages}>{showImages ? 'Show Logs' : 'Show Images'}
                </button>
            </div>
        </div>
    {/if}


    {#if !isLoading && !showImages}
        <div class="rounded-xl bg-slate-800/25">
            <div class="relative rounded-xl">
                <div class="shadow-sm mb-8">
                    <table class="text-md w-full">
                        <thead>
                        <tr>
                            <th class="p-3 font-medium text-slate-200 tracking-wide text-left">URL</th>
                            <th class="p-3 font-medium text-slate-200 tracking-wide text-right">Status</th>
                            <th class="p-3 font-medium text-slate-200 tracking-wide text-right">File</th>
                            <th class="p-3 font-medium text-slate-200 tracking-wide text-right">Create Date</th>
                        </tr>
                        </thead>
                        {#each $subscriptionLog.log as log, i}
                            <tr class={getStyle(i)}>
                                <td class="p-3">
                                    <a class="text-sky-400" href={log.url}>{log.url}</a>
                                </td>
                                <td class="p-3 text-slate-400 text-right">{log.status}</td>
                                {#if log.file}
                                    <td class="p-3 text-right">
                                        <a class="text-sky-400" href="/files/{log.file.id}">{log.file.status}</a>
                                    </td>
                                {:else}
                                    <td class="p-3 text-right"></td>
                                {/if}
                                <td class="p-3 text-slate-400 text-right">{formatDate(log.createDate)}</td>
                            </tr>
                        {/each}
                    </table>
                </div>
            </div>
        </div>

    {:else if !isLoading && showImages}
        <div class="flex flex-auto flex-wrap">
            {#each $subscriptionLog.log as log}
                {#if log.file}
                    <Thumbnail filename={log.file.filename} status={log.file.status} id={log.file.id}/>
                {/if}
            {/each}
        </div>
    {/if}
</div>
