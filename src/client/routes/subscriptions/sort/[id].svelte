<script lang="ts">
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { hostname } from '../../../lib/stores/general';
    import { logDerivedFiles, logFile, subscriptionLog } from '../../../lib/stores/subscriptionLog';
    import { callAPI } from '../../../lib/utils/api';
    import { inboxChanges, inboxIndex, processInboxItem } from '../../../lib/utils/inbox';

    $: isLoading = true;
    $: showImages = false;
    inboxIndex.set(0);

    onMount(async () => {
        await callAPI({
            host: $hostname, endpoint: `/api/subscription/logs/${ $page.params.id }`, method: 'GET',
            callback: async (res) => {
                if (res.ok) {
                    subscriptionLog.set(await res.json());
                    isLoading = false;
                    logFile.set($logDerivedFiles[$inboxIndex]);
                }
            },
        });
    });

    function handleKeydown(event) {
        if (isLoading) return;
        if (event.key === 'Escape' && $inboxIndex > 0) return console.log('Submit or cancel'); // todo: toast message with submit button
        if (!['ArrowRight', 'ArrowUp', 'ArrowDown', 'ArrowLeft'].includes(event.key)) return; // skip other keys
        if (event.key === 'ArrowLeft' && $inboxIndex === 0) return console.log('No previous files!'); //todo: add toast
        if (event.key === 'ArrowRight' && $inboxIndex === $logDerivedFiles.length - 1) return console.log('Submit changes?'); // todo: handle this

        let updates = processInboxItem(event.key, $inboxIndex, $logFile.id);
        $inboxChanges.splice($inboxIndex, 1, updates.inboxItem);
        $inboxIndex = updates.newIdx;
        $logFile = $logDerivedFiles[updates.newIdx];
    }
</script>

<svelte:window on:keydown={handleKeydown}/>

<div>
    {#if $logDerivedFiles.length > 0 && !isLoading}
        <div>
            <div class="file-name">{ $logFile.id }</div>
            <br>
        </div>
    {:else if isLoading}
        <div>loading...</div>
    {:else}
        <p>No files found from subscription run</p>
    {/if}
</div>
