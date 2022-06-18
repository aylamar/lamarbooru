<script lang="ts">
    import { page } from '$app/stores';
    import { toast } from '@zerodevx/svelte-toast';
    import { file, fileSettings, fileUrl } from '../../stores/file';
    import { hostname } from '../../stores/general';
    import { callAPI } from '../../utils/api';

    let updatingTrash = false;
    $fileSettings.isEditing = false;

    function toggleEdit() {
        $fileSettings.isEditing = !$fileSettings.isEditing;
    }

    async function handleTrash() {
        if (updatingTrash) return;
        let method;
        if (!$file.trash) {
            method = 'PUT';
        } else {
            method = 'DELETE';
        }

        updatingTrash = true;
        await callAPI({
            host: $hostname,
            endpoint: `/api/file/trash/${ $page.params.id }`,
            method: method,
            callback: async (res: Response) => {
                if (!res.ok) {
                    updatingTrash = false;
                    return toast.push(`Error ${ res.statusText }`, {
                        theme: {
                            '--toastBackground': '#F56565',
                            '--toastBarBackground': '#C53030'
                        }
                    });
                }

                $file.trash = !$file.trash;
                updatingTrash = false;
                // send toast message confirming trash status
                return toast.push(`${ $file.trash ? 'Trashed' : 'Restored' } file `, {
                    theme: {
                        '--toastBackground': $file.trash ? '#F56565' : '#48BB78',
                        '--toastBarBackground': $file.trash ? '#C53030' : '#2F855A',
                    }
                });
            },
        });
    }
</script>

<div class="information">
    <p class="font-bold text-lg">Options</p>
    <ul>
        <li>
            <button class="text-blue-400" on:click={toggleEdit}>Edit</button>
        </li>
        <li>
            <a href={$fileUrl}>
                <button class="text-blue-400">Show original</button>
            </a>
        </li>
        <li>
            {#if $file.trash === true}
                <button class="text-blue-400" on:click={handleTrash}>Remove file from trash</button>
            {:else }
                <button class="text-blue-400" on:click={handleTrash}>Add file to trash</button>
            {/if}
        </li>
    </ul>
</div>
