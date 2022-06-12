import { FileStatus } from '@prisma/client';
import { Request, Response } from 'express';
import prisma from '../../../utils/prisma.util.js';

export async function getStats(req: Request, res: Response) {
    let files = await prisma.file.aggregate({
        _sum: {
            size: true,
        }, _count: {
            id: true,
        }, where: {
            NOT: { status: FileStatus.deleted },
        },
    });
    const tags = await prisma.tag.count();
    return res.status(200).send({ files: files._count.id, fileSize: files._sum.size, tags: tags });
}
