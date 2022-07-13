import {interpolationSafeWindowsPath, runShellCommand} from 'augment-vir/dist/cjs/node-only';
import {readFile, writeFile} from 'fs/promises';
import {cliTestFiles} from '../test/test-file-paths';

describe('cli', () => {
    it('should remove unused imports', async () => {
        const beforeMainFile = (await readFile(cliTestFiles.mainFile)).toString();
        const beforeMainFileExpected = (await readFile(cliTestFiles.mainFileExpected)).toString();

        expect(beforeMainFile).not.toBe(beforeMainFileExpected);

        const command = './dist/cli/cli.js "test-files/cli-test" "test-files/cli-test/importable"';

        const result = await runShellCommand(interpolationSafeWindowsPath(command));

        const afterMainFile = (await readFile(cliTestFiles.mainFile)).toString();
        const afterMainFileExpected = (await readFile(cliTestFiles.mainFileExpected)).toString();

        expect(afterMainFile).toBe(afterMainFileExpected);
        expect(afterMainFileExpected).toBe(beforeMainFileExpected);

        // revert test file back
        await writeFile(cliTestFiles.mainFile, beforeMainFile);

        const afterRevertMainFile = (await readFile(cliTestFiles.mainFile)).toString();
        const afterRevertMainFileExpected = (
            await readFile(cliTestFiles.mainFileExpected)
        ).toString();

        expect(afterRevertMainFile).toBe(beforeMainFile);
        expect(afterMainFileExpected).toBe(afterRevertMainFileExpected);
        expect(beforeMainFileExpected).toBe(afterRevertMainFileExpected);
    });
});
