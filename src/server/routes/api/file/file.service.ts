import { FileStatus, Prisma, Rating, Site } from '@prisma/client';
import { Request, Response } from 'express';
import { DownloaderService } from '../../../downloaders/downloader.service.js';
import {
    checkIfHashExists,
    createFile,
    dataPayload,
    generateFileName,
    generateSourceDisconnectQuery,
    generateTagConnectQuery,
    generateTagDisconnectQuery,
    generateUrlConnectQuery,
    getExtensionFromMimeType,
    getFileHash,
    getFileSize,
    getRating,
    getSite,
    isValidMimeType,
    tagConnectQuery,
    tagDisconnectQuery,
    updateFile,
    updateFileStatus,
    urlConnectQuery,
    urlDisconnectQuery,
    writeFile,
} from '../../../utils/fileUtils.js';
import prisma from '../../../utils/prisma.js';
import { booruSchema, fileSchema, idSchema, tagsSchema } from './file.validation.js';

export async function uploadFileHandler(req: Request, res: Response) {
    let data: {
        tags: string[],
        rating?: Rating,
        source?: string[],
    };

    try {
        data = await fileSchema.validateAsync(req.body);
    } catch (err: any) {
        return res.status(400).send(err.details);
    }

    const rawFile = req.file;
    if (!rawFile) return res.status(400).send({ 'error': 'No valid file attached' });
    const valid = await isValidMimeType(rawFile.mimetype);
    if (!valid) return res.status(400).send({ 'error': 'Invalid rawFile type' });

    const hash = await getFileHash(rawFile.buffer);
    const fileExists = await checkIfHashExists(hash);
    if (fileExists) return res.status(303).send({ 'error': 'File already exists', file: fileExists });

    const extension = await getExtensionFromMimeType(rawFile.mimetype);
    if (!extension) return res.status(400).send({ 'error': 'Invalid file type' });

    const tagConnectQuery = await generateTagConnectQuery(data.tags);
    let source: string[] = [];
    if (data.source) source = data.source;
    const sources = await generateUrlConnectQuery(source);

    const rating = await getRating(data.rating);
    const fileSize = await getFileSize(rawFile.buffer);

    const fileName = await generateFileName(extension);
    await writeFile(rawFile.buffer, fileName);
    const file = await createFile(fileName, hash, tagConnectQuery, sources, fileSize, rating);

    return res.status(200).send({ 'success': 'File uploaded', file: file });
}

export async function getFileHandler(req: Request, res: Response) {
    const { id } = req.params;
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) return res.status(400).send({ 'error': 'Invalid id' });

    const file = await getFileById(parsedId);
    if (!file) return res.status(404).send({ 'error': 'No files found' });
    return res.status(200).send(file);
}

export async function updateFileHandler(req: Request, res: Response) {
    let data: {
        tags: string[],
        rating?: Rating,
        source?: string[],
    };

    try {
        data = await fileSchema.validateAsync(req.body);
    } catch (err: any) {
        return res.status(400).send(err.details);
    }

    if (!req.params?.id) return res.status(400);
    const { id } = req.params;
    const parsedId = parseInt(id);
    let { tags, rating, source } = data;

    const file = await getFileById(parsedId);
    if (!file) return res.status(404).send({ 'error': 'No files found' });

    // iterate through file.tags, and combine namespace:tag
    let fileTags = [];
    for (const i in file.tags) {
        if (file.tags[i].namespace === 'tag') {
            fileTags.push(file.tags[i].tag);
        } else {
            fileTags.push(file.tags[i].namespace + ':' + file.tags[i].tag);
        }
    }

    // Remove any tags that are no longer in use
    const disconnectQuery: tagDisconnectQuery[] = await generateTagDisconnectQuery(tags, file.tags);
    const tagConnectQuery: tagConnectQuery[] = await generateTagConnectQuery(tags);

    if (!source) source = [];
    const urlConnectQuery: urlConnectQuery[] = await generateUrlConnectQuery(source);
    const urlDisconnectQuery: urlDisconnectQuery[] = await generateSourceDisconnectQuery(source, file.sources);

    let dataPayload: dataPayload = {
        sources: {
            connectOrCreate: urlConnectQuery,
            disconnect: urlDisconnectQuery,
        },
        tags: {
            connectOrCreate: tagConnectQuery,
            disconnect: disconnectQuery,
        },
    };
    if (rating) dataPayload.rating = rating;

    const updatedFile = await updateFile(parsedId, dataPayload);
    if (!updatedFile) return res.status(500).send({ 'error': 'Error updating file' });

    return res.status(200).send(updatedFile);
}

export async function searchFileHandler(req: Request, res: Response) {
    let data: { id: number };
    let tagData: { tags?: string };
    try {
        data = await idSchema.validateAsync(req.params);
        tagData = await tagsSchema.validateAsync(req.query);
    } catch (err: any) {
        return res.status(400).send(err.details);
    }

    const page = data.id;
    let tags: string[] | undefined;
    if (tagData.tags) tags = tagData.tags.split(' ');

    const files = await searchImages(page, tags);
    if (!files) return res.status(404).send({ 'error': 'No files found' });

    res.status(200).send(files);
}

export async function uploadBooruFile(req: Request, res: Response) {
    let data: {
        url: string,
    };

    try {
        data = await booruSchema.validateAsync(req.body);
    } catch (err: any) {
        return res.status(400).send(err.details);
    }
    const site = await getSite(data.url);
    console.log(site);
    if (site == Site.unknown || site == Site.pixiv) return res.status(400).send({ 'error': 'Invalid site' });

    const downloaderService = new DownloaderService();
    const file = await downloaderService.downloadFileFromService(data.url);

    return res.status(201).send(file);
}

export async function trashFileHandler(req: Request, res: Response) {
    let data: { id: number };
    try {
        data = await idSchema.validateAsync(req.params);
    } catch (err: any) {
        return res.status(400).send(err.details);
    }

    try {
        const file = await getFileById(data.id);
        if (!file) return res.status(404).send({ 'error': 'No files found' });
        if (file.status === FileStatus.trash || file.status === FileStatus.deleted) return res.status(405).send({ 'error': 'File already in trash' });

        await updateFileStatus(data.id, FileStatus.trash);
    } catch (err: any) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) return res.status(404).send({ 'error': 'No files found' });
        return res.status(500).send({ 'error': 'Error updating file' });
    }

    return res.status(202).send({ 'success': 'File moved to the trash' });
}

export async function unTrashFileHandler(req: Request, res: Response) {
    let data: { id: number };
    try {
        data = await idSchema.validateAsync(req.params);
    } catch (err: any) {
        return res.status(400).send(err.details);
    }

    try {
        const file = await getFileById(data.id);
        if (!file) return res.status(404).send({ 'error': 'No files found' });
        if (file.status != FileStatus.trash) return res.status(405).send({ 'error': 'File is not in trash' });

        await updateFileStatus(data.id, FileStatus.inbox);
    } catch (err: any) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) return res.status(404).send({ 'error': 'No files found' });
        return res.status(500).send({ 'error': 'Error updating file' });
    }

    return res.status(202).send({ 'success': 'File has been removed from the trash and moved to inbox' });
}

/*

    Begin helper functions

*/

/*
    Finds a file by id
    @param id - the id of the file to find
    @returns the file if found, otherwise null
*/
async function getFileById(id: number) {
    return await prisma.file.findUnique({
        where: {
            id: id,
        }, include: {
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
    Search for a page of 32 images with optional tags
    @param page - the page to search
    @param tags - the tags to search for
    @returns the page of images if found, otherwise empty array
 */
async function searchImages(idx: number, tags?: string[]) {
    if (tags) {
        const tagQueryArr: tagQuery[] = tags.map((tag) => {
            return { tags: { some: { tag: { in: tag } } } };
        });

        return await prisma.file.findMany({
            where: {
                AND: [
                    {
                        NOT: { status: FileStatus.deleted },
                    },
                    {
                        NOT: { status: FileStatus.trash },
                    },
                    ...tagQueryArr,
                ],
            },
            orderBy: {
                id: 'desc',
            },
            include: {
                tags: {
                    select: {
                        id: true,
                        tag: true,
                        namespace: true,
                        _count: true,
                    },
                },
            },
            skip: idx - 1, take: 32,
        });
    } else {
        return await prisma.file.findMany({
            where: {
                AND: [
                    {
                        NOT: { status: FileStatus.deleted },
                    },
                    {
                        NOT: { status: FileStatus.trash },
                    },
                ],
            },
            orderBy: {
                id: 'desc',
            },
            include: {
                tags: {
                    select: {
                        id: true,
                        tag: true,
                        namespace: true,
                        _count: true,
                    },
                },
            },
            skip: idx - 1, take: 32,
        });
    }
}

interface tagQuery {
    tags: { some: { tag: { in: string } } };
}
