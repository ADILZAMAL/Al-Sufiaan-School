import winston from 'winston';
import LokiTransport from 'winston-loki';

const isProduction = process.env.NODE_ENV === 'production';
const logLevel = process.env.LOG_LEVEL || (isProduction ? 'http' : 'debug');

const jsonFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
);

const devFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
    winston.format.errors({ stack: true }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, requestId, ...meta }) => {
        const rid = requestId ? ` [${requestId}]` : '';
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        return `${timestamp} ${level}${rid}: ${message}${metaStr}`;
    }),
);

const transports: winston.transport[] = [];

if (isProduction) {
    // JSON to stdout — Render captures this natively
    transports.push(
        new winston.transports.Console({ format: jsonFormat }),
    );

    // Loki transport — only if LOKI_HOST is configured
    if (process.env.LOKI_HOST) {
        const lokiTransport = new LokiTransport({
            host: process.env.LOKI_HOST,
            basicAuth: process.env.LOKI_BASIC_AUTH,
            labels: {
                app: 'alsufiaanschool',
                env: process.env.NODE_ENV || 'production',
            },
            format: jsonFormat,
            replaceTimestamp: true,
            batching: false,
            onConnectionError: (err: Error) => {
                console.error('Loki connection error:', err.message, err.stack);
            },
        });
        lokiTransport.on('error', (err: Error) => {
            console.error('Loki transport error:', err.message, err.stack);
        });
        transports.push(lokiTransport);
    }
} else {
    transports.push(
        new winston.transports.Console({ format: devFormat }),
    );
}

const logger = winston.createLogger({
    level: logLevel,
    transports,
    exitOnError: false,
});

export default logger;
