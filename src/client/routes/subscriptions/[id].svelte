<script context="module" lang="ts">
    import type { Subscription } from '../../lib/stores/subscription';
    import { subscription } from '../../lib/stores/subscription';

    export async function load({ fetch, params }) {
        const id = params.id;
        const res = await fetch(`${ import.meta.env.VITE_BASE_URL }api/subscription/${ id }`);
        const parsedJson: Subscription = await res.json();

        if (res.ok) {
            subscription.set(parsedJson);
            return { status: 200 };
        }

        return {
            status: res.status,
            error: new Error(res.statusText),
        };
    }
</script>

<script lang="ts">
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
    {#if $subscription.runs}
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
                            Status
                        </th>
                        <th class="border-b dark:border-slate-600 font-medium p-3 pl-8 pt-0 pb-3 dark:text-slate-200 text-left">
                            Downloaded Urls
                        </th>
                        <th class="border-b dark:border-slate-600 font-medium p-3 pl-8 pt-0 pb-3 dark:text-slate-200 text-left">
                            Skipped Urls
                        </th>
                        <th class="border-b dark:border-slate-600 font-medium p-3 pl-8 pt-0 pb-3 dark:text-slate-200 text-left">
                            Failed Urls
                        </th>
                        <th class="border-b dark:border-slate-600 font-medium p-3 pl-8 pt-0 pb-3 dark:text-slate-200 text-left">
                            Start Date
                        </th>
                        <th class="border-b dark:border-slate-600 font-medium p-3 pl-8 pt-0 pb-3 dark:text-slate-200 text-left">
                            Finish Date
                        </th>
                        <th class="border-b dark:border-slate-600 font-medium p-3 pl-8 pt-0 pb-3 dark:text-slate-200 text-left">
                            Update Date
                        </th>
                    </tr>
                    </thead>
                    {#each $subscription.runs as run}
                        <tr>
                            <td class="border-b border-slate-100 dark:border-slate-700 p-3 pl-8 dark:text-slate-400">{run.id}</td>
                            <td class="border-b border-slate-100 dark:border-slate-700 p-3 pl-8 dark:text-slate-400">{run.status}</td>
                            <td class="border-b border-slate-100 dark:border-slate-700 p-3 pl-8 dark:text-slate-400">{run.downloadedUrlCount}</td>
                            <td class="border-b border-slate-100 dark:border-slate-700 p-3 pl-8 dark:text-slate-400">{run.skippedUrlCount}</td>
                            <td class="border-b border-slate-100 dark:border-slate-700 p-3 pl-8 dark:text-slate-400">{run.failedUrlCount}</td>
                            <td class="border-b border-slate-100 dark:border-slate-700 p-3 pl-8 dark:text-slate-400">{formatDateTime(run.createdAt)}</td>
                            <td class="border-b border-slate-100 dark:border-slate-700 p-3 pl-8 dark:text-slate-400">{formatDateTime(run.finishedAt)}</td>
                            <td class="border-b border-slate-100 dark:border-slate-700 p-3 pl-8 dark:text-slate-400">{formatDateTime(run.updatedAt)}</td>
                        </tr>
                    {/each}
                </table>
            </div>
        </div>
    {/if}
</div>
