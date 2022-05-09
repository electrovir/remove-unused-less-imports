import {readDirRecursive} from 'augment-vir/dist/cjs/node-only';
import {existsSync} from 'fs';
import {readdir} from 'fs/promises';
import {join} from 'path';
import {assertValidDir} from '../augments/fs';
import {directoryTestsDir} from './test-file-paths';

const brokenDirName = 'broken';
const fixedDirName = 'fixed';

type DirectoryTestFiles = Readonly<{
    directoryPath: string;
    // these paths are relative to the accompanying property directoryPath
    brokenFileRelativePaths: Readonly<string[]>;
}>;

export async function getDirectoryTests(
    dirToScan = directoryTestsDir,
): Promise<Readonly<DirectoryTestFiles[]>> {
    const directoryPathsToTest = (await readdir(dirToScan)).map((dirName) =>
        join(dirToScan, dirName),
    );

    return await Promise.all(
        directoryPathsToTest.map(async (directoryPath) => getDirectoryTestFiles(directoryPath)),
    );
}

async function getDirectoryTestFiles(directoryPath: string): Promise<DirectoryTestFiles> {
    await assertValidDir(directoryPath);

    const brokenFilesDir = join(directoryPath, brokenDirName);

    if (!existsSync(brokenFilesDir)) {
        throw new Error(
            `Directory test "${directoryPath}" needs to have a child "broken" dir but doesn't.`,
        );
    }

    return {
        directoryPath,
        brokenFileRelativePaths: (await readDirRecursive(brokenFilesDir)).map((insideBroken) =>
            join(brokenDirName, insideBroken),
        ),
    };
}

export function getFixedFilePath(brokenFilePath: string): string {
    if (!brokenFilePath.startsWith(brokenDirName)) {
        throw new Error(
            `Broken file path does not start with "${brokenDirName}": "${brokenFilePath}"`,
        );
    }

    return brokenFilePath.replace(/^broken/, fixedDirName);
}
