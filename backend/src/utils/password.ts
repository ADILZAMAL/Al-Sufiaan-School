import bcrypt from 'bcryptjs';

const BCRYPT_COST = 10;

/** Hash a plaintext password. Single place to control the bcrypt cost factor. */
export const hashPassword = (password: string): Promise<string> => bcrypt.hash(password, BCRYPT_COST);
