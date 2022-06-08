<script lang="ts">
    import { file, fileUrl } from '../../stores/file';
</script>

<div class="information max-w-fit">
    <p class="font-bold text-lg">Information</p>
    <ul>
        <li>ID: {$file.id}</li>
        {#if $file.updatedAt}
            <li>Upload Date: {$file.updatedAt.split('T')[0].replace('-', '/').replace('-', '/')}</li>
        {/if}
        <li>Rating: {$file.rating[0].toUpperCase() + $file.rating.slice(1)}</li>
        <li>Status: {$file.status.toString()}</li>
        <li>File Size: {Math.round($file.size/1024*100)/100} MB</li>
        {#if $file.sources}
            <li>Sources:</li>
            {#each $file.sources as source}
                <li class="break-words"><a class="text-blue-400"
                                           href={source.url}>{source.site}</a>
            {/each}
        {/if}
        <li><a class="text-blue-400" href="{ $fileUrl }">View
            original</a></li>
    </ul>
</div>
