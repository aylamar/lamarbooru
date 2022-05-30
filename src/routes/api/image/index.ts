import { Router } from "express";
import multer, { memoryStorage } from "multer";
import {
    checkIfHashExists, createImage, generateConnectQuery, generateFileName,
    getExtensionFromMimeType,
    getFileHash, getRating,
    isValidMimeType,
    writeFile
} from "../../../utils/imageUtils";

const upload = multer({ storage: memoryStorage() }).single('file');

let router = Router();
router.post('/', (req, res, next) => {
    upload(req, res, (err) => {
        if (err) return res.status(400).send({ 'error': 'No valid file attached' })
        next()
    })
}, async (req, res) => {
    const file = req.file
    if (!file) return res.status(400);

    const valid = await isValidMimeType(file.mimetype)
    if (!valid) return res.status(400).send({ 'error': 'Invalid file type' })

    const hash = await getFileHash(file.buffer)
    const imageExists = await checkIfHashExists(hash)
    if (imageExists) return res.status(303).send({ 'error': 'Image already exists', image: imageExists })

    const extension = await getExtensionFromMimeType(file.mimetype)
    if (!extension) return res.status(400).send({ 'error': 'Invalid file type' })

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
    const image = await createImage(fileName, hash, connectQuery, rating, source)

    await writeFile(file.buffer, fileName)

    return res.status(200).send({ 'success': 'Image uploaded', image: image })
});

export default router;