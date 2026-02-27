import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import { als } from '../utils/context';

// Attach a unique requestId to every request and expose it as a response header.
// Wraps the handler chain in AsyncLocalStorage so the requestId is available
// anywhere in the async call tree (e.g. Sequelize logging callbacks).
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const requestId = uuidv4();
    res.locals.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    als.run({ requestId }, next);
};

// Morgan stream → Winston at 'http' level
// Parse the JSON string morgan produces so fields become top-level in the log entry,
// not nested inside `message`. This makes LogQL filtering work properly in Grafana.
const morganStream = {
    write: (message: string) => {
        try {
            const parsed = JSON.parse(message.trim());
            logger.http('HTTP request', parsed);
        } catch {
            logger.http(message.trim());
        }
    },
};

// Custom tokens
morgan.token('request-id', (_req: Request, res: Response) => res.locals.requestId || '-');
morgan.token('user-id', (req: Request) => (req as any).userId || '-');

// JSON-formatted log line (machine-parseable)
const morganFormat = JSON.stringify({
    requestId: ':request-id',
    method: ':method',
    url: ':url',
    status: ':status',
    responseTimeMs: ':response-time',
    contentLength: ':res[content-length]',
    userId: ':user-id',
    remoteAddr: ':remote-addr',
    userAgent: ':user-agent',
});

// HTTP access logger — skip the health-check endpoint to reduce noise
export const httpLogger = morgan(morganFormat, {
    stream: morganStream,
    skip: (req: Request) => req.url === '/api/test',
});
