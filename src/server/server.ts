import cors from 'cors';
import express from 'express';
//@ts-ignore
import { handler } from '../client/handler.js';
import { SubscriptionsService } from './downloaders/subscription.service.js';
import routeController from './routes/route.controller.js';

const server = express();
const port = process.env.PORT || 3000;

// use cors to allow cross origin requests
server.use(cors({
    origin: '*',
}));

// Set location of public files & set cache
const short = 7 * 24 * 60 * 60 * 1000;
server.use(express.json());
server.use('/public', express.static('public', { maxAge: short }));
server.use(express.urlencoded({
    limit: '20kb', extended: true,
}));
// initialize routes
server.use(routeController);
// initialize svelte-kit
server.use(handler);

// start subscription service
const subscriptionService = new SubscriptionsService();

server.listen(port);
console.log(`Server listening on port ${ port }`);
