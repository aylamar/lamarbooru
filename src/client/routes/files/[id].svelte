<script context="module" lang="ts">
    import type { File } from '../../lib/stores/file.ts';
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

    export async function load({ fetch, params }) {
        const id = params.id;
        const res = await fetch(`${ import.meta.env.VITE_BASE_URL }api/file/${ id }`);
        const parsedJson: File = await res.json();

        if (res.ok) {
            file.set(parsedJson);
            fileUrl.set(`${ import.meta.env.VITE_BASE_URL }public/files/${ parsedJson.filename.substring(0, 2) }/${ parsedJson.filename }`);
            return { status: 200 };
        }

        return {
            status: res.status,
            error: new Error(res.statusText),
        };
    }
</script>

<script lang="ts">
    import Information from '../../lib/components/file/information.svelte';
    import Options from '../../lib/components/file/options.svelte';
    import Edit from '../../lib/components/file/edit.svelte';
    import Search from '../../lib/components/search/search.svelte';
    import Tags from '../../lib/components/file/tags.svelte';

    $fileSettings.isEditing = false;
</script>

<div class="flex-none space-x-4 md:flex">
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
            <Tags tags={$metaTags} header={"Meta"} fontColor={"text-slate-400"}/>
        {/if}
        <Information/>
        <Options/>
        <button class="text-blue-400">Show original</button>
    </div>
    <div class="">
        {#if $fileSettings.isEditing}
            <Edit/>
        {/if}
        <img alt="img" class="main-img justify-items-start" src="{$fileUrl}"/>
    </div>
</div>

<style>
    .main-img {
        max-width: calc(100% - 0.5rem);
        max-height: calc(100vh - 7rem);
        object-fit: contain;
    }
</style>