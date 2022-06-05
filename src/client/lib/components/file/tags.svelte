<script type="ts">
    import type { Tag } from '../../stores/file';

    export let tags: Tag;
    export let header: string;
    export let fontColor: string;
</script>

<div class="tags pb-2">
    <div>
        <p class="text-xl font-bold">{header}</p>
        <ul class="xs">
            {#each tags as tag}
                <li>
                    <a href="/files/?tags={tag.tag}" class="{fontColor} break-words">{tag.tag.replace(/_/g, ' ')}</a>
                    <span class="text-slate-500">{tag._count.files}</span>
                </li>
            {/each}
        </ul>
    </div>
</div>

<style>
    .xs {
        max-width: 15rem;
    }
</style>
