import {readFile} from 'fs/promises';
import {join} from 'path';
import {getDirectoryTests, getFixedFilePath} from '../test/directory-test-helpers';
import {removeUnusedImportsFromText} from './remove-unused-imports';

describe(removeUnusedImportsFromText.name, () => {
    it('should pass all directory tests', async () => {
        const directoryTests = await getDirectoryTests();

        await Promise.all(
            directoryTests.map(async (directoryTest) => {
                await Promise.all(
                    directoryTest.brokenFileRelativePaths.map(async (brokenFileRelativePath) => {
                        const brokenFilePath = join(
                            directoryTest.directoryPath,
                            brokenFileRelativePath,
                        );
                        const operatedOnContents = await removeUnusedImportsFromText({
                            filePath: brokenFilePath,
                            importPaths: [],
                        });
                        const fixedFilePath = getFixedFilePath(brokenFileRelativePath);
                        const expectedFixedContents = (
                            await readFile(join(directoryTest.directoryPath, fixedFilePath))
                        ).toString();

                        expect(operatedOnContents).toBe(expectedFixedContents);
                    }),
                );
            }),
        );
    });
});
