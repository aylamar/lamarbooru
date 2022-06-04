<script lang="ts">
    import { file } from '../../stores/file';
</script>

<div class="information max-w-fit">
    <p class="font-bold text-lg">Information</p>
    <ul>
        <li>ID: {$file.id}</li>
        {#if $file.updatedAt}
            <li>Upload Date: {$file.updatedAt.split('T')[0].replace('-', '/').replace('-', '/')}</li>
        {/if}
        <li>Rating: {$file.rating[0].toUpperCase() + $file.rating.slice(1)}</li>
        <li>Approved: {$file.approved.toString()}</li>
        {#if $file.source}
            <li>Sources:</li>
            {#each $file.source as source}
                <li class="break-words"><a class="text-blue-400"
                                           href={source}>{source.split("://")[1].replace("www.", "")}</a>
            {/each}
        {/if}
        <li><a class="text-blue-400" href="{import.meta.env.VITE_BASE_URL}public/original/{$file.id}.png">View
            original</a></li>
    </ul>
</div>
