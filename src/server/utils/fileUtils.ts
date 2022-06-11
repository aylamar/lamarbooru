import { File, FileStatus, Namespace, Rating, Site, UrlStatus } from '@prisma/client';
import crypto from 'crypto';
import fs from 'fs';
import sharp from 'sharp';
import { v4 as uuid } from 'uuid';
import { fileBasePath, thumbnailBasePath } from '../server.js';
import prisma from './prisma.js';

const allowedExtensions = ['png', 'jpg', 'jpeg'];

/*
    Checks to see is a file exists already in database
    @param Multer file
    @returns true or false based on whether file is valid
 */
export async function checkIfHashExists(hash: string) {
    return await prisma.file.findUnique({
        where: {
            hash: hash,
        }, include: {
            tags: true,
            sources: true,
        },

    });
}


/*
    Creates folders for a file in the fileBasePath and thumbnailBasePath
    @param fileName: Name of file to create folders for
 */
async function createFolders(fileName: string) {
    if (!fs.existsSync(`${ fileBasePath }/${ fileName.substring(0, 2) }`)) {
        fs.mkdirSync(`${ fileBasePath }/${ fileName.substring(0, 2) }`);
    }
    if (!fs.existsSync(`${ thumbnailBasePath }/${ fileName.substring(0, 2) }`)) {
        fs.mkdirSync(`${ thumbnailBasePath }/${ fileName.substring(0, 2) }`);
    }
}

/*
    Adds a file to the database
    @param file: Multer file object
    @param hash: Hash of file
    @param tagConnectQuery: connectOrReplace query for all tags attached to a file
    @param rating: Enumerated rating of a file
    @param source: Source urls in array of strings
    @returns Image object
*/
export async function createFile(fileName: string, hash: string, connectQuery: tagConnectQuery[], source: urlConnectQuery[], fileSize: number, rating?: Rating): Promise<File> {
    if (!rating) rating = Rating.explicit;

    return await prisma.file.create({
        data: {
            filename: fileName,
            hash: hash,
            rating: rating,
            size: fileSize,
            sources: { connectOrCreate: source },
            tags: { connectOrCreate: connectQuery },
        },
        include: {
            tags: true,
            sources: true,
        },
    });
}

/*
    Generates connectOrReplace query for a tag list of strings
    @param tags: Array of tags to generate connect query for
    @returns Array of connectOrReplace queries
*/
export async function generateTagConnectQuery(tags?: string[]): Promise<tagConnectQuery[]> {
    let connectQuery: tagConnectQuery[] = [];
    if (!tags) return [];

    for (const i in tags) {
        let tag = tags[i].replace(/ /g, '_');
        const namespace = await getNamespace(tag);
        tag = tag.replace(/^.*:/, '');

        connectQuery.push(<tagConnectQuery>{
            where: { tag_namespace: { tag: tag, namespace: namespace } },
            create: { tag: tag, namespace: namespace },
        });
    }
    return connectQuery;
}

/*
    Generates connectOrReplace query for an url list of strings
    @param urls: Array of strings to generate connect query for
    @returns Array of connectOrReplace queries
*/
export async function generateUrlConnectQuery(urls: string[]): Promise<urlConnectQuery[]> {
    let connectQuery: urlConnectQuery[] = [];
    if (!urls) return [];

    for (const i in urls) {
        let url = urls[i].replace(/ /g, '_');
        const site = await getSite(url);

        connectQuery.push(<urlConnectQuery>{
            where: { url: url },
            create: { site: site, url: url },
        });
    }
    return connectQuery;
}

/*
    Generates a disconnect query for a tag list of strings
    @param tags: Array of tags to compare against
    @param fileTags: Array of tags of the file
    @returns Array of disconnect queries for tags missing from fileTags
 */
export async function generateTagDisconnectQuery(tags: string[], fileTags: tag[]): Promise<tagDisconnectQuery[]> {
    let disconnectQuery: tagDisconnectQuery[] = [];
    for (const i in fileTags) {
        if (!tags.includes(fileTags[i].tag)) {
            disconnectQuery.push({
                id: fileTags[i].id,
            });
        }
    }
    return disconnectQuery;
}

/*
    Generates a disconnect query for a source list of strings
    @param tags: Array of sources to compare against
    @param fileTags: Array of sources of the file
    @returns Array of disconnect queries for tags missing from fileTags
 */
export async function generateSourceDisconnectQuery(sources: string[], fileSources: source[]): Promise<urlDisconnectQuery[]> {
    let disconnectQuery: urlDisconnectQuery[] = [];
    for (const i in fileSources) {
        if (!sources.includes(fileSources[i].url)) {
            disconnectQuery.push({
                id: fileSources[i].id,
            });
        }
    }
    return disconnectQuery;
}

/*
    Generates a unique name for a file
    @param extension: Extension of file
    @returns Unique file name
 */
export async function generateFileName(extension: string) {
    return `${ uuid() }.${ extension }`;
}

/*
    Generates a thumbnail in the thumbnail directory using sourceFile
    @param sourceFile: Path to source file to generate thumbnail of
 */
async function generateThumbnail(sourceFile: string) {
    await sharp(`${ fileBasePath }/${ sourceFile }`)
        .resize(226, 226, {
            fit: 'inside', withoutEnlargement: true,
        })
        .toFile(`${ thumbnailBasePath }/${ sourceFile }`);
}

/*
    Generates a hash for a file based on the provided buffer
    @param buffer: Buffer of the file
    @returns hash of the file
 */
export async function getFileHash(file: Buffer): Promise<string> {
    return crypto.createHash('md5').update(file).digest('hex');
}

/*
    Finds the namespace of a tag
    @param tag - the tag to find the namespace of
    @returns the namespace of the tag
*/
export async function getNamespace(tag: string): Promise<Namespace> {
    let namespace: Namespace = Namespace.tag;
    if (tag.startsWith('creator:')) {
        namespace = Namespace.creator;
    } else if (tag.startsWith('series:')) {
        namespace = Namespace.series;
    } else if (tag.startsWith('character:')) {
        namespace = Namespace.character;
    } else if (tag.startsWith('meta:')) {
        namespace = Namespace.meta;
    }
    return namespace;
}

export async function getSite(url: string): Promise<Site> {
    const parsedUrl = new URL(url);
    switch (parsedUrl.host) {
        case 'danbooru.donmai.us':
            return Site.danbooru;
        case 'pixiv.net':
            return Site.pixiv;
        default:
            return Site.unknown;
    }
}


/*
    Returns the proper rating tag based on the provided string
    @param rating: string
    @returns Rating.<rating>, defaults to unknown
 */
export async function getRating(rating: string | undefined): Promise<Rating> {
    switch (rating) {
        case 'explicit':
            return Rating.explicit;
        case 'questionable':
            return Rating.questionable;
        case 'safe':
            return Rating.safe;
        default:
            return Rating.explicit;
    }
}

/*
    Gets the file extension of a file from the mimetype
    @param file: Multer file
    @returns file extension
 */
export async function getExtensionFromMimeType(mimeType: string) {
    return mimeType.split('/').pop();
}

/*
    Checks to see if file exists in approved file type
    @param Multer file
    @returns true or false based on whether file is valid
*/
export async function isValidExtension(fileType: string) {
    return allowedExtensions.includes(fileType);
}

/*
    Returns the file extension from provided URL
    @param url: URL of file
    @returns file extension
 */
export async function getFileExtensionFromURL(url: string) {
    return url.split('.').pop();
}


/*
    Checks to see if file exists in approved mimetypes
    @param Multer file
    @returns true or false based on whether file is valid
 */
export async function isValidMimeType(mimetype: string): Promise<boolean> {
    const allowedMimeTypes = ['image/png', 'image/jpg', 'image/jpeg'];
    return allowedMimeTypes.includes(mimetype);
}

/*
    Gets the size of a file from the provided buffer
    @param buffer: File in buffer
    @returns size of file in kb as a number
 */
export async function getFileSize(file: Buffer): Promise<number> {
    return Math.round(file.byteLength / 1024);
}

/*
    Updates a file using the provided data payload
    @param id: id of file to update
    @param dataPayload: dataPayload containing connection queries + update data
    @returns updated file
 */
export async function updateFile(id: number, dataPayload: dataPayload) {
    return await prisma.file.update({
        where: { id: id },
        data: dataPayload,
        include: {
            tags: {
                select: {
                    id: true,
                    tag: true,
                    namespace: true,
                    _count: true,
                },
            },
            sources: {
                select: {
                    id: true,
                    url: true,
                    site: true,
                    status: true,
                    _count: true,
                },
            },
        },
    });
}

/*
    Writes a file to the fileBasePath, then generates a thumbnail
    @param file: Multer file
    @returns fileName: Name of file with extension
 */
export async function writeFile(file: Buffer, fileName: string) {
    const filePath = `${ fileName.substring(0, 2) }/${ fileName }`;
    await createFolders(fileName);

    fs.writeFileSync(`${ fileBasePath }/${ filePath }`, file);
    await generateThumbnail(filePath);
}

/*
    Delete the specified file from the file system
    @param id: id of the file to delete
    @returns true or false based on whether the file was deleted or not
 */
export async function deleteFile(filename: string) {
    try {
        const filePath = `${ filename.substring(0, 2) }/${ filename }`;
        fs.unlinkSync(`${ fileBasePath }/${ filePath }`);
        fs.unlinkSync(`${ thumbnailBasePath }/${ filePath }`);
        return true;
    } catch (err: any) {
        console.log(err);
        return false;
    }
}

export async function updateFileStatus(id: number, status: FileStatus) {
    return await prisma.file.update({
        where: { id: id },
        data: { status: status },
    });
}

export interface tagConnectQuery {
    where: { tag_namespace: { tag: string, namespace: Namespace } };
    create: { tag: string, namespace: Namespace };
}

export interface tagDisconnectQuery {
    id: number;
}

export interface urlConnectQuery {
    where: { url: string };
    create: { site: Site, url: string };
}

export interface urlDisconnectQuery {
    id: string,
}

export interface dataPayload {
    rating?: Rating,
    sources?: {
        connectOrCreate: urlConnectQuery[],
        disconnect: urlDisconnectQuery[],
    },
    tags: {
        connectOrCreate: tagConnectQuery[],
        disconnect: tagDisconnectQuery[]
    }
}

interface tag {
    id: number,
    tag: string,
    namespace: Namespace
}

interface source {
    id: string,
    site: Site,
    url: string,
    status: UrlStatus,
}