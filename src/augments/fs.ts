import {stat} from 'fs/promises';

export async function isValidDir(inputDir: string): Promise<boolean> {
    return (await stat(inputDir)).isDirectory();
}

export async function assertValidDir(inputDir: string): Promise<void> {
    if (!(await isValidDir(inputDir))) {
        throw new Error(`"${inputDir}" is not a valid directory.`);
    }
}
