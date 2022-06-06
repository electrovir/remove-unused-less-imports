import {parseTestFiles} from '../test/test-file-paths';
import {
    ExportableAndImportableNames,
    getAllFileExportableAndImportableNames,
} from './get-all-names';

describe(getAllFileExportableAndImportableNames.name, () => {
    async function testImportableNodeNames(
        filePath: string,
        expectedNodeNames: ExportableAndImportableNames,
    ): Promise<void> {
        try {
            const allNodeNames = await getAllFileExportableAndImportableNames(filePath);

            expect(allNodeNames).toEqual(expectedNodeNames);
        } catch (error) {
            // this was added because an error without a stack trace was being thrown.
            console.error('errored in test');
            throw error;
        }
    }

    it('should correctly get all importable and exportable names in a complex file', async () => {
        await testImportableNodeNames(parseTestFiles.allTheThings, {
            exportableNames: new Set([
                '@var-definition',
                '@detached-rules-definition',
                '@map-definition',
                '.mixin-new-syntax',
                '.mixin-old-syntax',
                '.mixin-another',
                '#namespace-definition',
            ]),
            importableNames: new Set([
                '@var-definition',
                '@myVar',
                '.mixin-new-syntax',
                '.mixin-old-syntax',
                '.mixin-another',
                '@map-definition',
                '#namespace-definition',
            ]),
        });
    });

    it('should correctly get all importable and exportable names in a simple file', async () => {
        await testImportableNodeNames(parseTestFiles.simpleFile, {
            importableNames: new Set(),
            exportableNames: new Set(['@myVar']),
        });
    });
});
