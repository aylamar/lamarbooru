import { FileStatus } from '@prisma/client';
import fs from 'fs';
import schedule from 'node-schedule';
import path from 'path';
import { validate } from 'uuid';
import { fileBasePath, thumbnailBasePath } from '../server.js';
import { deleteFile, updateFileStatus } from '../utils/fileUtils.js';
import prisma from '../utils/prisma.js';

export class TrashService {
    private dailyRunning: boolean;
    private weeklyRunning: boolean;
    private readonly deleteMisplacedFiles: boolean

    constructor() {
        this.dailyRunning = false;
        this.weeklyRunning = false;
        this.deleteMisplacedFiles = process.env.DELETE_MISPLACED_FILES === 'true';

        // every day at 2am, run daily maintenance
        schedule.scheduleJob({ hour: 2 }, async () => {
            await this.runDailyMaintenance();
        });

        // every tuesday at 5am, run weekly maintenance
        schedule.scheduleJob({ hour: 5, dayOfWeek: 2 }, async () => {
            await this.runWeeklyMaintenance();
        });
    }

    private async cleanFileDirectories() {
        const baseDirectories = [fileBasePath, thumbnailBasePath];

        // iterate through base directories, looking for sub folders
        for (const directory of baseDirectories) {
            const folders = TrashService.getFoldersFromPath(directory);

            // iterate through sub folders, looking for files
            for (const folder of folders) {
                if (folder.isFile()) continue;
                const files = TrashService.getFilesFromPath(directory, folder.name);

                // iterate through files, looking for files that do not exist in database
                for (const file of files) {
                    const foundFile = await prisma.file.findUnique({
                        where: { filename: file.name },
                    });

                    if (foundFile) continue;

                    /*
                        if file does not exist in database, check to see if it is the filename
                        is an uuid, and if it is, delete the file since it does not exist in the database
                        if this happens, odds are the file was written but the database was not updated
                        either due to error or due to the backend being stopped
                     */
                    const filename = file.name.slice(0, -path.extname(file.name).length);
                    const isValid = validate(filename);
                    if (!isValid) {
                        console.log(`Found file named ${ file.name } in ${ directory }/${ folder.name } that is not in the database`);
                        continue;
                    }

                    // do not delete any files if deleteMisplacedFiles is false
                    if (!this.deleteMisplacedFiles) {
                        console.log(`Found file named ${ file.name } in ${ directory }/${ folder.name } that is not in the database`);
                        continue;
                    }

                    try {
                        fs.unlinkSync(path.join(directory, folder.name, file.name));
                        console.log(`Found file named ${ file.name } in ${ directory }/${ folder.name } that is not in the database, so it has been deleted`);
                    } catch (err) {
                        console.log(`Error deleting file ${ file.name }`);
                    }
                }
            }
        }
        return;
    }

    private static getFoldersFromPath(sourcePath: string) {
        return fs.readdirSync(sourcePath, { withFileTypes: true });
    }

    private static getFilesFromPath(sourcePath: string, folder: string) {
        return fs.readdirSync(path.join(sourcePath, folder), { withFileTypes: true });
    }

    private static async findOldTrash() {
        const now = new Date();
        const date = new Date(now.getDate() - 7);

        return await prisma.file.findMany({
            where: {
                AND: [{ updateDate: { lt: date } }, { status: FileStatus.trash }],
            },
        });
    }

    private static async deleteOldTrash() {
        console.log('Deleting files that have been in the trash for more than 7 days...');
        const oldTrash = await TrashService.findOldTrash();

        // if there are no old trash files, return
        if (!oldTrash) {
            console.log('Found no files in the trash that are older than 7 days');
            return;
        }

        for (const file of oldTrash) {
            const updatedFile = await updateFileStatus(file.id, FileStatus.deleted);
            if (!updatedFile) {
                console.log(`Error updating file status of ${ file.id }`);
                continue;
            }

            const deletedFile = await deleteFile(file.filename);
            if (!deletedFile) console.log(`Error deleting file ${ file.id }`);
        }
        return;
    }

    private async runDailyMaintenance() {
        if (this.dailyRunning) return;

        this.dailyRunning = true;
        await TrashService.deleteOldTrash();
        this.dailyRunning = false;
        return;
    }

    private async runWeeklyMaintenance() {
        if (this.weeklyRunning) return;

        this.weeklyRunning = true;
        await this.cleanFileDirectories();
        this.weeklyRunning = false;
        return;
    }
}