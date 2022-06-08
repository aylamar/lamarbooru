import { File, Site } from '@prisma/client';
import fetch from 'node-fetch';
import {
    checkIfHashExists,
    createFile,
    generateFileName,
    generateTagConnectQuery,
    generateUrlConnectQuery,
    getFileExtensionFromURL,
    getFileHash, getFileSize,
    getRating,
    isValidExtension,
    writeFile,
} from '../utils/fileUtils.js';
import DanbooruService from './sites/danbooru.js';

export class DownloaderService {
    private readonly danbooru: DanbooruService;

    constructor() {
        this.danbooru = new DanbooruService();
    }

    private static cleanUrl(url: string): string {
        // remove trailing slash
        let cleanedUrl = url;
        if (url.endsWith('/')) {
            cleanedUrl = url.slice(0, -1);
        }

        // if https is missing, add it
        if (!cleanedUrl.startsWith('http')) {
            cleanedUrl = 'https://' + cleanedUrl;
        }

        // if http instead of https is used, switch it
        if (cleanedUrl.startsWith('http://')) {
            cleanedUrl = cleanedUrl.replace('http://', 'https://');
        }

        // remove query string if present
        if (cleanedUrl.includes('?')) {
            cleanedUrl = cleanedUrl.split('?')[0];
        }

        return cleanedUrl;
    }

    private static async downloadFile(url: string) {
        // return file in buffer
        const res = await fetch(url);
        if (res.ok) {
            return await res.buffer();
        } else {
            throw new Error('Could not download file');
        }
    }

    public async downloadFileFromService(inputUrl: string, blacklist?: string[]): Promise<FileMeta> {
        const url = DownloaderService.cleanUrl(inputUrl);
        const service = await this.getServiceFromURL(url);

        const $ = await service.getPageData(url);
        const fileUrl = await service.getFileUrl($);

        const fileExtension = await getFileExtensionFromURL(fileUrl);
        if (!fileExtension) throw Error('Unsupported Media Type');

        const valid = await isValidExtension(fileExtension);
        if (!valid) throw new Error('Unsupported Media Type');

        // Generate tags
        const artist = await service.getArtists($);
        const characters = await service.getCharacters($);
        const series = await service.getSeries($);
        const tags = await service.getTags($);
        const meta = await service.getMeta($);
        const combined = [...artist, ...characters, ...series, ...tags, ...meta];

        // this should only ever happen when downloading via subscription
        // we can use ts-ignore safely while looking for a more permanent solution
        if (blacklist) {
            const blacklisted = blacklist.some((tag) => combined.includes(tag));
            if (blacklisted) {
                //@ts-ignore
                return { file: null, status: 'blacklisted' };
            }
        }

        const sourceArray = await service.getSource($, url);
        const source = await generateUrlConnectQuery(sourceArray);

        const ratingStr = await service.getRating($);
        const rating = await getRating(ratingStr);

        // Generate everything needed for adding to database
        const connectQuery = await generateTagConnectQuery(combined);
        const fileBuffer = await DownloaderService.downloadFile(fileUrl);
        const hash = await getFileHash(fileBuffer);
        const fileName = await generateFileName(fileExtension);
        const fileSize = await getFileSize(fileBuffer);

        // check to see if hash already exists
        const exists = await checkIfHashExists(hash);
        if (exists) return { file: exists, status: 'exists' };

        // Add to database and write to disk
        const file = await createFile(fileName, hash, connectQuery, source, fileSize, rating);
        await writeFile(fileBuffer, fileName);

        return { file: file, status: 'success' };
    }

    public async exploreGallery(site: Site, tags: string[], pageNumber: number) {
        const service = await this.getServiceFromSubscription(site);
        return await service.galleryGenerator(tags, pageNumber);
    }

    /*
        Helper Functions
     */
    private async getServiceFromURL(url: string) {
        if (url.includes('danbooru.donmai.us')) {
            return this.danbooru;
        } else {
            throw new Error('No service found for this url');
        }
    }

    private async getServiceFromSubscription(site: Site) {
        if (site == Site.danbooru) {
            return this.danbooru;
        } else {
            throw new Error('No service found for this subscription');
        }
    }
}

interface FileMeta {
    file: File,
    status: string
}
