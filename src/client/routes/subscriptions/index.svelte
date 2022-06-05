<script lang="ts">
    import { onMount } from 'svelte';
    import type { Subscription } from '../../lib/stores/subscription';
    import { subscriptions } from '../../lib/stores/subscriptions';

    onMount(async () => {

        let res: Response = await fetch(`${ import.meta.env.VITE_BASE_URL }api/subscription`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': 'http://localhost*' },
            mode: 'cors',
        });
        const data: Subscription[] = await res.json();
        if (res.ok) {
            subscriptions.set(data);
        } else {
            return {
                status: res.status,
                error: res.statusText,
            };
        }
    });

    const formatDate = (date) => {
        let d = new Date(date),
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();
        if (month.length < 2)
            month = '0' + month;
        if (day.length < 2)
            day = '0' + day;
        return [year, month, day].join('/');
    };

    const formatDateTime = (date) => {
        // return yyyy/mm/dd hh:mm
        let d = new Date(date),
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear(),
            hour = '' + d.getHours(),
            min = '' + d.getMinutes();
        if (month.length < 2)
            month = '0' + month;
        if (day.length < 2)
            day = '0' + day;
        if (hour.length < 2)
            hour = '0' + hour;
        if (min.length < 2)
            min = '0' + min;
        return [year, month, day].join('/') + ' ' + [hour, min].join(':');
    };
</script>
<div class="not-prose relative bg-slate-50 rounded-xl overflow-hidden dark:bg-slate-800/25">
    {#if $subscriptions.length >= 1}
        <div class="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]"></div>
        <div class="relative rounded-xl overflow-auto">
            <div class="shadow-sm overflow-hidden my-8">
                <table class="border-collapse w-full text-md">
                    <thead>
                    <tr>
                        <th class="border-b dark:border-slate-600 font-medium p-3 pl-8 pt-0 pb-3 dark:text-slate-200 text-left">
                            ID
                        </th>
                        <th class="border-b dark:border-slate-600 font-medium p-3 pl-8 pt-0 pb-3 dark:text-slate-200 text-left">
                            Site
                        </th>
                        <th class="border-b dark:border-slate-600 font-medium p-3 pl-8 pt-0 pb-3 dark:text-slate-200 text-left">
                            Tags
                        </th>
                        <th class="border-b dark:border-slate-600 font-medium p-3 pl-8 pt-0 pb-3 dark:text-slate-200 text-left">
                            Blacklisted Tags
                        </th>
                        <th class="border-b dark:border-slate-600 font-medium p-3 pl-8 pt-0 pb-3 dark:text-slate-200 text-left">
                            Status
                        </th>
                        <th class="border-b dark:border-slate-600 font-medium p-3 pl-8 pt-0 pb-3 dark:text-slate-200 text-left">
                            Interval
                        </th>
                        <th class="border-b dark:border-slate-600 font-medium p-3 pl-8 pt-0 pb-3 dark:text-slate-200 text-left">
                            Next Run
                        </th>
                        <th class="border-b dark:border-slate-600 font-medium p-3 pl-8 pt-0 pb-3 text-slate-400 dark:text-slate-200 text-left">
                            Total Runs
                        </th>
                        <th class="border-b dark:border-slate-600 font-medium p-3 pl-8 pt-0 pb-3 dark:text-slate-200 text-left">
                            Image Limit
                        </th>
                        <th class="border-b dark:border-slate-600 font-medium p-3 pl-8 pt-0 pb-3 dark:text-slate-200 text-left">
                            Create Date
                        </th>
                        <th class="border-b dark:border-slate-600 font-medium p-3 pl-8 pt-0 pb-3 dark:text-slate-200 text-left">
                            More Details
                        </th>
                    </tr>
                    </thead>
                    {#each $subscriptions as sub}
                        <tr>
                            <td class="border-b border-slate-100 dark:border-slate-700 p-3 pl-8 dark:text-slate-400">{sub.id}</td>
                            <td class="border-b border-slate-100 dark:border-slate-700 p-3 pl-8 dark:text-slate-400">{sub.site}</td>
                            <td class="border-b border-slate-100 dark:border-slate-700 p-3 pl-8 dark:text-slate-400">{sub.tags}</td>
                            <td class="border-b border-slate-100 dark:border-slate-700 p-3 pl-8 dark:text-slate-400">{sub.tagBlacklist.join(' ') || 'None'}</td>
                            <td class="border-b border-slate-100 dark:border-slate-700 p-3 pl-8 dark:text-slate-400">{sub.status}</td>
                            <td class="border-b border-slate-100 dark:border-slate-700 p-3 pl-8 dark:text-slate-400">{sub.interval}</td>
                            <td class="border-b border-slate-100 dark:border-slate-700 p-3 pl-8 dark:text-slate-400">{formatDateTime(sub.nextRun)}</td>
                            <td class="border-b border-slate-100 dark:border-slate-700 p-3 pl-8 text-slate-500 dark:text-slate-400">{sub._count.runs}</td>
                            <td class="border-b border-slate-100 dark:border-slate-700 p-3 pl-8 dark:text-slate-400">{sub.limit}</td>
                            <td class="border-b border-slate-100 dark:border-slate-700 p-3 pl-8 dark:text-slate-400">{formatDate(sub.createdAt)}</td>
                            <td class="border-b border-slate-100 dark:border-slate-700 p-3 pl-8 dark:text-slate-400"><a
                                    href={`/subscriptions/${sub.id}`}>More Details</a></td>
                        </tr>
                    {/each}
                </table>
            </div>
        </div>
    {:else}
        <p>Loading...</p>
    {/if}
</div>
