import {getObjectTypedKeys, Writeable} from 'augment-vir';
import {readFile} from 'fs/promises';
import {NodeType, render, tree} from 'less';
import {allNodeTypes, getNodeType, nodeToLineString} from '../augments/node';
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
        [NodeType.Anonymous]: 10,
        [NodeType.Combinator]: 12,
        [NodeType.Comment]: 1,
        [NodeType.Declaration]: 17,
        [NodeType.DetachedRuleset]: 2,
        [NodeType.Element]: 12,
        [NodeType.Expression]: 5,
        [NodeType.Extend]: 1,
        [NodeType.Import]: 1,
        [NodeType.Keyword]: 14,
        [NodeType.MixinCall]: 3,
        [NodeType.MixinDefinition]: 3,
        // usage of a namespace: can be imported
        [NodeType.NamespaceValue]: 3,
        [NodeType.Ruleset]: 7,
        [NodeType.Selector]: 11,
        // includes used imports but also every other value
        [NodeType.Value]: 5,
        [NodeType.Variable]: 2,
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

    const countsWithExtraExportableItems = incrementProps(allTheThingsNodeCounts, {
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

    it('should find extra exportable nodes', async () => {
        await testNodes(
            parseTestFiles.allTheThingsWithExtraExportableThings,
            countsWithExtraExportableItems,
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

    const maybeExportableNodeTypes: NodeType[] = [
        NodeType.Anonymous,
        NodeType.Comment,
        NodeType.DetachedRuleset,
        NodeType.Import,
        NodeType.MixinDefinition,
        NodeType.Ruleset,
    ];

    function getIncrementedKeys(inputObject: Readonly<Partial<Record<NodeType, number>>>) {
        return getObjectTypedKeys(inputObject).filter((key) => {
            const exportableCount = inputObject[key];
            const originalCount = allTheThingsNodeCounts[key];
            return exportableCount !== originalCount;
        });
    }
    const exportableIncrementedKeys = getIncrementedKeys(countsWithExtraExportableItems);
    const importableIncrementedKeys = getIncrementedKeys(countsWithExtraImportableItems);

    it('should show us the importable node types', () => {
        const onlyImportableNodeTypes = importableIncrementedKeys.filter((maybeImportantKey) => {
            return !exportableIncrementedKeys.includes(maybeImportantKey);
        });

        expect(onlyImportableNodeTypes).toEqual(maybeImportableNodeTypes);
    });

    it('should show us the exportable node types', () => {
        const onlyExportableNodeTypes = exportableIncrementedKeys.filter((maybeImportantKey) => {
            return !importableIncrementedKeys.includes(maybeImportantKey);
        });

        expect(onlyExportableNodeTypes).toEqual(maybeExportableNodeTypes);
    });

    async function testNodeLines(
        filePath: string,
        expectedNodeLines: NodeLines,
        nodeTypeFilterList: Readonly<NodeType[]> = allNodeTypes,
    ): Promise<void> {
        const nodes = await getNodesFromFile(filePath);

        const nodeLines: NodeLines = nodeTypeFilterList
            .filter((nodeType) => nodeType !== NodeType.Ruleset)
            .reduce((accum, nodeKey) => {
                const nodesArray = nodes.get(nodeKey);
                if (nodesArray) {
                    accum[nodeKey as NodeType] = nodesArray?.map((node) => {
                        const nodeString = nodeToLineString(node);
                        return nodeString;
                    });
                }
                return accum;
            }, {} as Writeable<NodeLines>);

        expect(nodeLines).toEqual(expectedNodeLines);
    }

    type NodeLines = Readonly<Partial<Record<NodeType, string[]>>>;

    /**
     * Exclude because this test is now covered by other tests and updating this test sucks, but I
     * still like this data.
     */
    xit('should grant readable lines for maybe importable node types', async () => {
        /*
            From the following data we discover the following for importable things:
            
            Can be ignored:
                Expression: these are covered by the Variable and VariableCall types
                NamespaceValue: these are covered by VariableCall
                Value: these are covered by the Variable and VariableCall types
            
            Should be considered:
                Potentially importable:
                    Extend: these are potentially importable
                Always importable:
                    MixinCall: these are all always importable
                    Variable: these are always importable
                    VariableCall: these are always importable
        */

        const expectedReadableLines: NodeLines = {
            [NodeType.Expression]: [
                'Expression.value: -> Array[0] -> Variable.name: @var-definition',
                'Expression.value: -> Array[0] -> Variable.name: @var-definition',
                'Expression.value: -> Array[0] -> NamespaceValue.value: -> VariableCall.variable: @map-definition NamespaceValue.lookups.0: one',
                'Expression.value: -> Array[0] -> NamespaceValue.value: -> VariableCall.variable: @map-definition NamespaceValue.lookups.0: one',
                'Expression.value: -> Array[0] -> NamespaceValue.value: -> VariableCall.variable: @map-definition NamespaceValue.lookups.0: two',
                'Expression.value: -> Array[0] -> NamespaceValue.value: -> VariableCall.variable: @map-definition NamespaceValue.lookups.0: two',
                'Expression.value: -> Array[0] -> NamespaceValue.value: -> VariableCall.variable: @map-definition NamespaceValue.lookups.0: two',
                'Expression.value: -> Array[0] -> NamespaceValue.value: -> VariableCall.variable: @map-definition NamespaceValue.lookups.0: two',
            ],
            [NodeType.Extend]: [
                'Extend.selector: -> Selector.elements: -> Array[0] -> Element.value: .mixin-old-syntax',
                'Extend.selector: -> Selector.elements: -> Array[0] -> Element.value: .mixin-old-syntax',
            ],
            [NodeType.MixinCall]: [
                'MixinCall.selector: -> Selector.elements: -> Array[0] -> Element.value: .mixin-new-syntax',
                'MixinCall.selector: -> Selector.elements: -> Array[0] -> Element.value: .mixin-new-syntax',
                'MixinCall.selector: -> Selector.elements: -> Array[0] -> Element.value: .mixin-old-syntax',
                'MixinCall.selector: -> Selector.elements: -> Array[0] -> Element.value: .mixin-old-syntax',
                'MixinCall.selector: -> Selector.elements: -> Array[0] -> Element.value: #namespace-definition Array[1] -> Element.value: .innerProperty',
                'MixinCall.selector: -> Selector.elements: -> Array[0] -> Element.value: #namespace-definition Array[1] -> Element.value: .innerProperty',
            ],
            [NodeType.NamespaceValue]: [
                'NamespaceValue.value: -> VariableCall.variable: @map-definition NamespaceValue.lookups.0: one',
                'NamespaceValue.value: -> VariableCall.variable: @map-definition NamespaceValue.lookups.0: one',
                'NamespaceValue.value: -> VariableCall.variable: @map-definition NamespaceValue.lookups.0: two',
                'NamespaceValue.value: -> VariableCall.variable: @map-definition NamespaceValue.lookups.0: two',
                'NamespaceValue.value: -> VariableCall.variable: @map-definition NamespaceValue.lookups.0: two',
                'NamespaceValue.value: -> VariableCall.variable: @map-definition NamespaceValue.lookups.0: two',
            ],
            [NodeType.Value]: [
                'Value.value: -> Array[0] -> Expression.value: -> Array[0] -> Variable.name: @var-definition',
                'Value.value: -> Array[0] -> Expression.value: -> Array[0] -> Variable.name: @var-definition',
                'Value.value: -> Array[0] -> Expression.value: -> Array[0] -> NamespaceValue.value: -> VariableCall.variable: @map-definition NamespaceValue.lookups.0: one',
                'Value.value: -> Array[0] -> Expression.value: -> Array[0] -> NamespaceValue.value: -> VariableCall.variable: @map-definition NamespaceValue.lookups.0: one',
                'Value.value: -> Array[0] -> Expression.value: -> Array[0] -> NamespaceValue.value: -> VariableCall.variable: @map-definition NamespaceValue.lookups.0: two',
                'Value.value: -> Array[0] -> Expression.value: -> Array[0] -> NamespaceValue.value: -> VariableCall.variable: @map-definition NamespaceValue.lookups.0: two',
                'Value.value: -> Array[0] -> Expression.value: -> Array[0] -> NamespaceValue.value: -> VariableCall.variable: @map-definition NamespaceValue.lookups.0: two',
                'Value.value: -> Array[0] -> Expression.value: -> Array[0] -> NamespaceValue.value: -> VariableCall.variable: @map-definition NamespaceValue.lookups.0: two',
            ],
            [NodeType.Variable]: [
                'Variable.name: @var-definition',
                'Variable.name: @var-definition',
            ],
            [NodeType.VariableCall]: [
                'VariableCall.variable: @map-definition',
                'VariableCall.variable: @map-definition',
                'VariableCall.variable: @map-definition',
                'VariableCall.variable: @map-definition',
                'VariableCall.variable: @map-definition',
                'VariableCall.variable: @map-definition',
            ],
        };
        await testNodeLines(
            parseTestFiles.allTheThingsWithExtraImportableThings,
            expectedReadableLines,
            maybeImportableNodeTypes,
        );
    });

    /**
     * Exclude because this test is now covered by other tests and updating this test sucks, but I
     * still like this data.
     */
    xit('should grant readable lines for maybe exportable node types', async () => {
        const expectedReadableLines: NodeLines = {
            [NodeType.Anonymous]: [
                'Anonymous.value: red',
                'Anonymous.value: orange',
                'Anonymous.value: yellow',
                'Anonymous.value: green',
                'Anonymous.value: blue',
                'Anonymous.value: purple',
                'Anonymous.value: violet',
                'Anonymous.value: red',
                'Anonymous.value: orange',
                'Anonymous.value: yellow',
                'Anonymous.value: green',
                'Anonymous.value: blue',
                'Anonymous.value: purple',
                'Anonymous.value: violet',
                'Anonymous.value: red',
                'Anonymous.value: purple',
                'Anonymous.value: green',
                'Anonymous.value: center',
                'Anonymous.value: center',
            ],
            [NodeType.Comment]: [
                'Comment.value: // just a class, but also can be used as a mixin',
                'Comment.value: // just a class, but also can be used as a mixin',
            ],
            [NodeType.DetachedRuleset]: [
                'DetachedRuleset.ruleset: -> Ruleset.rules: -> Array[0] -> Declaration.name: -> Array[0] -> Keyword.value: color',
                'DetachedRuleset.ruleset: -> Ruleset.rules: -> Array[0] -> Declaration.name: -> Array[0] -> Keyword.value: one Array[1] -> Declaration.name: -> Array[0] -> Keyword.value: two',
                'DetachedRuleset.ruleset: -> Ruleset.rules: -> Array[0] -> Declaration.name: -> Array[0] -> Keyword.value: color',
                'DetachedRuleset.ruleset: -> Ruleset.rules: -> Array[0] -> Declaration.name: -> Array[0] -> Keyword.value: one Array[1] -> Declaration.name: -> Array[0] -> Keyword.value: two',
            ],
            [NodeType.Import]: [
                'Import.path: -> Quoted.value: ./simple-file',
                'Import.path: -> Quoted.value: ./simple-file',
            ],
            [NodeType.MixinDefinition]: [
                'MixinDefinition.rules: -> Array[0] -> Declaration.name: -> Array[0] -> Keyword.value: color',
                'MixinDefinition.rules: -> Array[0] -> Ruleset.rules: -> Array[0] -> Declaration.name: -> Array[0] -> Keyword.value: color',
                'MixinDefinition.rules: -> Array[0] -> Declaration.name: -> Array[0] -> Keyword.value: color',
                'MixinDefinition.rules: -> Array[0] -> Ruleset.rules: -> Array[0] -> Declaration.name: -> Array[0] -> Keyword.value: color',
            ],
        };

        await testNodeLines(
            parseTestFiles.allTheThingsWithExtraExportableThings,
            expectedReadableLines,
            maybeExportableNodeTypes,
        );
    });

    it('should get node line for simple file', async () => {
        const simpleFileLines: NodeLines = {
            [NodeType.Anonymous]: [
                'Anonymous.value: blue',
            ],
            [NodeType.Declaration]: [
                'Declaration.name: @myVar',
            ],
        };

        await testNodeLines(parseTestFiles.simpleFile, simpleFileLines);
    });

    /**
     * Exclude because this test is now covered by other tests and updating this test sucks, but I
     * still like this data.
     */
    xit('should read all node lines for all the things file', async () => {
        const allThingsLines: NodeLines = {
            [NodeType.Anonymous]: [
                'Anonymous.value: red',
                'Anonymous.value: orange',
                'Anonymous.value: yellow',
                'Anonymous.value: green',
                'Anonymous.value: blue',
                'Anonymous.value: purple',
                'Anonymous.value: violet',
                'Anonymous.value: center',
            ],
            [NodeType.Combinator]: [
                'Combinator.value: ',
                'Combinator.value:  ',
                'Combinator.value: ',
                'Combinator.value:  ',
                'Combinator.value:  ',
                'Combinator.value: ',
                'Combinator.value: ',
                'Combinator.value: ',
                'Combinator.value: ',
                'Combinator.value: ',
            ],
            [NodeType.Comment]: [
                'Comment.value: // just a class, but also can be used as a mixin',
            ],
            [NodeType.Declaration]: [
                'Declaration.name: @var-definition',
                'Declaration.name: @detached-rules-definition',
                'Declaration.name: -> Array[0] -> Keyword.value: color',
                'Declaration.name: @map-definition',
                'Declaration.name: -> Array[0] -> Keyword.value: one',
                'Declaration.name: -> Array[0] -> Keyword.value: two',
                'Declaration.name: -> Array[0] -> Keyword.value: color',
                'Declaration.name: -> Array[0] -> Keyword.value: color',
                'Declaration.name: -> Array[0] -> Keyword.value: color',
                'Declaration.name: -> Array[0] -> Keyword.value: color',
                'Declaration.name: -> Array[0] -> Keyword.value: text-align',
                'Declaration.name: -> Array[0] -> Keyword.value: border-color',
                'Declaration.name: -> Array[0] -> Keyword.value: color',
                'Declaration.name: -> Array[0] -> Keyword.value: background-color',
            ],
            [NodeType.DetachedRuleset]: [
                'DetachedRuleset.ruleset: -> Ruleset.rules: -> Array[0] -> Declaration.name: -> Array[0] -> Keyword.value: color',
                'DetachedRuleset.ruleset: -> Ruleset.rules: -> Array[0] -> Declaration.name: -> Array[0] -> Keyword.value: one Array[1] -> Declaration.name: -> Array[0] -> Keyword.value: two',
            ],
            [NodeType.Element]: [
                'Element.value: .mixin-new-syntax',
                'Element.value: .mixin-old-syntax',
                'Element.value: #namespace-definition',
                'Element.value: .innerProperty',
                'Element.value: body',
                'Element.value: .mixin-new-syntax',
                'Element.value: .mixin-old-syntax',
                'Element.value: .mixin-old-syntax',
                'Element.value: #namespace-definition',
                'Element.value: .innerProperty',
            ],
            [NodeType.Expression]: [
                'Expression.value: -> Array[0] -> Variable.name: @var-definition',
                'Expression.value: -> Array[0] -> NamespaceValue.value: -> VariableCall.variable: @map-definition NamespaceValue.lookups.0: one',
                'Expression.value: -> Array[0] -> NamespaceValue.value: -> VariableCall.variable: @map-definition NamespaceValue.lookups.0: two',
                'Expression.value: -> Array[0] -> NamespaceValue.value: -> VariableCall.variable: @map-definition NamespaceValue.lookups.0: two',
            ],
            [NodeType.Extend]: [
                'Extend.selector: -> Selector.elements: -> Array[0] -> Element.value: .mixin-old-syntax',
            ],
            [NodeType.Import]: [
                'Import.path: -> Quoted.value: ./simple-file',
            ],
            [NodeType.Keyword]: [
                'Keyword.value: color',
                'Keyword.value: one',
                'Keyword.value: two',
                'Keyword.value: color',
                'Keyword.value: color',
                'Keyword.value: color',
                'Keyword.value: color',
                'Keyword.value: text-align',
                'Keyword.value: border-color',
                'Keyword.value: color',
                'Keyword.value: background-color',
            ],
            [NodeType.MixinCall]: [
                'MixinCall.selector: -> Selector.elements: -> Array[0] -> Element.value: .mixin-new-syntax',
                'MixinCall.selector: -> Selector.elements: -> Array[0] -> Element.value: .mixin-old-syntax',
                'MixinCall.selector: -> Selector.elements: -> Array[0] -> Element.value: #namespace-definition Array[1] -> Element.value: .innerProperty',
            ],
            [NodeType.MixinDefinition]: [
                'MixinDefinition.rules: -> Array[0] -> Declaration.name: -> Array[0] -> Keyword.value: color',
                'MixinDefinition.rules: -> Array[0] -> Ruleset.rules: -> Array[0] -> Declaration.name: -> Array[0] -> Keyword.value: color',
            ],
            [NodeType.NamespaceValue]: [
                'NamespaceValue.value: -> VariableCall.variable: @map-definition NamespaceValue.lookups.0: one',
                'NamespaceValue.value: -> VariableCall.variable: @map-definition NamespaceValue.lookups.0: two',
                'NamespaceValue.value: -> VariableCall.variable: @map-definition NamespaceValue.lookups.0: two',
            ],
            [NodeType.Selector]: [
                'Selector.elements: -> Array[0] -> Element.value: .mixin-new-syntax',
                'Selector.elements: -> Array[0] -> Element.value: .mixin-old-syntax',
                'Selector.elements: -> Array[0] -> Element.value: #namespace-definition',
                'Selector.elements: -> Array[0] -> Element.value: .innerProperty',
                'Selector.elements: -> Array[0] -> Element.value: body',
                'Selector.elements: -> Array[0] -> Element.value: .mixin-new-syntax',
                'Selector.elements: -> Array[0] -> Element.value: .mixin-old-syntax',
                'Selector.elements: -> Array[0] -> Element.value: .mixin-old-syntax',
                'Selector.elements: -> Array[0] -> Element.value: #namespace-definition Array[1] -> Element.value: .innerProperty',
            ],
            [NodeType.Value]: [
                'Value.value: -> Array[0] -> Expression.value: -> Array[0] -> Variable.name: @var-definition',
                'Value.value: -> Array[0] -> Expression.value: -> Array[0] -> NamespaceValue.value: -> VariableCall.variable: @map-definition NamespaceValue.lookups.0: one',
                'Value.value: -> Array[0] -> Expression.value: -> Array[0] -> NamespaceValue.value: -> VariableCall.variable: @map-definition NamespaceValue.lookups.0: two',
                'Value.value: -> Array[0] -> Expression.value: -> Array[0] -> NamespaceValue.value: -> VariableCall.variable: @map-definition NamespaceValue.lookups.0: two',
            ],
            [NodeType.Variable]: [
                'Variable.name: @var-definition',
            ],
            [NodeType.VariableCall]: [
                'VariableCall.variable: @map-definition',
                'VariableCall.variable: @map-definition',
                'VariableCall.variable: @map-definition',
            ],
        };
        await testNodeLines(parseTestFiles.allTheThings, allThingsLines);
    });
});

describe(render.name, () => {
    it('should render the all the things test file', async () => {
        const fileContents: string = (await readFile(parseTestFiles.allTheThings)).toString();
        const outputCss = (await render(fileContents, {filename: parseTestFiles.allTheThings})).css;

        expect(outputCss).toBeTruthy();

        try {
            expect(outputCss).toEqual(
                `.mixin-old-syntax {
  color: purple;
}
another-selector {
  color: blue;
}
body {
  color: red;
  background-color: blue;
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
