import { Rating } from '@prisma/client';
import { Request, Response } from 'express';
import {
    checkIfHashExists,
    connectQuery,
    createFile,
    dataPayload,
    disconnectQuery,
    generateConnectQuery,
    generateFileName,
    getExtensionFromMimeType,
    getFileHash,
    getRating,
    isValidMimeType,
    updateFile,
    writeFile,
} from '../../../utils/fileUtils.js';
import prisma from '../../../utils/prisma.js';
import { fileSchema, idSchema, tagSchema } from './file.validation.js';

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

    const connectQuery = await generateConnectQuery(data.tags);

    const rating = await getRating(data.rating);
    let source: string[] = [];
    if (data.source) source = data.source;

    const fileName = await generateFileName(extension);
    const file = await createFile(fileName, hash, connectQuery, rating, source);

    await writeFile(rawFile.buffer, fileName);

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
        source?: string,
    };

    try {
        data = await fileSchema.validateAsync(req.body);
    } catch (err: any) {
        return res.status(400).send(err.details);
    }

    if (!req.params?.id) return res.status(400);
    const { id } = req.params;
    const parsedId = parseInt(id);
    const { tags, rating, source } = data;

    const file = await getFileById(parsedId);
    if (!file) return res.status(404).send({ 'error': 'No files found' });

    // iterate through post.tags, and combine namespace:tag
    let fileTags = [];
    for (const i in file.tags) {
        if (file.tags[i].namespace === 'tag') {
            fileTags.push(file.tags[i].tag);
        } else {
            fileTags.push(file.tags[i].namespace + ':' + file.tags[i].tag);
        }
    }

    // Remove any tags that are no longer in use
    let disconnectQuery: disconnectQuery[] = [];
    for (const i in fileTags) {
        if (!tags.includes(fileTags[i])) {
            disconnectQuery.push({
                id: file.tags[i].id,
            });
        }
    }

    // Add new tags that are in use
    let connectQuery: connectQuery[] = await generateConnectQuery(tags);
    let dataPayload: dataPayload = {
        tags: {
            connectOrCreate: connectQuery,
            disconnect: disconnectQuery,
        },
    };
    if (rating) dataPayload.rating = rating;
    if (source) dataPayload.source = source;

    const updatedFile = await updateFile(parsedId, dataPayload);
    if (!updatedFile) return res.status(500).send({ 'error': 'Error updating file' });

    return res.status(200).send(updatedFile);
}

export async function searchFileHandler(req: Request, res: Response) {
    let data: { id: number };
    let tagData: { tags?: string };
    try {
        data = await idSchema.validateAsync(req.params);
        tagData = await tagSchema.validateAsync(req.query);
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

export async function getFileStats(req: Request, res: Response) {
    const files = await prisma.file.count();
    const tags = await prisma.tag.count();
    return res.status(200).send({ files: files, tags: tags });
}

/*

    Begin helper functions

*/

/*
    Finds a post by id
    @param id - the id of the post to find
    @returns the post if found, otherwise null
*/
async function getFileById(id: number) {
    return await prisma.file.findUnique({
        where: {
            id: id,
        }, select: {
            id: true,
            filename: true,
            createdAt: true,
            updatedAt: true,
            source: true,
            approved: true,
            rating: true,
            tags: {
                select: {
                    id: true,
                    tag: true,
                    namespace: true,
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
        return await prisma.file.findMany({
            where: {
                tags: { some: { tag: { in: tags } } },
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