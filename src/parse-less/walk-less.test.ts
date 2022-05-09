import {getObjectTypedKeys, Writeable} from 'augment-vir';
import {readFile} from 'fs/promises';
import {NodeType, render, tree} from 'less';
import {allNodeTypes, getNodeType, nodeToString} from '../augments/node';
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

        const nodeLines: NodeLines = nodeTypeFilterList.reduce((accum, nodeKey) => {
            const nodesArray = nodes.get(nodeKey);
            if (nodesArray) {
                accum[nodeKey as NodeType] = nodesArray?.map((node) => {
                    const nodeString = nodeToString(node);
                    return nodeString;
                });
            }
            return accum;
        }, {} as Writeable<NodeLines>);

        expect(nodeLines).toEqual(expectedNodeLines);
    }

    type NodeLines = Readonly<Partial<Record<NodeType, string[]>>>;

    it('should grant readable lines for maybe importable node types', async () => {
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

    it('should grant readable lines for maybe exportable node types', async () => {
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
            [NodeType.Ruleset]: [
                'Ruleset.rules: -> Array[0] -> Import.path: -> Quoted.value: ./simple-file Array[1] -> Import.path: -> Quoted.value: ./simple-file Array[2] -> Declaration.name: @var-definition Array[3] -> Declaration.name: @detached-rules-definition Array[4] -> Declaration.name: @map-definition Array[5] -> MixinDefinition.rules: -> Array[0] -> Declaration.name: -> Array[0] -> Keyword.value: color Array[6] -> Comment.value: // just a class, but also can be used as a mixin Array[7] -> Ruleset.rules: -> Array[0] -> Declaration.name: -> Array[0] -> Keyword.value: color Array[8] -> MixinDefinition.rules: -> Array[0] -> Ruleset.rules: -> Array[0] -> Declaration.name: -> Array[0] -> Keyword.value: color Array[9] -> Declaration.name: @var-definition2 Array[10] -> Declaration.name: @detached-rules-definition2 Array[11] -> Declaration.name: @map-definition2 Array[12] -> MixinDefinition.rules: -> Array[0] -> Declaration.name: -> Array[0] -> Keyword.value: color Array[13] -> Comment.value: // just a class, but also can be used as a mixin Array[14] -> Ruleset.rules: -> Array[0] -> Declaration.name: -> Array[0] -> Keyword.value: color Array[15] -> MixinDefinition.rules: -> Array[0] -> Ruleset.rules: -> Array[0] -> Declaration.name: -> Array[0] -> Keyword.value: color Array[16] -> Ruleset.rules: -> Array[0] -> Declaration.name: -> Array[0] -> Keyword.value: color Array[1] -> Ruleset.rules: -> Array[0] -> Declaration.name: -> Array[0] -> Keyword.value: background-color Array[17] -> Ruleset.rules: -> Array[0] -> Declaration.name: -> Array[0] -> Keyword.value: color Array[1] -> Declaration.name: -> Array[0] -> Keyword.value: color Array[2] -> MixinCall.selector: -> Selector.elements: -> Array[0] -> Element.value: .mixin-new-syntax Array[3] -> MixinCall.selector: -> Selector.elements: -> Array[0] -> Element.value: .mixin-old-syntax Array[4] -> Extend.selector: -> Selector.elements: -> Array[0] -> Element.value: .mixin-old-syntax Array[5] -> Declaration.name: -> Array[0] -> Keyword.value: text-align Array[6] -> Declaration.name: -> Array[0] -> Keyword.value: text-align Array[7] -> Declaration.name: -> Array[0] -> Keyword.value: border-color Array[8] -> Declaration.name: -> Array[0] -> Keyword.value: color Array[9] -> Declaration.name: -> Array[0] -> Keyword.value: background-color Array[10] -> MixinCall.selector: -> Selector.elements: -> Array[0] -> Element.value: #namespace-definition Array[1] -> Element.value: .innerProperty',
                'Ruleset.rules: -> Array[0] -> Declaration.name: -> Array[0] -> Keyword.value: color',
                'Ruleset.rules: -> Array[0] -> Declaration.name: -> Array[0] -> Keyword.value: one Array[1] -> Declaration.name: -> Array[0] -> Keyword.value: two',
                'Ruleset.rules: -> Array[0] -> Declaration.name: -> Array[0] -> Keyword.value: color',
                'Ruleset.rules: -> Array[0] -> Declaration.name: -> Array[0] -> Keyword.value: color',
                'Ruleset.rules: -> Array[0] -> Declaration.name: -> Array[0] -> Keyword.value: color',
                'Ruleset.rules: -> Array[0] -> Declaration.name: -> Array[0] -> Keyword.value: one Array[1] -> Declaration.name: -> Array[0] -> Keyword.value: two',
                'Ruleset.rules: -> Array[0] -> Declaration.name: -> Array[0] -> Keyword.value: color',
                'Ruleset.rules: -> Array[0] -> Declaration.name: -> Array[0] -> Keyword.value: color',
                'Ruleset.rules: -> Array[0] -> Declaration.name: -> Array[0] -> Keyword.value: color Array[1] -> Ruleset.rules: -> Array[0] -> Declaration.name: -> Array[0] -> Keyword.value: background-color',
                'Ruleset.rules: -> Array[0] -> Declaration.name: -> Array[0] -> Keyword.value: background-color',
                'Ruleset.rules: -> Array[0] -> Declaration.name: -> Array[0] -> Keyword.value: color Array[1] -> Declaration.name: -> Array[0] -> Keyword.value: color Array[2] -> MixinCall.selector: -> Selector.elements: -> Array[0] -> Element.value: .mixin-new-syntax Array[3] -> MixinCall.selector: -> Selector.elements: -> Array[0] -> Element.value: .mixin-old-syntax Array[4] -> Extend.selector: -> Selector.elements: -> Array[0] -> Element.value: .mixin-old-syntax Array[5] -> Declaration.name: -> Array[0] -> Keyword.value: text-align Array[6] -> Declaration.name: -> Array[0] -> Keyword.value: text-align Array[7] -> Declaration.name: -> Array[0] -> Keyword.value: border-color Array[8] -> Declaration.name: -> Array[0] -> Keyword.value: color Array[9] -> Declaration.name: -> Array[0] -> Keyword.value: background-color Array[10] -> MixinCall.selector: -> Selector.elements: -> Array[0] -> Element.value: #namespace-definition Array[1] -> Element.value: .innerProperty',
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
            [NodeType.Ruleset]: [
                'Ruleset.rules: -> Array[0] -> Declaration.name: @myVar',
            ],
        };

        await testNodeLines(parseTestFiles.simpleFile, simpleFileLines);
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
