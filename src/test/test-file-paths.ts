import {join} from 'path';
import {repoDir} from '../file-paths';

const testFilesDir = join(repoDir, 'test-files');
export const directoryTestsDir = join(testFilesDir, 'directory-tests');
export const parseTestingDir = join(testFilesDir, 'parse-testing');

export const parseTestFiles = {
    simpleFile: join(parseTestingDir, 'simple-file.less'),
    unusedImports: join(parseTestingDir, 'unused-imports.less'),
    allTheThings: join(parseTestingDir, 'all-the-things.less'),
    allTheThingsWithExtraExportableThings: join(
        parseTestingDir,
        'all-the-things-with-extra-exportable-things.less',
    ),
    allTheThingsWithExtraImportableThings: join(
        parseTestingDir,
        'all-the-things-with-extra-importable-things.less',
    ),
} as const;

const cliTestDir = join(testFilesDir, 'cli-test');
export const cliTestFiles = {
    mainFile: join(cliTestDir, 'main-files', 'main-file.less'),
    mainFileExpected: join(cliTestDir, 'main-files', 'expected-main-file.less'),
};
