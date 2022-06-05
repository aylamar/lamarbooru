import fetch from 'node-fetch';

interface danbooruImage {
    id: number;
    rating: string;
    tag_string_general: string;
    tag_string_character?: string;
    tag_string_copyright?: string;
    tag_string_artist?: string;
    tag_string_meta?: string;
    source?: string;
    pixiv_id?: string;
    file_url: string;

    success?: boolean;
    error?: string;
}

export default class DanbooruService {
    private static async checkIfError(payload: danbooruImage | danbooruImage[]): Promise<void> {
        if (payload instanceof Array) {
            if (payload.length === 0) {
                throw new Error('No images found');
            }
        } else {
            if (payload.success === false) {
                throw new Error(payload.error);
            }
        }
    }

    public async getPageData(url: string): Promise<danbooruImage> {
        //select everything after /posts/
        const id = url.split('/posts/')[1];

        const res: any = await fetch(`https://danbooru.donmai.us/posts/${ id }.json`);
        const data: danbooruImage = await res.json();
        await DanbooruService.checkIfError(data);
        return data;
    }

    public async galleryGenerator(tags: string[], pageNumber: number): Promise<string[]> {
        const res: any = await fetch(`https://danbooru.donmai.us/posts.json?tags=${ tags.join('+') }&page=${ pageNumber }`);
        const data: danbooruImage[] = await res.json();
        try {
            await DanbooruService.checkIfError(data);
            let linkArr = data.map(x => `https://danbooru.donmai.us/posts/${ x.id }`);

            // links that contain "undefined" are not valid, so remove them
            return linkArr.filter(x => !x.includes('undefined'));
        } catch (e) {
            if (e instanceof Error && e.message === 'No images found') return [];
            throw e;
        }
    }

    public async getArtists(payload: danbooruImage): Promise<string[]> {
        let artists: string[] = [];
        if (payload.tag_string_artist) artists = payload.tag_string_artist.split(' ');
        return artists.map(tag => `creator:${ tag }`);
    }

    public async getSeries(payload: danbooruImage): Promise<string[]> {
        let series: string[] = [];
        if (payload.tag_string_copyright) series = payload.tag_string_copyright.split(' ');
        return series.map(tag => `series:${ tag }`);
    }

    public async getCharacters(payload: danbooruImage): Promise<string[]> {
        let characters: string[] = [];
        if (payload.tag_string_character) characters = payload.tag_string_character.split(' ');
        return characters.map(tag => `character:${ tag }`);
    }

    public async getTags(payload: danbooruImage): Promise<string[]> {
        let tags: string[] = [];
        if (payload.tag_string_general) tags = payload.tag_string_general.split(' ');
        return tags;
    }

    public async getMeta(payload: danbooruImage): Promise<string[]> {
        let meta: string[] = [];
        if (payload.tag_string_meta) meta = payload.tag_string_meta.split(' ');
        return meta.map(tag => `meta:${ tag }`);
    }

    public async getRating(payload: danbooruImage): Promise<string> {
        let rating = 'explicit';
        switch (payload.rating) {
            case 's':
                rating = 'safe';
                break;
            case 'q':
                rating = 'questionable';
                break;
            case 'e':
                rating = 'explicit';
                break;
        }
        return rating;
    }

    public async getSource(payload: danbooruImage, url: string): Promise<string[]> {
        if (payload.pixiv_id) return [`https://www.pixiv.net/artworks/${ payload.pixiv_id }`, url];
        if (payload.source) return [payload.source.toLowerCase(), url];
        return [url];
    }

    public async getFileUrl(payload: danbooruImage): Promise<string> {
        return payload.file_url;
    }
}
