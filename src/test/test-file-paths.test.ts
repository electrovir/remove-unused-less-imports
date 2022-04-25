import {getObjectTypedKeys} from 'augment-vir';
import {existsSync} from 'fs';
import {parseTestFiles} from './test-file-paths';

describe(__filename, () => {
    it('should be able to find all test files', async () => {
        getObjectTypedKeys(parseTestFiles).map(async (key) => {
            const filePath = parseTestFiles[key];
            if (!existsSync(filePath)) {
                throw new Error(`File "${filePath}" not found under key "${key}"`);
            }
        });
    });
});
