import { Router } from "express";
import multer, { memoryStorage } from "multer";
import {
    checkIfHashExists, createFile, generateConnectQuery, generateFileName,
    getExtensionFromMimeType,
    getFileHash, getRating,
    isValidMimeType,
    writeFile
} from "../../../utils/fileUtils";
import prisma from "../../../utils/prisma";

const upload = multer({ storage: memoryStorage() }).single('file');

let router = Router();
router.post('/', (req, res, next) => {
    upload(req, res, (err) => {
        if (err) return res.status(400).send({ 'error': 'No valid file attached' })
        next()
    })
}, async (req, res) => {
    const rawFile = req.file
    if (!rawFile) return res.status(400);

    const valid = await isValidMimeType(rawFile.mimetype)
    console.log(rawFile.mimetype)
    if (!valid) return res.status(400).send({ 'error': 'Invalid rawFile type' })

    const hash = await getFileHash(rawFile.buffer)
    const fileExists = await checkIfHashExists(hash)
    if (fileExists) return res.status(303).send({ 'error': 'File already exists', file: fileExists })

    const extension = await getExtensionFromMimeType(rawFile.mimetype)
    if (!extension) return res.status(400).send({ 'error': 'Invalid rawFile type' })

    // parse values from request
    let { tags, artist, rating, source } = req.body
    const tagsArray = tags ? tags.split(' ') : []

    if (artist && !artist.startsWith('artist:')) artist = `artist:${artist}`
    const arr = [...artist ? [artist] : [], ...tagsArray]
    const connectQuery = await generateConnectQuery(arr)

    // if tags, artist, rating, or source is undefined, set to null
    rating = await getRating(rating)
    if (!source) source = null

    const fileName = await generateFileName(extension)
    const file = await createFile(fileName, hash, connectQuery, rating, source)

    await writeFile(rawFile.buffer, fileName)

    return res.status(200).send({ 'success': 'File uploaded', file: file })
});

router.get('/:id', async (req, res) => {
    const { id } = req.params
    const parsedId = parseInt(id)

    if (isNaN(parsedId)) return res.status(400).send({ 'error': 'Invalid id' })


    const file = await getFileById(parsedId)
    if (!file) return res.status(404).send({ 'error': 'No files found' })
    return res.status(200).send(file)
})

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
            id: id
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
                }
            }
        }
    })
}

export default router;