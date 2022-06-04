<script lang="ts">
    import { derivedParams, params } from "../../stores/search";
    import { goto } from '$app/navigation'

    export let handleOnSubmit = (e) => {
        e.preventDefault();

        if ($params.searchParams) {
            goto(`/files?tags=${$derivedParams}`)
            return {
                status: 200,
            }
        } else {
            goto('/files')
            return {
                status: 200,
            }
        }
    }
</script>

<div class="search pb-2">
    <form on:submit={handleOnSubmit}>
        <input class="w-60 w-text-slate-400 bg-slate-800 px-3 py-2 rounded-md" type="search" placeholder="Search for tags..." bind:value={$params.searchParams} />
    </form>

</div>
