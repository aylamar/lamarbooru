<script context="module" lang="ts">
    import { browser } from '$app/env';
    import { currUrl, hostname } from '../lib/stores/general';

    export async function load({ url }) {
        if (browser) {
            hostname.set(window.location.origin);
        }

        currUrl.set(url.pathname);
        return { status: 200 };
    }
</script>

<script lang="ts">
    import '$lib/app.css';
    import Navigation from '../lib/components/common/navigation.svelte';
</script>

{#if $currUrl !== "/"}
    <Navigation/>
{/if}

<main class="p-4 container-1xl mx-auto">
    <slot></slot>
</main>
