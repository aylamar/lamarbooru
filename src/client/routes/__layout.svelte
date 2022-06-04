<script context="module" lang="ts">
    import { currUrl } from "$lib/stores/general";
    export async function load({url}) {
        currUrl.set(url.pathname)
        return {
            status: 200
        }
    }
</script>

<script lang="ts">
    import '$lib/app.css'
    import Navigation from "$lib/components/common/navigation.svelte";
</script>

{#if $currUrl !== "/"}
    <Navigation />
{/if}

<main class="p-4 container-1xl mx-auto">
    <slot></slot>
</main>
