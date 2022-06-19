<script lang="ts">
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { hostname } from '../../lib/stores/general';
    import { subscription } from '../../lib/stores/subscription';
    import { callAPI } from '../../lib/utils/api';
    import { formatDate } from '../../lib/utils/formatting.js';
    import { getStatusStyle, getStyle } from '../../lib/utils/subscription.js';

    onMount(async () => {
        await callAPI({
            host: $hostname, endpoint: `/api/subscription/${ $page.params.id }`, method: 'GET',
            callback: async (res) => {
                if (res.ok) {
                    subscription.set(await res.json());
                }
            },
        });
    });
</script>

<div class="rounded-xl bg-slate-800/25">
    {#if $subscription.runs}
        <div class="relative rounded-xl">
            <div class="shadow-sm mb-8">
                <table class="text-md w-full">
                    <thead>
                    <tr>
                        <th class="p-3 w-16 font-medium text-slate-200 tracking-wide text-left">ID</th>
                        <th class="p-3 w-20 font-medium text-slate-200 tracking-wide text-left">Status</th>
                        <th class="p-3 font-medium text-slate-200 tracking-wide text-left">Downloaded Urls</th>
                        <th class="p-3 font-medium text-slate-200 tracking-wide text-left">Skipped Urls</th>
                        <th class="p-3 font-medium text-slate-200 tracking-wide text-left">Failed Urls</th>
                        <th class="p-3 font-medium text-slate-200 tracking-wide text-right">Start Date</th>
                        <th class="p-3 font-medium text-slate-200 tracking-wide text-right">Finish Date</th>
                        <th class="p-3 font-medium text-slate-200 tracking-wide text-right">Update Date</th>
                        <th class="p-3 font-medium text-slate-200 tracking-wide text-right">More Details</th>
                    </tr>
                    </thead>
                    {#each $subscription.runs as run, i}
                        <tr class={getStyle(i)}>
                            <td class="p-3 text-slate-400">{run.id}</td>
                            <td class="p-3 text-slate-400">
                                <span class={getStatusStyle(run.status)}>{run.status}</span>
                            </td>
                            <td class="p-3 text-slate-400">{run.downloadedUrlCount}</td>
                            <td class="p-3 text-slate-400">{run.skippedUrlCount}</td>
                            <td class="p-3 text-slate-400">{run.failedUrlCount}</td>
                            <td class="p-3 text-slate-400 text-right">{formatDate(run.createDate)}</td>
                            <td class="p-3 text-slate-400 text-right">{formatDate(run.finishDate)}</td>
                            <td class="p-3 text-slate-400 text-right">{formatDate(run.updateDate)}</td>
                            <td class="p-3 text-right">
                                <a class="text-sky-400" href={`/subscriptions/logs/${run.id}`}>Log Details</a>
                            </td>
                        </tr>
                    {/each}
                </table>
            </div>
        </div>
    {/if}
</div>
