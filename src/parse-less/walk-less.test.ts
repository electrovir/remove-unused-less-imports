import {readFile} from 'fs/promises';
import {render, tree} from 'less';
import {parseTestFiles} from '../test/test-file-paths';
import {parseLessFile} from './parse';
import {walkLess} from './walk-less';

describe(walkLess.name, () => {
    it('should find all the nodes', async () => {
        const allTheThingsResult = await parseLessFile(parseTestFiles.allTheThings);

        const nodes = new Map<any, tree.Node[]>();

        walkLess(allTheThingsResult.root, (node) => {
            const nodeType = node.type ?? node.constructor.name;

            let typeArray = nodes.get(nodeType);

            if (!typeArray) {
                typeArray = [];
                nodes.set(nodeType, typeArray);
            }

            typeArray.push(node);
        });

        const expectedKeys: string[] = [
            'Anonymous',
            'Combinator',
            'Comment',
            'Declaration',
            'DetachedRuleset',
            'Element',
            'Expression',
            'Extend',
            'Import',
            'Keyword',
            'MixinCall',
            'MixinDefinition',
            'NamespaceValue',
            'Ruleset',
            'Selector',
            'Value',
            'Variable',
            'VariableCall',
        ]
            // these strings are technically already sorted... just calling sort again be sure.
            .sort();

        expect(Array.from(nodes.keys()).sort()).toEqual(expectedKeys);

        const expectedCounts: Record<string, number> = {
            Anonymous: 7,
            Combinator: 10,
            Comment: 1,
            Declaration: 12,
            DetachedRuleset: 2,
            Element: 10,
            Expression: 3,
            Extend: 1,
            Import: 1,
            Keyword: 9,
            MixinCall: 3,
            MixinDefinition: 2,
            NamespaceValue: 2,
            Ruleset: 6,
            Selector: 9,
            Value: 3,
            Variable: 1,
            VariableCall: 2,
        };

        const actualCounts = Array.from(nodes.keys())
            .sort()
            .reduce((accum, key) => {
                accum[key] = nodes.get(key)?.length;
                return accum;
            }, {});

        expect(actualCounts).toEqual(expectedCounts);
    });
});

describe(render.name, () => {
    it('should render the all the things test file', async () => {
        const fileContents: string = (await readFile(parseTestFiles.allTheThings)).toString();
        const outputCss = (await render(fileContents, {filename: parseTestFiles.allTheThings})).css;

        expect(outputCss).toBeTruthy();

        try {
            expect(outputCss).toEqual(
                `.mixin-old-syntax,
body {
  color: purple;
}
body {
  color: red;
  color: blue;
  color: purple;
  color: green;
  color: violet;
}
`,
            );
        } catch (error) {
            console.error(outputCss);
            throw error;
        }
    });
});
