import { FileStatus, Prisma, Rating, Site } from '@prisma/client';
import { Request, Response } from 'express';
import { DownloaderService } from '../../../downloaders/downloader.service.js';
import { logger } from '../../../server.js';
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
    parseStatus,
    tagConnectQuery,
    tagDisconnectQuery,
    updateFile, updateFileStatus,
    updateTrashStatus,
    urlConnectQuery,
    urlDisconnectQuery,
    writeFile,
} from '../../../utils/file.util.js';
import prisma from '../../../utils/prisma.util.js';
import { booruSchema, fileSchema, idSchema, searchSchema, statusSchema } from './file.validation.js';

export async function uploadFileHandler(req: Request, res: Response) {
    const start = new Date();
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

    const runtime = new Date().getTime() - start.getTime();
    logger.debug(`Uploaded file ${ fileName } in ${ runtime }ms`);
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
    const start = new Date();
    let data: { id: number };
    let searchData: { tags?: string, status?: string, trash?: boolean };
    try {
        data = await idSchema.validateAsync(req.params);
        searchData = await searchSchema.validateAsync(req.query);
    } catch (err: any) {
        return res.status(400).send(err.details);
    }

    // tag processing
    const page = data.id;
    let tags: string[] | undefined;
    if (searchData.tags) tags = searchData.tags.split(' ');

    // file status processing
    let parsedStatus: string[] | undefined;
    if (searchData.status) parsedStatus = searchData.status.split(' ');

    let status: FileStatus[] = [];
    if (parsedStatus) {
        for (const i in parsedStatus) {
            try {
                status.push(await parseStatus(parsedStatus[i]));
            } catch (err) {
                return res.status(400).send({ 'error': `Invalid status ${ parsedStatus[i] }` });
            }
        }
        status = status.filter((item, index) => status.indexOf(item) === index);
    } else {
        status = [FileStatus.inbox, FileStatus.archived];
    }

    let trash: boolean | undefined;
    if (searchData.trash) trash = searchData.trash;

    const files = await searchImages(page, status, tags, trash);
    if (!files) return res.status(404).send({ 'error': 'No files found' });

    const runtime = new Date().getTime() - start.getTime();
    logger.debug(`${ req.route.path } for ${ tags?.join(' ') } completed in ${ runtime }ms`);
    return res.status(200).send(files);
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

    let trashStatus: boolean;
    if (req.method === 'PUT') trashStatus = true;
    else if (req.method === 'DELETE') trashStatus = false;
    else return res.status(400).send({ 'error': 'Invalid method' });

    try {
        const file = await getFileById(data.id);
        if (!file) return res.status(404).send({ 'error': 'No files found' });
        if (!trashStatus && !file.trash) return res.status(405).send({ 'error': 'File already in trash' });
        if (trashStatus && file.trash) return res.status(405).send({ 'error': 'File is not in trash' });

        await updateTrashStatus(data.id, trashStatus);
    } catch (err: any) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) return res.status(404).send({ 'error': 'No files found' });
        return res.status(500).send({ 'error': 'Error updating file' });
    }

    if (!trashStatus) return res.status(200).send({ 'message': 'File added to trash' });
    if (trashStatus) return res.status(200).send({ 'message': 'File removed from trash' });
}

export async function updateFileStatusHandler(req: Request, res: Response) {
    let params: { id: number };
    let query: { status: string };
    try {
        params = await idSchema.validateAsync(req.params);
        query = await statusSchema.validateAsync(req.query);
    } catch (err: any) {
        return res.status(400).send(err.details);
    }
    const id = params.id;
    const status = query.status;

    const file = await getFileById(id);
    if (!file) return res.status(404).send({ 'error': 'No files found' });

    const parsedStatus = await parseStatus(status);

    if (file.status.includes(parsedStatus)) return res.status(405).send({ 'error': `File is already marked as ${ status }` });
    // update file status
    const updatedFile = await updateFileStatus(id, parsedStatus);
    if (!updatedFile) return res.status(500).send({ 'error': 'Error updating file' });

    return res.status(200).send(updatedFile);
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
    Search for a page of 64 images with optional tags
    @param page - the page to search
    @param tags - the tags to search for
    @returns the page of images if found, otherwise empty array
 */
async function searchImages(idx: number, inclStatus: FileStatus[], tags?: string[], trash: boolean = false) {
    // generate query where file contains one of the inclStatus
    const statusQuery = inclStatus.map(status => ({ status: { equals: status } }));

    if (tags) {
        const tagQueryArr: tagQuery[] = tags.map((tag) => {
            return { tags: { some: { tag: { in: tag } } } };
        });

        return await prisma.file.findMany({
            where: {
                AND: [
                    { OR: statusQuery },
                    { trash: { equals: trash } },
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
            skip: idx - 1, take: 64,
        });
    } else {
        return await prisma.file.findMany({
            where: {
                AND: [
                    { OR: statusQuery },
                    { trash: { equals: trash } },
                ],
            },
            orderBy: { id: 'desc' },
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
            skip: idx - 1, take: 64,
        });
    }
}

interface tagQuery {
    tags: { some: { tag: { in: string } } };
}
