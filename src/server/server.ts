import cors from 'cors';
import express from 'express';
//@ts-ignore
import { handler } from '../client/handler.js';
import routeController from './routes/route.controller.js';
import { getLogger } from './services/logger.service.js';
import { SubscriptionsService } from './services/subscription.service.js';
import { TrashService } from './services/trash.service.js';

export const logger = getLogger();

logger.info('Starting server...', { label: 'server' });

const reqEnvVars = [
    { var: 'DATABASE_URL', value: process.env.DATABASE_URL },
];

try {
    for (const envVar of reqEnvVars) if (!envVar.value) throw new Error(`Environment variable ${ envVar.var } is not set`);
} catch (err) {
    logger.error(err);
    process.exit(1);
}

export const fileBasePath = process.env.FILES_DIRECTORY || './files';
export const thumbnailBasePath = process.env.THUMBNAILS_DIRECTORY || './thumbnails';

const server = express();
const port = process.env.PORT || 3000;

// use cors to allow cross-origin requests
server.use(cors({
    origin: '*',
}));

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

// start misc services
new SubscriptionsService();
new TrashService();

server.listen(port);
logger.info(`Server listening on port ${ port }`, { label: 'server' });
