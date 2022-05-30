import crypto from "crypto";
import fs from "fs";
import sharp from "sharp";
import prisma from "./prisma";
import { Namespace, Rating } from "@prisma/client";
import { v4 as uuid } from "uuid";

const fileBasePath = "./public/original";
const thumbnailBasePath = "./public/thumbnail";
const allowedExtensions = ["png", "jpg", "jpeg"];

/*
    Checks to see is an file exists already in database
    @param Multer file
    @returns true or false based on whether file is valid
 */
export async function checkIfHashExists(hash: string) {
    // @ts-ignore
    return await prisma.file.findUnique({
        where: {
            hash: hash
        }, include: {
            tags: true,
        }

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
    @param connectQuery: connectOrReplace query for all tags attached to a file
    @param rating: Enumerated rating of a file
    @param source: Source urls in array of strings
    @returns Image object
*/
export async function createFile(fileName: string, hash: string, connectQuery: connectQuery[], rating?: Rating, source?: string[]) {
    if (!rating) rating = Rating.explicit
    if (!source) source = []

    return await prisma.file.create({
        data: {
            filename: fileName, hash: hash, rating: rating, source: source, tags: {
                connectOrCreate: connectQuery
            }
        },
        include: {
            tags: true,
        }
    })
}

/*
    Generates connectOrReplace query for a tag list of tags
    @param tags: Array of tags to generate connect query for
    @returns Array of connectOrReplace queries
*/
export async function generateConnectQuery(tags?: string[]): Promise<connectQuery[]> {
    let connectQuery: connectQuery[] = [];
    if (!tags) return []

    for (const i in tags) {
        let tag = tags[i].replace(/ /g, "_");
        const namespace = await getNamespace(tag);
        tag = tag.replace(/^.*:/, "");

        connectQuery.push(<connectQuery>{
            where: { tag_namespace: { tag: tag, namespace: namespace } },
            create: { tag: tag, namespace: namespace }
        })
    }
    return connectQuery;
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
            fit: "inside", withoutEnlargement: true
        })
        .toFile(`${ thumbnailBasePath }/${ sourceFile }`);
}

/*
    Generates a hash for a file based on the provided buffer
    @param buffer: Buffer of the file
    @returns hash of the file
 */
export async function getFileHash(file: Buffer): Promise<string> {
    return crypto.createHash("md5").update(file).digest("hex");
}

/*
    Finds the namespace of a tag
    @param tag - the tag to find the namespace of
    @returns the namespace of the tag
*/
export async function getNamespace(tag: string): Promise<Namespace> {
    let namespace: Namespace = Namespace.tag
    if (tag.startsWith("creator:")) {
        namespace = Namespace.creator
    } else if (tag.startsWith("series:")) {
        namespace = Namespace.series
    } else if (tag.startsWith("character:")) {
        namespace = Namespace.character
    } else if (tag.startsWith("meta:")) {
        namespace = Namespace.meta
    }
    return namespace
}

/*
    Returns the proper rating tag based on the provided string
    @param rating: string
    @returns Rating.<rating>, defaults to unknown
 */
export async function getRating(rating: string | undefined): Promise<Rating> {
    switch (rating) {
        case "explicit":
            return Rating.explicit
        case "questionable":
            return Rating.questionable
        case "safe":
            return Rating.safe
        default:
            return Rating.explicit
    }
}

/*
    Gets the file extension of a file from the mimetype
    @param file: Multer file
    @returns file extension
 */
export async function getExtensionFromMimeType(mimeType: string) {
    return mimeType.split("/").pop();
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
    Checks to see if file exists in approved mimetypes
    @param Multer file
    @returns true or false based on whether file is valid
 */
export async function isValidMimeType(mimetype: string): Promise<boolean> {
    const allowedMimeTypes = ["image/png", "image/jpg", "image/jpeg"]
    return allowedMimeTypes.includes(mimetype)
}

/*
    Writes a file to the fileBasePath, then generates a thumbnail
    @param file: Multer file
    @returns fileName: Name of file with extension
 */
export async function writeFile(file: Buffer, fileName: string) {
    const filePath = `${ fileName.substring(0, 2) }/${ fileName }`
    await createFolders(fileName)

    fs.writeFileSync(`${ fileBasePath }/${ filePath }`, file);
    await generateThumbnail(filePath);
}

interface connectQuery {
    where: { tag_namespace: { tag: string, namespace: Namespace } }
    create: { tag: string, namespace: Namespace }
}