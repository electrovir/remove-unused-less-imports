import {readFile} from 'fs/promises';

export type UnusedImportsInputs = {
    code?: string;
    filePath: string;
    importPaths: string[];
};

export async function removeUnusedImportsFromText(inputs: UnusedImportsInputs): Promise<string> {
    const fileContents = inputs.code ?? (await readFile(inputs.filePath)).toString();

    return fileContents;
}
