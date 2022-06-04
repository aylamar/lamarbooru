<script lang="ts">
    import { fileSettings } from '../../stores/file';

    $fileSettings.isEditing = false
    function toggle() {
        $fileSettings.isEditing = !$fileSettings.isEditing;
    }
</script>

<div class="information">
    <p class="font-bold text-lg">Options</p>
    <ul>
        <li>
            <button class="text-blue-400" on:click={toggle}>Edit</button>
        </li>
    </ul>
</div>