import {readFileSync} from 'fs';
import {ImportManager, Options, parse, tree} from 'less';

export type ParseResult = {
    root: tree.Ruleset;
    imports: ImportManager;
    options: Options;
};

/**
 * Super simple wrapper function for less.js parsing.
 *
 * @param input String of LESS to parse
 * @param options Options for the parser. Find the type definition to see available options.
 * @returns Promise with the relevant data from the parse
 */
export async function parseLess(input: string, options?: Options): Promise<ParseResult> {
    return new Promise<ParseResult>((resolve, reject) => {
        parse(input, options, (error, root, imports, options) => {
            if (error) {
                reject(error);
            }

            resolve({root, imports, options});
        });
    });
}

/**
 * Super simple wrapper function for less.js parsing that reads the given file path and parses it as less.
 *
 * @param filePath Path to file to parse
 * @param options Options for the parser. Find the type definition to see available options.
 * @returns Promise with the relevant data from the parse
 */
export async function parseLessFile(filePath: string, options: Options = {}) {
    const contents = readFileSync(filePath).toString();

    if (!options.filename) {
        options.filename = filePath;
    }

    return await parseLess(contents, options);
}
