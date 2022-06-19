<script lang="ts">
    import { goto } from '$app/navigation';
    import { toast } from '@zerodevx/svelte-toast';
    import { file } from '../../lib/stores/file';
    import { hostname } from '../../lib/stores/general';
    import { callAPI } from '../../lib/utils/api';

    let booruUrl = '';
    $: allowBooru = false;

    async function checkBooru() {
        let parsedUrl: string | URL = '';
        try {
            parsedUrl = new URL(booruUrl);
        } catch (err) {
            allowBooru = false;
            return false;
        }
        switch (parsedUrl.host) {
            case 'danbooru.donmai.us':
                return allowBooru = true;
            default:
                return allowBooru = false;
        }
    }

    async function handleBooru() {
        console.log('handleBooru', booruUrl);
        const body = JSON.stringify({ url: booruUrl });
        await callAPI({host: $hostname, endpoint: '/api/file/booru', method: 'POST', body: body,
            callback: async (res: Response) => {
                console.log(res.ok)
                if (!res.ok) return toast.push(`Error ${ res.statusText }`, {
                    theme: {
                        '--toastBackground': '#F56565',
                        '--toastBarBackground': '#C53030',
                    },
                });

                let body = await res.json();
                file.set(body);

                if (res.status === 200) toast.push('File already exists.', {
                    theme: {
                        '--toastBackground': '#48BB78',
                        '--toastBarBackground': '#2F855A',
                    },
                });

                if (res.status === 201) toast.push('File uploaded successfully.', {
                    theme: {
                        '--toastBackground': '#48BB78',
                        '--toastBarBackground': '#2F855A',
                    },
                });

                return goto(`/files/${ body.file.id }`);

            },
        });
    }
</script>

<div class="flex justify-center mt-8">
    <div class="max-w-2xl rounded-lg">
        <div class="m-4 w-80">
            <span class="inline-block mb-2 font-bold text-lg pb-2">Import Booru Image</span>
            <input bind:value={booruUrl} class="text-left px-4 h-12 ring-1 w-full ring-slate-900/10 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm rounded-t-lg dark:bg-slate-800 dark:ring-0 dark:text-slate-300 dark:highlight-white/5 dark:hover:bg-slate-700" on:input={checkBooru}
                   on:paste={checkBooru}
            />
            <button class="w-full px-4 py-2 text-white bg-sky-500 rounded-b-lg shadow-xl disabled:bg-slate-700"
                    disabled={!allowBooru}
                    on:click={handleBooru}>Import
            </button>
        </div>
    </div>
</div>
<!--<div class="flex justify-center mt-8">-->
<!--    <div class="max-w-2xl rounded-lg">-->
<!--        <div class="m-4 w-80">-->
<!--            <span class="inline-block mb-2 font-bold text-lg pb-2">Image Upload</span>-->
<!--            <label class="flex flex-col w-full h-32 border-4 border-sky-800 border rounded-t-lg hover:border-sky-600">-->
<!--                <div class="flex flex-col items-center justify-center pt-7">-->
<!--                    <svg class="w-8 h-8 text-gray-400 group-hover:text-slate-700" fill="none"-->
<!--                         stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">-->
<!--                        <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"-->
<!--                              stroke-linecap="round" stroke-linejoin="round"-->
<!--                              stroke-width="2"/>-->
<!--                    </svg>-->
<!--                    <p class="pt-1 text-sm tracking-wider text-gray-400 group-hover:text-gray-600">-->
<!--                        Attach a file</p>-->
<!--                </div>-->
<!--                <input class="opacity-0" type="file"/>-->
<!--            </label>-->
<!--            <button class="w-full px-4 py-2 text-white bg-sky-500 rounded-b-lg shadow-xl disabled:bg-slate-700">Upload-->
<!--            </button>-->
<!--        </div>-->
<!--    </div>-->
<!--</div>-->
