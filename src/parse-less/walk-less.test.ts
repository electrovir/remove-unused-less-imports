import {getObjectTypedKeys} from 'augment-vir';
import {readFile} from 'fs/promises';
import {NodeType, render, tree} from 'less';
import {getNodeType, nodeToString} from '../augments/node';
import {incrementProps} from '../augments/object';
import {parseTestFiles} from '../test/test-file-paths';
import {parseLessFile} from './parse';
import {walkLess} from './walk-less';

describe(walkLess.name, () => {
    const allTheThingsKeys: NodeType[] = [
        NodeType.Anonymous,
        NodeType.Combinator,
        NodeType.Comment,
        NodeType.Declaration,
        NodeType.DetachedRuleset,
        NodeType.Element,
        NodeType.Expression,
        NodeType.Extend,
        NodeType.Import,
        NodeType.Keyword,
        NodeType.MixinCall,
        NodeType.MixinDefinition,
        NodeType.NamespaceValue,
        NodeType.Ruleset,
        NodeType.Selector,
        NodeType.Value,
        NodeType.Variable,
        NodeType.VariableCall,
    ];

    const allTheThingsNodeCounts: Partial<Readonly<Record<NodeType, number>>> = {
        [NodeType.Anonymous]: 8,
        [NodeType.Combinator]: 10,
        [NodeType.Comment]: 1,
        [NodeType.Declaration]: 14,
        [NodeType.DetachedRuleset]: 2,
        [NodeType.Element]: 10,
        [NodeType.Expression]: 4,
        [NodeType.Extend]: 1,
        [NodeType.Import]: 1,
        [NodeType.Keyword]: 11,
        [NodeType.MixinCall]: 3,
        [NodeType.MixinDefinition]: 2,
        // usage of a namespace: can be imported
        [NodeType.NamespaceValue]: 3,
        [NodeType.Ruleset]: 6,
        [NodeType.Selector]: 9,
        // includes used imports but also every other value
        [NodeType.Value]: 4,
        [NodeType.Variable]: 1,
        [NodeType.VariableCall]: 3,
    };

    const countsWithExtraImportableItems = incrementProps(allTheThingsNodeCounts, {
        Combinator: 5,
        Declaration: 4,
        Element: 5,
        Expression: 4,
        Extend: 1,
        Keyword: 4,
        MixinCall: 3,
        NamespaceValue: 3,
        Selector: 4,
        Value: 4,
        Variable: 1,
        VariableCall: 3,
    });

    const countsWithExtraNonImportableItems = incrementProps(allTheThingsNodeCounts, {
        Anonymous: 11,
        Combinator: 7,
        Comment: 1,
        Declaration: 13,
        DetachedRuleset: 2,
        Import: 1,
        Element: 7,
        Keyword: 10,
        MixinDefinition: 2,
        Ruleset: 6,
        Selector: 6,
    });

    async function getNodesFromFile(filePath: string): Promise<Map<NodeType, tree.Node[]>> {
        const parseResult = await parseLessFile(filePath);

        const nodes = new Map<NodeType, tree.Node[]>();

        walkLess(parseResult.root, (node) => {
            const nodeType: NodeType = getNodeType(node);

            let typeArray = nodes.get(nodeType);

            if (!typeArray) {
                typeArray = [];
                nodes.set(nodeType, typeArray);
            }

            typeArray.push(node);
        });

        return nodes;
    }

    async function testNodes(filePath: string, expectedNodeCounts: Record<string, number>) {
        const nodes = await getNodesFromFile(filePath);

        const sortedNodeKeys = Array.from(nodes.keys()).sort();
        expect(sortedNodeKeys).toEqual(allTheThingsKeys);
        const nodeCounts = Array.from(nodes.keys())
            .sort()
            .reduce((accum, key) => {
                accum[key as NodeType] = nodes.get(key)?.length ?? 0;
                return accum;
            }, {} as Record<NodeType, number>);

        expect(nodeCounts).toEqual(expectedNodeCounts);
    }

    it('should find all the nodes', async () => {
        await testNodes(parseTestFiles.allTheThings, allTheThingsNodeCounts);
    });

    it('should find extra importable nodes', async () => {
        await testNodes(
            parseTestFiles.allTheThingsWithExtraImportableThings,
            countsWithExtraImportableItems,
        );
    });

    it('should find extra non-importable nodes', async () => {
        await testNodes(
            parseTestFiles.allTheThingsWithExtraNonImportableThings,
            countsWithExtraNonImportableItems,
        );
    });

    const maybeImportableNodeTypes: NodeType[] = [
        NodeType.Expression,
        NodeType.Extend,
        NodeType.MixinCall,
        NodeType.NamespaceValue,
        NodeType.Value,
        NodeType.Variable,
        NodeType.VariableCall,
    ];

    it('should show us the important node types', () => {
        function getIncrementedKeys(inputObject: Readonly<Partial<Record<NodeType, number>>>) {
            return getObjectTypedKeys(inputObject).filter((key) => {
                const nonImportableCount = inputObject[key];
                const originalCount = allTheThingsNodeCounts[key];
                return nonImportableCount !== originalCount;
            });
        }

        const nonImportableIncrementedKeys = getIncrementedKeys(countsWithExtraNonImportableItems);
        const importableIncrementedKeys = getIncrementedKeys(countsWithExtraImportableItems);

        const onlyImportantNodeTypes = importableIncrementedKeys.filter((maybeImportantKey) => {
            return !nonImportableIncrementedKeys.includes(maybeImportantKey);
        });

        expect(onlyImportantNodeTypes).toEqual(maybeImportableNodeTypes);
    });

    it('should grant readable lines for maybe importable node types', async () => {
        const nodes = await getNodesFromFile(parseTestFiles.allTheThingsWithExtraImportableThings);

        const nodeLines = maybeImportableNodeTypes.reduce((accum, nodeKey) => {
            const nodesArray = nodes.get(nodeKey);
            accum[nodeKey as NodeType] = nodesArray?.map((node) => {
                const nodeString = nodeToString(node);
                return nodeString;
            }) ?? [
                'NODES UNDEFINED',
            ];
            return accum;
        }, {} as Record<NodeType, string[]>);

        const expectedReadableLines: Readonly<Partial<Record<NodeType, string[]>>> = {
            [NodeType.Expression]: [
                'Variable: @var-definition',
                'Variable: @var-definition',
                'VariableCall: @map-definition',
                'VariableCall: @map-definition',
                'VariableCall: @map-definition',
                'VariableCall: @map-definition',
                'VariableCall: @map-definition',
                'VariableCall: @map-definition',
            ],
            [NodeType.Extend]: [
                'Element: .mixin-old-syntax',
                'Element: .mixin-old-syntax',
            ],
            [NodeType.MixinCall]: [
                'Element: .mixin-new-syntax',
                'Element: .mixin-new-syntax',
                'Element: .mixin-old-syntax',
                'Element: .mixin-old-syntax',
                'Element: #namespace-definition Element: .innerProperty',
                'Element: #namespace-definition Element: .innerProperty',
            ],
            [NodeType.NamespaceValue]: [
                'VariableCall: @map-definition',
                'VariableCall: @map-definition',
                'VariableCall: @map-definition',
                'VariableCall: @map-definition',
                'VariableCall: @map-definition',
                'VariableCall: @map-definition',
            ],
            [NodeType.Value]: [
                'Variable: @var-definition',
                'Variable: @var-definition',
                'VariableCall: @map-definition',
                'VariableCall: @map-definition',
                'VariableCall: @map-definition',
                'VariableCall: @map-definition',
                'VariableCall: @map-definition',
                'VariableCall: @map-definition',
            ],
            [NodeType.Variable]: [
                'Variable: @var-definition',
                'Variable: @var-definition',
            ],
            [NodeType.VariableCall]: [
                'VariableCall: @map-definition',
                'VariableCall: @map-definition',
                'VariableCall: @map-definition',
                'VariableCall: @map-definition',
                'VariableCall: @map-definition',
                'VariableCall: @map-definition',
            ],
        };

        expect(nodeLines).toEqual(expectedReadableLines);
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
  text-align: center;
  border-color: yellow;
  color: green;
  background-color: green;
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
