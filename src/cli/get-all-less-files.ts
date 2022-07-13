import {isTruthy} from 'augment-vir';
import {runShellCommand} from 'augment-vir/dist/cjs/node-only';
import {join} from 'path';

export async function getAllLessFiles(startDir: string): Promise<string[]> {
    const shellResults = await runShellCommand(`find . -type f -name "*.less"`, {cwd: startDir});
    const files = shellResults.stdout
        .split('\n')
        .filter(isTruthy)
        .map((relativePath) => join(startDir, relativePath))
        .sort();

    return files;
}
