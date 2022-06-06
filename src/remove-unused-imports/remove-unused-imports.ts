import {readFile} from 'fs/promises';

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

export async function removeUnusedImports(inputs: UnusedImportsInputs): Promise<string> {
    const fileContents = inputs.code ?? (await readFile(inputs.filePath)).toString();

    return fileContents;
}
