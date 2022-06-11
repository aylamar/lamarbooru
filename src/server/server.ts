import cors from 'cors';
import express from 'express';
import path from 'path';
//@ts-ignore
import { handler } from '../client/handler.js';
import routeController from './routes/route.controller.js';
import { SubscriptionsService } from './services/subscription.service.js';
import { TrashService } from './services/trash.service.js';

const server = express();
const port = process.env.PORT || 3000;

// use cors to allow cross-origin requests
server.use(cors({
    origin: '*',
}));

// use path to get list of files in directory
if (!process.env.FILES_DIRECTORY) throw new Error('FILES_DIRECTORY environment variable is not set');
export const fileBasePath = path.join(path.parse(process.cwd()).root, process.env.FILES_DIRECTORY);

if (!process.env.THUMBNAILS_DIRECTORY) throw new Error('THUMBNAILS_DIRECTORY environment variable is not set');
export const thumbnailBasePath = path.join(path.parse(process.cwd()).root, process.env.THUMBNAILS_DIRECTORY);

// Set location of public files & set cache
const short = 7 * 24 * 60 * 60 * 1000;
server.use(express.json());
server.use('/public', express.static('public', { maxAge: short }));
server.use('/public/files', express.static(fileBasePath, { maxAge: short }));
server.use('/public/thumbs', express.static(thumbnailBasePath, { maxAge: short }));
server.use(express.urlencoded({
    limit: '20kb', extended: true,
}));
// initialize routes
server.use(routeController);
// initialize svelte-kit
server.use(handler);

// start subscription service
const subscriptionService = new SubscriptionsService();
const trashService = new TrashService();

server.listen(port);
console.log(`Server listening on port ${ port }`);
