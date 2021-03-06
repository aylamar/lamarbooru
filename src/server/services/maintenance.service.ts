import fs from 'fs';
import cron from 'node-cron';
import path from 'path';
import { validate } from 'uuid';
import { fileBasePath, logger, thumbnailBasePath } from '../server.js';
import { deleteFile, generateThumbnail, updateDeleteStatus } from '../utils/file.util.js';
import prisma from '../utils/prisma.util.js';

export class MaintenanceService {
    private dailyRunning: boolean;
    private weeklyRunning: boolean;
    private readonly deleteMisplacedFiles: boolean;

    constructor() {
        this.dailyRunning = false;
        this.weeklyRunning = false;
        this.deleteMisplacedFiles = process.env.DELETE_MISPLACED_FILES === 'true';

        cron.schedule('0 7 * * *', () => {
            void this.runDailyMaintenance();
        });

        cron.schedule('0 9 * * 2', () => {
            void this.runWeeklyMaintenance();
        });
    }

    /*
        Returns an array of folders from a provided path
        @param sourcePath: path to search
        @returns: array of folders
     */
    private static getFoldersFromPath(sourcePath: string) {
        return fs.readdirSync(sourcePath, { withFileTypes: true });
    }

    /*
        Returns a list of all files in a provided path
        @param sourcePath: path to search
        @param folderName: name of the folder in the provided source path to search
        @returns: array of files
     */
    private static getFilesFromPath(sourcePath: string, folder: string) {
        return fs.readdirSync(path.join(sourcePath, folder), { withFileTypes: true });
    }

    /*
        Returns a list of files that are in the trash that are older than 7 days
        @returns: array of Files
     */
    private static async findOldTrash() {
        const now = new Date();
        const date = new Date(now.getDate() - 7);

        return await prisma.file.findMany({
            where: {
                AND: [{ updateDate: { lt: date } }, { trash: true }],
            },
        });
    }

    /*
        Deletes all files in the trash that are older than 7 days
     */
    private static async deleteOldTrash() {
        logger.info('Deleting files that have been in the trash for more than 7 days...', { label: 'trash' });
        const oldTrash = await MaintenanceService.findOldTrash();

        // if there are no old trash files, return
        if (oldTrash.length === 0) {
            logger.info('Found no files in the trash that are older than 7 days', { label: 'trash' });
            return;
        }

        for (const file of oldTrash) {
            const updatedFile = await updateDeleteStatus(file.id, true);
            if (!updatedFile) {
                logger.info(`Error updating file status of ${ file.id }`, { label: 'trash' });
                continue;
            }

            const deletedFile = await deleteFile(file.filename);
            if (!deletedFile) logger.error(`Error deleting file ${ file.id }`, { label: 'trash' });
        }
        return;
    }

    /*
        Get a list of all files names, then regenerate thumbnails for all files
     */
    public async regenerateThumbnails() {
        const files = await prisma.file.findMany({
            where: { trash: false },
        });

        logger.info(`Found ${ files.length } files in the database. Processing each file now...`, { label: 'trash' });
        for (const file of files) {
            const filePath = `${ file.filename.substring(0, 2) }/${ file.filename }`;
            await generateThumbnail(filePath);
        }
        logger.info('Finished regenerating thumbnails', { label: 'trash' });
        return;
    }

    /*
        This will clean the file directories of files that are not in the database.
     */
    private async cleanFileDirectories() {
        const baseDirectories = [fileBasePath, thumbnailBasePath];

        // iterate through base directories, looking for sub folders
        for (const directory of baseDirectories) {
            const folders = MaintenanceService.getFoldersFromPath(directory);
            logger.info(`Found ${ folders.length } folders in ${ directory }. Processing each folder now...`, { label: 'trash' });

            // iterate through sub folders, looking for files
            for (const folder of folders) {
                if (folder.isFile()) continue;
                const files = MaintenanceService.getFilesFromPath(directory, folder.name);

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
                        logger.info(`Found file named ${ file.name } in ${ directory }\\${ folder.name } that is not in the database and is not a UUID`, { label: 'trash' });
                        continue;
                    }

                    // do not delete any files if deleteMisplacedFiles is false
                    if (!this.deleteMisplacedFiles) {
                        logger.info(`Found file named ${ file.name } in ${ directory }\\${ folder.name } that is not in the database`, { label: 'trash' });
                        continue;
                    }

                    try {
                        fs.unlinkSync(path.join(directory, folder.name, file.name));
                        logger.info(`Found file named ${ file.name } in ${ directory }\\${ folder.name } that is not in the database, so it has been deleted`, { label: 'trash' });
                    } catch (err) {
                        logger.error(`Error deleting file ${ file.name }`, { label: 'trash' });
                        logger.error(err);
                    }
                }
            }
        }
        return;
    }

    /*
        Daily maintenance runner
     */
    private async runDailyMaintenance() {
        if (this.dailyRunning) {
            logger.debug('Daily maintenance is already running, skipping.', { label: 'trash' });
            return;
        }

        this.dailyRunning = true;
        await MaintenanceService.deleteOldTrash();
        this.dailyRunning = false;
        return;
    }

    /*
        Weekly maintenance runner
     */
    private async runWeeklyMaintenance() {
        if (this.weeklyRunning) {
            logger.debug('Weekly maintenance is already running, skipping.', { label: 'trash' });
            return;
        }

        this.weeklyRunning = true;
        await this.cleanFileDirectories();
        await this.regenerateThumbnails();
        this.weeklyRunning = false;
        return;
    }
}