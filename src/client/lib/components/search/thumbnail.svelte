<script lang="ts">
    import { toast } from '@zerodevx/svelte-toast';
    import { hostname } from '../../stores/general';
    import { callAPI } from '../../utils/api';

    export let filename = '';
    export let id = 0;
    export let status = '';
    let prevStatus = status;
    let inboxColor = 'fill-blue-200 hover:fill-blue-400'
    let archivedColor = 'fill-emerald-200 hover:fill-emerald-400'
    let color = inboxColor

    function getImgUrl(fileName: string) {
        // get first two characters of file name
        const firstTwoChars = fileName.substring(0, 2);
        // img url = first two characters of file name/file name
        return (import.meta.env.VITE_BASE_URL || '') + `/public/thumbs/${ firstTwoChars }/${ fileName }`;
    }

    async function updateFileStatus(id: number, currStatus: string) {
        console.log('updateFileStatus', id, currStatus, prevStatus)
        let newStatus = ''
        if (prevStatus == 'archived') newStatus = 'inbox';
        else newStatus = 'archived';

        await callAPI({host: $hostname, endpoint: `/api/file/status/${ id }?status=${ newStatus }`, method: 'PUT',
            callback: async (res) => {
                if (!res.ok) return toast.push(`Error ${ res.statusText }`, {
                    theme: {
                        '--toastBackground': '#F56565',
                        '--toastBarBackground': '#C53030'
                    }
                });
                toast.push(`File status updated to ${newStatus}.`, {
                    theme: {
                        '--toastBackground': '#48BB78',
                        '--toastBarBackground': '#2F855A'
                    }
                });
                prevStatus = newStatus == 'inbox' ? 'inbox' : 'archived';
                color = newStatus == 'inbox' ? inboxColor : archivedColor;
            }
        });
    }
</script>

<div class="p-2 relative">
    <a class="" href="/files/{id}">
        <img alt="img" class="rounded-xl shadow-xl" src="{getImgUrl(filename)}">
    </a>
    {#if status === 'inbox'}
        <div>
            <span class="absolute top-3 right-3">
                <svg width="24px" height="24px" viewBox="0 0 128 128" class="{color}" on:click={updateFileStatus(id, status)}>
                    <path d="M4.878,104.293h113.125c2.682,0,4.879-2.211,4.879-4.914l-0.115-38.84 c-0.006-2.645-0.387-4.012-1.338-6.492L102.379,4.38C101.516,2.132,100.408,0,97.998,0H25.729c-2.41,0-3.488,2.144-4.38,4.38 L1.22,54.865c-0.966,2.424-1.063,3.809-1.072,6.438L0,99.379C0,102.082,2.198,104.293,4.878,104.293L4.878,104.293z M107.496,57.518H82.111l-7.758,15.617H48.633l-7.862-15.617H15.195l17.922-41.943h57.184L107.496,57.518L107.496,57.518z"></path>
                </svg>
            </span>
        </div>
    {/if}
</div>
