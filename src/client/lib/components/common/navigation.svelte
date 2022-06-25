<script lang="ts">
    import { page } from '$app/stores';
</script>

<header class="pt-1">
    <nav>
        <a class="pl-4 text-3xl font-bold" href="/">Lamarbooru</a>
        <div class="sm:flex pl-4 py-0.5">
            {#if $page.url.pathname.includes('/files')}
                <a class="bg-slate-800 px-2" href="/files">Files</a>
            {:else}
                <a class="px-2" href="/files">Files</a>
            {/if}
            {#if $page.url.pathname.includes('/subscriptions')}
                <a class="bg-slate-800/75 px-2" href="/subscriptions">Subscriptions</a>
            {:else}
                <a class="px-2" href="/subscriptions">Subscriptions</a>
            {/if}
            <a class="px-2" href="/upload">Upload</a>
        </div>
        {#if $page.url.pathname.includes('/files')}
            <div class="bg-slate-800/50 pl-2 py-0.5">
                <div class="pl-4 sm:flex space-x-6">
                    <a href="/files">Files</a>
                    <a href="/files?status=archived">Archive</a>
                    <a href="/files?status=inbox">Inbox</a>
                    <a href="/files?trash=true">Trash</a>
                </div>
            </div>
        {/if}
        {#if $page.url.pathname.includes('/subscriptions')}
            <div class="bg-slate-800/50 pl-2 py-0.5">
                <div class="pl-4 sm:flex space-x-6">
                    <a href="/subscriptions">Subscriptions</a>
                    <a href="/subscriptions/new">New</a>
                </div>
            </div>
        {/if}
    </nav>
</header>
