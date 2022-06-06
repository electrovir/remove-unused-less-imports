import {extractErrorMessage} from 'augment-vir';
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
        parse(input, options, (parseError, root, imports, options) => {
            if (parseError) {
                /**
                 * Create a new error because the parse error doesn't have much information in it
                 * (like no stack trace).
                 */
                const errorMessage = extractErrorMessage(parseError);
                const errorToThrow = new Error(errorMessage);
                reject(errorToThrow);
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

    try {
        return await parseLess(contents, options);
    } catch (parseError) {
        const errorToThrow = new Error(
            `Failed to parse less file "${filePath}": ${extractErrorMessage(parseError)}`,
        );
        throw errorToThrow;
    }
}
