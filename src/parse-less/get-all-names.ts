import {getExportableNodeNames} from './extract-all-exportable';
import {getImportableNodeNames} from './extract-all-importable';
import {parseLessFile} from './parse';

export type ExportableAndImportableNames = {
    exportableNames: Set<string>;
    importableNames: Set<string>;
};

export async function getAllFileExportableAndImportableNames(
    filePath: string,
): Promise<ExportableAndImportableNames> {
    const context = (await parseLessFile(filePath)).root;
    const importableNames = getImportableNodeNames(context);
    const exportableNames = getExportableNodeNames(context);

    return {
        importableNames,
        exportableNames,
    };
}
