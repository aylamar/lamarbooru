<script lang="ts">
    import { toast } from '@zerodevx/svelte-toast';
    import { hostname } from '../../lib/stores/general';
    import { callAPI } from '../../lib/utils/api';

    $: tags = '';
    $: tagBlacklist = '';
    $: interval = 'weekly';
    $: limit = 200;
    $: site = 'danbooru';
    $: parsedTags = tags.split(' ').map(tag => {
        return tag.trim();
    });
    $: parsedBlacklist = tagBlacklist.split(' ').map(tag => {
        return tag.trim();
    });

    async function handleSubmit(e) {
        e.preventDefault();
        const body = JSON.stringify({
            tags: parsedTags,
            tagBlacklist: parsedBlacklist,
            interval: interval,
            limit: limit,
            site: site,
        });

        await callAPI({
            host: $hostname, endpoint: '/api/subscription', method: 'POST', body: body, callback: (res: Response) => {
                if (!res.ok) return toast.push(`Error ${ res.statusText }`, {
                    theme: {
                        '--toastBackground': '#F56565',
                        '--toastBarBackground': '#C53030',
                    },
                });

                if (res.status === 200) return toast.push('Subscription already exists', {
                    theme: {
                        '--toastBackground': '#48BB78',
                        '--toastBarBackground': '#2F855A',
                    },
                });

                toast.push('Subscription created', {
                    theme: {
                        '--toastBackground': '#48BB78',
                        '--toastBarBackground': '#2F855A',
                    },
                });
            },
        });
    }
</script>


<form class="grid place-items-center">
    <div class="grid grid-cols-2 gap-6 grid-cols-2 min-w-fit w-1/2 p-4 rounded-lg bg-slate-800/25">
        <div class="col-span-2 font-medium">
            <p>Add New Subscription</p>
        </div>
        <div class="relative border-2 border-slate-800 focus-within:border-blue-900 rounded-lg">
            <input bind:value={tags}
                   class="w-text-slate-400 p-2 rounded-md shadow-sm block w-full appearance-none focus:outline-none bg-transparent"
                   id="tags" placeholder=" " type="text">
            <label class="pl-1 absolute top-0 -z-1 duration-300 origin-0 text-slate-400" for="tags">Tags</label>
        </div>
        <div class="relative border-2 border-slate-800 focus-within:border-blue-900 rounded-lg">
            <input bind:value={tagBlacklist}
                   class="w-text-slate-400 p-2 rounded-md shadow-sm block w-full appearance-none focus:outline-none bg-transparent"
                   id="blacklistedTags" placeholder=" " type="text">
            <label class="pl-1 absolute top-0 -z-1 duration-300 origin-0" for="blacklistedTags">Blacklisted Tags</label>
        </div>
        <div class="relative border-2 border-slate-800 focus-within:border-blue-900 rounded-lg">
            <select bind:value={interval}
                    class="w-text-slate-400 p-2 rounded-md shadow-sm block w-full appearance-none focus:outline-none bg-transparent"
                    id="interval">
                <option value="daily">Daily</option>
                <option selected value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
            </select>
            <label class="pl-1 absolute top-0 -z-1 duration-300 origin-0 -translate-y-6 scale-75" for="interval">Interval</label>
        </div>
        <div class="relative border-2 border-slate-800 focus-within:border-blue-900 rounded-lg">
            <input bind:value={limit}
                   class="w-text-slate-400 p-2 rounded-md shadow-sm block w-full appearance-none focus:outline-none bg-transparent"
                   id="limit" min="1" type="number">
            <label class="pl-1 absolute top-0 -z-1 duration-300 origin-0" for="limit">Limit</label>
        </div>
        <div class="relative border-2 border-slate-800 focus-within:border-blue-900 rounded-lg">
            <select bind:value={site}
                    class="w-text-slate-400 p-2 rounded-md shadow-sm block w-full appearance-none focus:outline-none bg-transparent"
                    id="site">
                <option value="danbooru">Danbooru</option>
            </select>
            <label class="pl-1 absolute top-0 -z-1 duration-300 origin-0 -translate-y-6 scale-75"
                   for="site">Site</label>
        </div>
        <button class="bg-sky-500 text-white rounded-lg" on:click={handleSubmit} type="submit">Submit</button>
    </div>
</form>
