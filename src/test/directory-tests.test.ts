import {readFile} from 'fs/promises';
import {join} from 'path';
import {getDirectoryTests, getFixedFilePath} from './directory-test-helpers';

async function dummyDoSomething(input: string): Promise<string> {
    return input;
}

describe(dummyDoSomething.name, () => {
    it('should pass all directory tests', async () => {
        const directoryTests = await getDirectoryTests();

        await Promise.all(
            directoryTests.map(async (directoryTest) => {
                await Promise.all(
                    directoryTest.brokenFileRelativePaths.map(async (brokenFileRelativePath) => {
                        const fileContents: string = (
                            await readFile(
                                join(directoryTest.directoryPath, brokenFileRelativePath),
                            )
                        ).toString();
                        const operatedOnContents = await dummyDoSomething(fileContents);
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
