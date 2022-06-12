import { createLogger, format, transports } from 'winston';
const { combine, timestamp, colorize, printf } = format;

const logFormat = printf(({ level, message, stack, timestamp }) => {
    return `${timestamp} ${level}: ${stack || message}`;
});

export const prodLogger = createLogger({
    level: 'info',
    format: combine(
        colorize(),
        timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
        format.errors({ stack: true }),
        logFormat
    ),
    transports: [
        new transports.Console()
        // new winston.transports.File({ filename: 'error.log', level: 'error' }),
        // new winston.transports.File({ filename: 'combined.log' }),
    ],
});

export const devLogger = createLogger({
    level: 'debug',
    format: combine(
        colorize(),
        timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
        format.errors({ stack: true }),
        logFormat
    ),
    transports: [
        new transports.Console()
    ],
});
