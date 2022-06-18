<script lang="ts">
    import { onMount } from 'svelte';
    import { hostname } from '../../lib/stores/general';
    import { subscriptions } from '../../lib/stores/subscriptions';
    import { callAPI } from '../../lib/utils/api';
    import { formatDate} from '../../lib/utils/formatting.js';
    import { getStyle } from '../../lib/utils/subscription';
    import { getStatusStyle } from "../../lib/utils/subscription.js";

    onMount(async () => {
        await callAPI({
            host: $hostname, endpoint: '/api/subscription', method: 'GET',
            callback: async (res) => {
                if (res.ok) {
                    subscriptions.set(await res.json());
                }
            },
        });
    });
</script>
<div class="rounded-xl bg-slate-800/25">
    {#if $subscriptions.length >= 1}
        <div class="relative rounded-xl">
            <div class="shadow-sm my-8">
                <table class="text-md w-full">
                    <thead class="border-b border-slate-700">
                    <tr>
                        <th class="p-3 w-16 font-medium text-slate-200 tracking-wide text-left">ID</th>
                        <th class="p-3 w-24 font-medium text-slate-200 tracking-wide text-left">Site</th>
                        <th class="p-3 font-medium text-slate-200 tracking-wide text-left">Tags</th>
                        <th class="p-3 font-medium text-slate-200 tracking-wide text-right">Blacklisted Tags</th>
                        <th class="p-3 w-20 font-medium text-slate-200 tracking-wide text-right">Status</th>
                        <th class="p-3 w-20 font-medium text-slate-200 tracking-wide text-right">Interval</th>
                        <th class="p-3 w-40 font-medium text-slate-200 tracking-wide text-right">Next Run</th>
                        <th class="p-3 w-28 font-medium text-slate-200 tracking-wide text-right">Total Runs</th>
                        <th class="p-3 w-32 font-medium text-slate-200 tracking-wide text-right">More Details</th>
                    </tr>
                    </thead>
                    {#each $subscriptions as sub, i}
                        <tr class={getStyle(i)}>
                            <td class="p-3 text-slate-400">{sub.id}</td>
                            <td class="p-3 text-slate-400">{sub.site}</td>
                            <td class="p-3 text-slate-400">{sub.tags}</td>
                            <td class="p-3 text-slate-400 text-right">{sub.tagBlacklist.join(' ') || 'none'}</td>
                            <td class="p-3 text-slate-400 text-right">
                                <span class={getStatusStyle(sub.status)}>{sub.status}</span>
                            </td>
                            <td class="p-3 text-slate-400 text-right">{sub.interval}</td>
                            <td class="p-3 text-slate-400 text-right">{formatDate(sub.nextRun)}</td>
                            <td class="p-3 text-slate-400 text-right">{sub._count.runs}</td>
                            <td class="p-3 text-slate-400 text-right">
                                <a href={`/subscriptions/${sub.id}`}>More Details</a>
                            </td>
                        </tr>
                    {/each}
                </table>
            </div>
        </div>
    {:else}
        <p>Loading...</p>
    {/if}
</div>
