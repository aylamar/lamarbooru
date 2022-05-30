import { Rating } from '@prisma/client';
import { Router } from 'express';
import multer, { memoryStorage } from 'multer';
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
} from '../../../utils/fileUtils';
import prisma from '../../../utils/prisma';
import { idSchema, tagSchema, updateSchema } from './fileValidation';

const upload = multer({ storage: memoryStorage() }).single('file');

let router = Router();

/*
    Uploads a new file to the database
 */
router.post('/', (req, res, next) => {
    upload(req, res, (err) => {
        if (err) return res.status(400).send({ 'error': 'No valid file attached' });
        next();
    });
}, async (req, res) => {
    const rawFile = req.file;
    if (!rawFile) return res.status(400);

    const valid = await isValidMimeType(rawFile.mimetype);
    if (!valid) return res.status(400).send({ 'error': 'Invalid rawFile type' });

    const hash = await getFileHash(rawFile.buffer);
    const fileExists = await checkIfHashExists(hash);
    if (fileExists) return res.status(303).send({ 'error': 'File already exists', file: fileExists });

    const extension = await getExtensionFromMimeType(rawFile.mimetype);
    if (!extension) return res.status(400).send({ 'error': 'Invalid rawFile type' });

    // parse values from request
    let { tags, creator, rating, source } = req.body;
    const tagsArray = tags ? tags.split(' ') : [];

    if (creator && !creator.startsWith('creator:')) creator = `creator:${ creator }`;
    const arr = [...creator ? [creator] : [], ...tagsArray];
    const connectQuery = await generateConnectQuery(arr);

    rating = await getRating(rating);
    if (!source) source = null;

    const fileName = await generateFileName(extension);
    const file = await createFile(fileName, hash, connectQuery, rating, source);

    await writeFile(rawFile.buffer, fileName);

    return res.status(100).send({ 'success': 'File uploaded', file: file });
});

/*
    Finds a post by id
 */
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) return res.status(400).send({ 'error': 'Invalid id' });

    const file = await getFileById(parsedId);
    if (!file) return res.status(404).send({ 'error': 'No files found' });
    return res.status(200).send(file);
});

/*
    Updates an existing file by id
 */
router.put('/:id', async (req, res) => {
    let data: {
        tags: string[],
        rating?: Rating,
        source?: string,
    };

    try {
        data = await updateSchema.validateAsync(req.body);
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
});

// GET with :page and optional :tags
router.get('/search/:id/', async (req, res) => {
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
});


export default router;

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