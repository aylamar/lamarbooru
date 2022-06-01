<script lang="ts">
    let searchParams = ''

    export let handleOnSubmit = (e) => {
        e.preventDefault();
        console.log('todo')
    }
</script>

<div class="grid place-items-center mt-60">
    <div class="grid grid-rows-4 content-center md:w-1/2 md:max-w-lg">
        <a class="text-4xl font-bold text-center pb-3" href="/posts">Lamarbooru</a>
        <div class="flex justify-center">
            <a class="text-center font-bold" href="/posts">All Posts</a>
        </div>
        <form class="grid grid-cols-4 pb-3" on:submit={handleOnSubmit}>
            <input bind:value={searchParams} class="w-text-slate-400 bg-slate-800 px-3 py-2 rounded-l-md col-span-3 shadow-sm" type="search" placeholder="long_hair 1girl">
            <button onclick={handleOnSubmit} class="rounded-r-md font-semibold px-3 py-2 text-sm bg-sky-500 text-white shadow-sm">Search</button>
        </form>
        <div class="grid grid-cols-2">
            <span class="text-center">X Posts</span>
            <span class="text-center">X Tags</span>
        </div>
    </div>
</div>