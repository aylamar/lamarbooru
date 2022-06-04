<script lang="ts">
    import { goto } from '$app/navigation';
    import { derivedParams, params } from '../../stores/search';

    export let handleOnSubmit = (e) => {
        e.preventDefault();

        if ($params.searchParams) {
            goto(`/files?tags=${ $derivedParams }`);
            return {
                status: 200,
            };
        } else {
            goto('/files');
            return {
                status: 200,
            };
        }
    };
</script>

<div class="search pb-2">
    <form on:submit={handleOnSubmit}>
        <input bind:value={$params.searchParams} class="w-60 w-text-slate-400 bg-slate-800 px-3 py-2 rounded-md"
               placeholder="Search for tags..." type="search"/>
    </form>

</div>
