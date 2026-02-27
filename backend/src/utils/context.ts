import { AsyncLocalStorage } from 'async_hooks';

interface RequestContext {
    requestId: string;
}

export const als = new AsyncLocalStorage<RequestContext>();

export const getRequestId = (): string | undefined => als.getStore()?.requestId;
