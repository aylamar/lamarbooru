<script lang="ts">
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import Edit from '../../lib/components/file/edit.svelte';
    import Information from '../../lib/components/file/information.svelte';
    import Options from '../../lib/components/file/options.svelte';
    import Tags from '../../lib/components/file/tags.svelte';
    import Search from '../../lib/components/search/search.svelte';
    import {
        artistTags,
        characterTags,
        file,
        fileSettings,
        fileUrl,
        metaTags,
        normalTags,
        seriesTags,
    } from '../../lib/stores/file.ts';
    import { hostname } from '../../lib/stores/general';
    import { callAPI } from '../../lib/utils/api';

    let loading = true;

    onMount(async () => {
        let param = $page.params.id;
        await callAPI({
            host: $hostname, endpoint: `/api/file/${ param }`, method: 'GET',
            callback: async (res) => {
                if (res.ok) {
                    let parsedJson = await res.json();
                    file.set(parsedJson);
                    fileUrl.set(`${ import.meta.env.VITE_BASE_URL || $hostname }/public/files/${ parsedJson.filename.substring(0, 2) }/${ parsedJson.filename }`);
                }
            },
        });
        loading = false;
    });

    $fileSettings.isEditing = false;
</script>

<div class="flex-none space-x-4 md:flex">
    {#if loading}
        <p>
            Loading...
        </p>
    {:else}
        <div class="md:max-w-xs">
            <Search searchParams={""}/>
            {#if $artistTags.length > 0}
                <Tags tags={$artistTags} header={"Artists"} fontColor={"text-rose-400"}/>
            {/if}
            {#if $seriesTags.length > 0}
                <Tags tags={$seriesTags} header={"Series"} fontColor={"text-fuchsia-400"}/>
            {/if}
            {#if $characterTags.length > 0}
                <Tags tags={$characterTags} header={"Characters"} fontColor={"text-emerald-400"}/>
            {/if}

            <Tags fontColor={"text-blue-400"} header={"Tags"} tags={$normalTags}/>

            {#if $metaTags.length > 0}
                <Tags header={"Meta"} fontColor={"text-slate-400"} tags={$metaTags}/>
            {/if}
            <Information/>
            <Options/>
        </div>
        <div class="">
            {#if $fileSettings.isEditing}
                <Edit/>
            {/if}
            <img alt="img" class="main-img justify-items-start" src="{$fileUrl}"/>
        </div>
    {/if}
</div>

<style>
    .main-img {
        max-width: calc(100% - 0.5rem);
        max-height: calc(100vh - 7rem);
        object-fit: contain;
    }
</style>