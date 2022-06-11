import { FileStatus } from '@prisma/client';
import { Request, Response } from 'express';
import prisma from '../../../utils/prisma.js';

export async function getStats(req: Request, res: Response) {
    const files = await prisma.file.count();
    let fileSize = await prisma.file.aggregate({
        _sum: {
            size: true,
        },
        where: {
            NOT: {
                status: FileStatus.deleted,
            },
        },
    });
    const tags = await prisma.tag.count();
    return res.status(200).send({ files: files, fileSize: fileSize._sum.size, tags: tags });
}
