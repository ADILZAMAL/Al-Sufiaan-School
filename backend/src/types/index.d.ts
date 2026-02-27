declare namespace Express {
    export interface Request {
        userId: string;
        schoolId: string;
    }
    export interface Locals {
        requestId?: string;
    }
}
