import {flattenSets} from '../augments/set';
import {parseLess, parseLessFile} from '../parse-less/parse';
import {parseTestFiles, parseTestingDir} from '../test/test-file-paths';
import {getAllImports, getAvailableImports} from './get-all-imports';

describe(getAllImports.name, () => {
    it('should extract all import nodes', async () => {
        const importedFiles = [
            'all-the-things',
            'simple-file',
        ];

        const context = (
            await parseLess(
                importedFiles
                    .map((fileName) => {
                        return `@import (reference) '${fileName}';`;
                    })
                    .join('\n'),
                {
                    paths: [parseTestingDir],
                },
            )
        ).root;

        const imports = getAllImports(context);
        expect(imports.length).toBe(2);
        expect(imports.map((importNode) => importNode.path.value)).toEqual(importedFiles);
    });
});

describe(getAvailableImports.name, () => {
    it('should extract names available for import', async () => {
        const context = (await parseLessFile(parseTestFiles.allTheThings)).root;
        const availableImports: Set<string> = flattenSets(
            getAvailableImports(context)
                .map((entry) => entry.names)
                .flat(),
        );
        expect(availableImports).toEqual(new Set(['@myVar']));
    });
});
