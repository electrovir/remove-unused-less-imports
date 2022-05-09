import {join} from 'path';
import {repoDir} from '../file-paths';

const testFilesDir = join(repoDir, 'test-files');
export const directoryTestsDir = join(testFilesDir, 'directory-tests');
const parseTestingDir = join(testFilesDir, 'parse-testing');

export const parseTestFiles = {
    simpleFile: join(parseTestingDir, 'simple-file.less'),
    allTheThings: join(parseTestingDir, 'all-the-things.less'),
    allTheThingsWithExtraNonImportableThings: join(
        parseTestingDir,
        'all-the-things-with-extra-non-importable-things.less',
    ),
    allTheThingsWithExtraImportableThings: join(
        parseTestingDir,
        'all-the-things-with-extra-importable-things.less',
    ),
} as const;
