<script lang="ts">
    import { fileSettings, fileUrl } from '../../stores/file';

    $fileSettings.isEditing = false
    function toggleEdit() {
        $fileSettings.isEditing = !$fileSettings.isEditing;
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
    </ul>
</div>