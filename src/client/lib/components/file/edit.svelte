<script lang="ts">
    import type { File } from '../../stores/file';
    import { file } from '../../stores/file';

    const ratingArr = ['explicit', 'questionable', 'safe'];
    let rating = $file.rating;
    let sourceUrl = $file.source;

    let tagArr = [];
    for (const i in $file.tags) {
        if ($file.tags[i].namespace == 'tag') {
            tagArr.push($file.tags[i].tag);
        } else {
            tagArr.push(`${ $file.tags[i].namespace }:${ $file.tags[i].tag }`);
        }
    }

    // sort tagArr:
    // tags starting with "creator:" first
    // then tags starting with "series:"
    // then tags starting with "character:"
    // then tags starting with "meta:"
    // then remainder alphabetically
    tagArr = tagArr.sort((a, b) => {
        if (a.startsWith('creator:') && !b.startsWith('creator:')) {
            return -1;
        } else if (!a.startsWith('creator:') && b.startsWith('creator:')) {
            return 1;
        } else if (a.startsWith('series:') && !b.startsWith('series:')) {
            return -1;
        } else if (!a.startsWith('series:') && b.startsWith('series:')) {
            return 1;
        } else if (a.startsWith('character:') && !b.startsWith('character:')) {
            return -1;
        } else if (!a.startsWith('character:') && b.startsWith('character:')) {
            return 1;
        } else if (a.startsWith('meta:') && !b.startsWith('meta:')) {
            return -1;
        } else if (!a.startsWith('meta:') && b.startsWith('meta:')) {
            return 1;
        } else {
            return a.localeCompare(b);
        }
    });

    let joinedTags = tagArr.join('\n');

    // send the file to the server
    async function saveFile(e) {
        e.preventDefault();
        // needed due to typescript not recognizing .value
        //@ts-ignore
        let tags = document.getElementById('tags').value.split('\n');

        // send the put to the server
        const res = await fetch(`${ import.meta.env.VITE_BASE_URL }api/file/${ $file.id }`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': 'http://localhost*' },
            mode: 'cors',
            body: JSON.stringify({
                tags: tags,
                source: sourceUrl,
                rating: rating,
            }),
        });
        const parsedJson: File = await res.json();
        if (res.ok) {
            $file = parsedJson;
            return res.status;
        } else {
            return res.status;
        }
    }
</script>

<form class="pb-2 lg:grid lg:grid-cols-2 space-y-4">
    <div class="col-span-2">
        <p class="text-xl font-bold">Edit Image</p>
    </div>
    <div class="w-5/6">
        <p class="pb-2"><span class="font-bold">Note</span>: Tags should be seperated by a new line</p>
        <textarea class="w-full text-slate-400 bg-slate-800 px-3 py-2 rounded-md h-40" id="tags"
                  spellcheck="false">{joinedTags}</textarea>
    </div>

    <div class="w-5/6">
        <div class="pb-4">
            <p class="pb-2 font-bold">Source</p>
            <input bind:value={sourceUrl} class="w-text-slate-400 bg-slate-800 px-3 py-2 rounded-md w-full" type="url">
        </div>
        <div class="pb-4">
            <p class="font-bold">Rating</p>
            <div class="flex place-content-evenly">
                <label for="explicit">
                    <input bind:group={rating} id="explicit" name="rating" type="radio" value={"explicit"}>
                    Explicit
                </label>
                <label for="explicit">
                    <input bind:group={rating} id="questionable" name="rating" type="radio" value={"questionable"}>
                    Questionable
                </label>
                <label for="explicit">
                    <input bind:group={rating} id="safe" name="rating" type="radio" value={"safe"}>
                    Safe
                </label>
            </div>
        </div>
        <div class="bottom-0 left-0">
            <button class="rounded-md font-semibold px-3 py-2 text-sm bg-sky-500 text-white shadow-sm w-48"
                    on:click={saveFile}>Update
            </button>
        </div>
    </div>
    <br/>
</form>
