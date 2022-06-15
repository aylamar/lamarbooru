<script lang="ts">
    import { page } from '$app/stores';
    import { fileSettings, fileUrl, file } from '../../stores/file';
    import { hostname } from '../../stores/general';
    import { callAPI } from '../../utils/api';
    let updatingTrash = false;

    $fileSettings.isEditing = false
    function toggleEdit() {
        $fileSettings.isEditing = !$fileSettings.isEditing;
    }

    async function handleTrash() {
        if (updatingTrash) return;
        console.log('current file status')
        const currStatus = $file.status;
        let method
        if (currStatus === 'trash') {
            method = 'PUT'
        } else {
            method = 'DELETE'
        }

        updatingTrash = true;
        await callAPI({ host: $hostname, endpoint: `/api/file/trash/${ $page.params.id }`, method: method, callback: async (res: Response) => {
                if (res.ok) {
                    $file.status = currStatus === 'trash' ? 'inbox' : 'trash';
                    console.log('success file status', $file.status);
                    updatingTrash = false;
                } else {
                    console.log('err file status', $file.status);
                    updatingTrash = false;
                }
            }
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
            <a href={$fileUrl} > <button class="text-blue-400">Show original</button></a>
        </li>
        <li>
            {#if $file.status === 'trash'}
                <button class="text-blue-400" on:click={handleTrash}>Remove file from trash</button>
            {:else }
                <button class="text-blue-400" on:click={handleTrash}>Add file to trash</button>
            {/if}
        </li>
    </ul>
</div>