import { Logger } from 'winston';
import { createLogger, format, transports } from 'winston';
const { combine, timestamp, colorize, printf } = format;

const logFormat = printf(({ label, level, message, stack, timestamp }) => {
    let service = ''
    if (label) service = `[${label}] `;
    return `${timestamp} ${level}: ${service}${stack || message}`;
});

const prodLogger = createLogger({
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

const devLogger = createLogger({
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

export function getLogger(): Logger {
    if (process.env.NODE_ENV === 'development') {
        return devLogger;
    } else {
        return prodLogger;
    }
}