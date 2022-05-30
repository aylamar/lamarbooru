import express from 'express';
import routes from './routes';

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const server = express();
const port = process.env.PORT || 3000;

// Set location of public files & set cache
const short = 7 * 24 * 60 * 60 * 1000;
server.use(express.json());
server.use('/public', express.static('public', { maxAge: short }));
server.use(express.urlencoded({
    limit: '20kb',
    extended: true
}));

// initialize routes
server.use(routes)

server.listen(port)
console.log(`Server listening on port ${port}`);