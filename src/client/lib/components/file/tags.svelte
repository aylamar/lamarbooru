<script type="ts">
    import type { Tag } from '../../stores/file';

    export let tags: Tag;
    export let header: string;
    export let fontColor: string;
</script>

<div class="tags pb-2">
    <div>
        <p class="text-xl font-bold">{header}</p>
        <ul>
            {#each tags as tag}
                <li>
                    <a href="/files/?tags={tag.tag}" class={fontColor}>{tag.tag}</a>
                    <span class="text-slate-500 break-all">{tag._count.files}</span>
                </li>
            {/each}
        </ul>
    </div>
</div>