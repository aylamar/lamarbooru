import { FileStatus } from '@prisma/client';
import { deleteFile, updateFileStatus } from '../utils/fileUtils.js';
import prisma from '../utils/prisma.js';

export class TrashService {
    constructor() {
        void TrashService.deleteOldTrash();

        setInterval(async () => {
            await TrashService.deleteOldTrash();
        }, 6 * 60 * 60 * 1000);
    }

    private static async findOldTrash() {
        const now = new Date();
        const date = new Date(now.getDate() - 7);

        return await prisma.file.findMany({
            where: {
                AND: [
                    { updatedAt: { lt: date } },
                    { status: FileStatus.trash },
                ],
            },
        });
    }


    private static async deleteOldTrash() {
        const oldTrash = await TrashService.findOldTrash();

        for (const file of oldTrash) {
            const updatedFile = await updateFileStatus(file.id, FileStatus.deleted);
            if (!updatedFile) {
                console.log(`Error updating file status of ${ file.id }`);
                continue;
            }

            const deletedFile = await deleteFile(file.filename);
            if (!deletedFile) console.log(`Error deleting file ${ file.id }`);
        }
    }
}