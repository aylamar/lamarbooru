import DanbooruService from './danbooru';

describe('ImageService', () => {
    let service: DanbooruService;

    beforeEach(async () => {
        service = new DanbooruService();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should throw an error if the url is not valid', async () => {
        await expect(async () => {
            await service.getPageData('https://danbooru.donmai.us/posts/0');
        }).rejects.toEqual(new Error('ActiveRecord::RecordNotFound'));
    });

    it('should return parsed page data', async () => {
        const data = await service.getPageData('https://danbooru.donmai.us/posts/3274380');
        expect(data.tag_string_artist).toContain('miyajima_reiji');
        expect(data.tag_string_character).toContain('mizuhara_chizuru');
        expect(data.tag_string_copyright).toContain('kanojo_okarishimasu');
    });

    it('should return the correct data for post one', async () => {
        const url = 'https://danbooru.donmai.us/posts/3274380';
        const data = await service.getPageData(url);
        expect(await service.getArtists(data)).toEqual(['creator:miyajima_reiji']);
        expect(await service.getSeries(data)).toEqual(['series:kanojo_okarishimasu']);
        expect(await service.getTags(data)).toContain('1girl');
        expect(await service.getTags(data)).toContain('bangs');
        expect(await service.getMeta(data)).toContain('meta:absurdres');
        expect(await service.getSource(data, url)).toEqual(['https://www.pixiv.net/artworks/68428489', url]);
        expect(await service.getImageUrl(data)).toContain('https://cdn.donmai.us/original/b7/81/b781170a27fe53004decf02dd308d38b.jpg');
    });

    it('should return the correct data for post two', async () => {
        const url = 'https://danbooru.donmai.us/posts/4796549';
        const data = await service.getPageData(url);
        expect(await service.getCharacters(data)).toEqual(['character:kinoshita_kazuya', 'character:mizuhara_chizuru']);
        expect(await service.getArtists(data)).toEqual(['creator:miyajima_reiji']);
        expect(await service.getSeries(data)).toEqual(['series:kanojo_okarishimasu']);
        expect(await service.getTags(data)).toContain('1girl');
        expect(await service.getTags(data)).toContain('1boy');
        expect(await service.getSource(data, url)).toEqual(['https://twitter.com/miyajimareiji/status/1369181015504130050', url]);
        expect(await service.getImageUrl(data)).toEqual('https://cdn.donmai.us/original/27/f7/27f79d5fd52cf77f9d608e6baa083c3c.jpg');
    });

    it('should generate the correct number of urls', async () => {
        const tag = ['mizuhara_chizuru'];
        const pageNumber = 1;
        expect(await service.galleryGenerator(tag, pageNumber)).toBeDefined();
    });

    it('should return an empty array', async () => {
        const tag = ['null'];
        const pageNumber = 1;
        expect(await service.galleryGenerator(tag, pageNumber)).toBeDefined();
    });
});