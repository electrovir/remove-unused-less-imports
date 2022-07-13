#!/usr/bin/env node

import {awaitedForEach} from 'augment-vir';
import {existsSync} from 'fs';
import {join} from 'path';
import {removeAndWriteUnusedImports} from '../imports-and-exports/remove-unused-imports';
import {getAllLessFiles} from './get-all-less-files';

async function main() {
    const indexOfThisScript = process.argv.findIndex((argv) => {
        return argv.endsWith(join('cli', 'cli.js')) || argv.endsWith(join('cli', 'cli.ts'));
    });
    const indexOfSearchDir = indexOfThisScript + 1;
    const searchDir = process.argv[indexOfSearchDir];
    if (!searchDir || !existsSync(searchDir)) {
        throw new Error(
            `First argument must be a valid directory to search in. Got "${searchDir}"`,
        );
    }
    const importDirs = process.argv.slice(indexOfSearchDir + 1);
    importDirs.forEach((importDir) => {
        if (!importDir || !existsSync(importDir)) {
            throw new Error(`Could not find import dir "${importDir}"`);
        }
    });

    const allLessFiles = await getAllLessFiles(searchDir);

    await awaitedForEach(allLessFiles, async (lessFile) => {
        await removeAndWriteUnusedImports({
            filePath: lessFile,
            importPaths: importDirs,
        });
    });
    throw new Error('blah');
}

if (require.main === module) {
    main();
}
