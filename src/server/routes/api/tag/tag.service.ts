import { Request, Response } from 'express';
import prisma from '../../../utils/prisma.util.js';
import { tagSchema } from './tag.validation.js';

/*
    Gets a list of all tags starting with the provided string
 */
export async function tagSearchHandler(req: Request, res: Response) {
    let tagData: { tag: string };
    try {
        tagData = await tagSchema.validateAsync(req.params);
    } catch (err: any) {
        return res.status(400).send(err.details);
    }

    const tags = await prisma.tag.findMany({
        where: {
            tag: {
                startsWith: tagData.tag,
            },
        },
    });
    res.send(tags);
}
