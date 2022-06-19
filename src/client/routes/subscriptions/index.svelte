<script lang="ts">
    import { toast } from '@zerodevx/svelte-toast';
    import { onMount } from 'svelte';
    import { hostname } from '../../lib/stores/general';
    import { subscriptions } from '../../lib/stores/subscriptions';
    import { callAPI } from '../../lib/utils/api';
    import { formatDate} from '../../lib/utils/formatting.js';
    import { getStyle } from '../../lib/utils/subscription';
    import { getStatusStyle } from "../../lib/utils/subscription.js";
    $: loading = true;

    onMount(async () => {
        await callAPI({
            host: $hostname, endpoint: '/api/subscription', method: 'GET',
            callback: async (res) => {
                if (res.ok) {
                    loading = false;
                    subscriptions.set(await res.json());
                }
            },
        });
    });

    async function updateSubscriptionStatus(id: number, currStatus: string) {
        let newStatus = 'waiting'
        // if current status is currStatus is waiting or running, set to pause
        if (currStatus === 'waiting' || currStatus === 'running') newStatus = 'paused';

        await callAPI({
            host: $hostname, endpoint: `/api/subscription/${id}?status=${newStatus}` , method: 'PUT',
            callback: async (res) => {
                if (!res.ok) return toast.push(`Error ${ res.statusText }`, {
                    theme: {
                        '--toastBackground': '#F56565',
                        '--toastBarBackground': '#C53030',
                    },
                });

                // update subscription status in store
                subscriptions.update((subs) => {
                    const sub = subs.find((s) => s.id === id);
                    if (sub) sub.status = newStatus;
                    return subs;
                });

                toast.push(`Subscription ${ id } updated to ${ newStatus }`, {
                    theme: {
                        '--toastBackground': '#48BB78',
                        '--toastBarBackground': '#2F855A',
                    },
                });
            },
        });
    }
</script>

<div class="rounded-xl bg-slate-800/25">
    {#if $subscriptions.length >= 1}
        <div class="relative rounded-xl">
            <div class="shadow-sm mb-8">
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
                                <span on:click={updateSubscriptionStatus(sub.id, sub.status)} class={getStatusStyle(sub.status)}>{sub.status}</span>
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
    {:else if $subscriptions.length === 0 && loading === false}
        <div class="p-8">
            <p class="text-center text-slate-200">No subscriptions found.</p>
        </div>
    {:else}
        <div class="p-8">
            <p class="text-center text-slate-200">Loading...</p>
        </div>
    {/if}
</div>
