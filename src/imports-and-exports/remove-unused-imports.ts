import {readFile, writeFile} from 'fs/promises';
import {tree} from 'less';
import {parseLess} from '../parse-less/parse';
import {getImportableNodeNames} from './extract-all-importable';
import {getAvailableImports} from './get-all-imports';

export type UnusedImportsInputs = {
    /**
     * The code to parse and remove imports from. If this is empty, the contents of the file at the
     * given filePath are used instead.
     */
    code?: string;
    /** The file that the code came from. */
    filePath: string;
    /** Directories where files can be imported from. Should be relative to the filePath. */
    importPaths: string[];
};

export function getUnusedImports(context: tree.Ruleset): Set<tree.Import> {
    const unusedImports = new Set<tree.Import>();
    const possiblyImportedNames = getImportableNodeNames(context);
    /** These are all the names that are */
    const availableImports = getAvailableImports(context);

    availableImports.forEach((availableImport) => {
        const used = Array.from(availableImport.names).some((importableName) => {
            return possiblyImportedNames.has(importableName);
        });

        if (!used) {
            unusedImports.add(availableImport.node);
        }
    });

    return unusedImports;
}

export async function removeUnusedImports(inputs: UnusedImportsInputs): Promise<string> {
    const originalFileContents = inputs.code ?? (await readFile(inputs.filePath)).toString();

    const root = (
        await parseLess(originalFileContents, {
            paths: inputs.importPaths,
            filename: inputs.filePath,
        })
    ).root;

    const unusedImports = Array.from(getUnusedImports(root))
        .sort((a, b) => a.index - b.index)
        .reverse();

    const fixedFileContents = unusedImports.reduce((newFileContents, unusedImport) => {
        const lineEndingIndex =
            newFileContents.slice(unusedImport.index).indexOf('\n') + unusedImport.index + 1;

        const fullLine = newFileContents.slice(unusedImport.index, lineEndingIndex);
        return newFileContents.replace(fullLine, '');
    }, originalFileContents);

    return fixedFileContents;
}

export async function removeAndWriteUnusedImports(
    inputs: Omit<UnusedImportsInputs, 'code'>,
): Promise<void> {
    const output = await removeUnusedImports(inputs);

    await writeFile(inputs.filePath, output);
}
