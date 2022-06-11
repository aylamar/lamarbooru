import { Request, Response } from 'express';
import prisma from '../../../utils/prisma.js';
import { tagSchema } from './tag.validation.js';

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
