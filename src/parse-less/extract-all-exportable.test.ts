import {awaitedForEach} from 'augment-vir';
import {NodeType, tree} from 'less';
import {getNodeType, jsonSerializedNode} from '../augments/node';
import {collapseJsonWhiteSpace} from '../augments/string';
import {Constructor} from '../augments/type';
import {parseTestFiles} from '../test/test-file-paths';
import {getAllExportableNodes, getExportableNodeNames} from './extract-all-exportable';
import {parseLess, parseLessFile} from './parse';
import {walkLess} from './walk-less';

describe(getAllExportableNodes.name, () => {
    async function testExportableNodeNames(
        filePath: string,
        expectedNodeNames: string[],
    ): Promise<void> {
        const exportableNodes = getAllExportableNodes((await parseLessFile(filePath)).root);
        const actualNodeNames = getExportableNodeNames(exportableNodes);
        expect(actualNodeNames.sort()).toEqual(expectedNodeNames);
    }

    it('should extract all exportable items', async () => {
        await testExportableNodeNames(
            parseTestFiles.allTheThings,
            [
                '@var-definition',
                '@detached-rules-definition',
                '@map-definition',
                '.mixin-new-syntax',
                '.mixin-old-syntax',
                '#namespace-definition',
                'body',
            ].sort(),
        );
    });

    describe('assumptions', () => {
        async function getFirstNodeOfType<T extends tree.Node | undefined>(
            codeToParse: string,
            nodeConstructor: T extends undefined ? undefined : Constructor<T>,
        ): Promise<T> {
            let nodeToReturn: T | undefined;

            walkLess((await parseLess(codeToParse)).root, (node) => {
                // bypass the root node
                if (node instanceof tree.Ruleset && node.root) {
                    return false;
                }
                if (nodeConstructor) {
                    if (node instanceof nodeConstructor!) {
                        nodeToReturn = node as T;
                        return true;
                    }
                } else {
                    nodeToReturn = node as any;
                    return true;
                }
                return false;
            });

            if (nodeConstructor && !nodeToReturn) {
                throw new Error(
                    `Did not find node of type "${nodeConstructor.name}" in "${codeToParse}"`,
                );
            }
            if (!nodeConstructor && nodeToReturn) {
                console.error(nodeToReturn);
                throw new Error(
                    `Didn't expect to find any nodes but found "${nodeToReturn.type}" in "${codeToParse}"`,
                );
            }
            return nodeToReturn as T;
        }

        it('should be correct assumptions', async () => {
            type Assumption = {
                code: string;
                nodeConstructor: Constructor<tree.Node> | undefined;
                matchObject: Record<string, any>;
                serialized: string;
                log?: true;
            };

            const assumptions: Assumption[] = [
                {
                    code: `@my-var: blue;`,
                    nodeConstructor: tree.Declaration,
                    matchObject: {
                        name: '@my-var',
                        type: NodeType.Declaration,
                        value: {
                            value: 'blue',
                        },
                        important: '',
                        merge: false,
                        inline: false,
                        variable: true,
                    },
                    serialized: `{
                        "type": "Declaration",
                        "name": "@my-var",
                        "value": {
                            "type": "Anonymous",
                            "value": "blue",
                            "_index": 9,
                            "rulesetLike": false,
                            "allowRoot": true
                        },
                        "important": "",
                        "merge": false,
                        "_index": 0,
                        "inline": false,
                        "variable": true,
                        "allowRoot": true
                    }`,
                },
                {
                    code: ``,
                    nodeConstructor: undefined,
                    matchObject: {},
                    serialized: '',
                },
                {
                    code: `.new-style-mixin-definition() {color: blue;}`,
                    nodeConstructor: tree.mixin.Definition,
                    matchObject: {
                        type: NodeType.MixinDefinition,
                    },
                    serialized: `{
                        "type": "MixinDefinition",
                        "name": ".new-style-mixin-definition",
                        "selectors": {
                            "0": {
                                "type": "Selector",
                                "evaldCondition": true,
                                "elements": {
                                    "0": {
                                        "type": "Element",
                                        "combinator": {"type": "Combinator", "value": "", "emptyOrWhitespace": true},
                                        "value": ".new-style-mixin-definition",
                                        "isVariable": false
                                    }
                                }
                            }
                        },
                        "params": {},
                        "variadic": false,
                        "arity": 0,
                        "rules": {
                            "0": {
                                "type": "Declaration",
                                "name": {"0": {"type": "Keyword", "value": "color"}},
                                "value": {
                                    "type": "Anonymous",
                                    "value": "blue",
                                    "_index": 38,
                                    "rulesetLike": false,
                                    "allowRoot": true
                                },
                                "important": "",
                                "merge": false,
                                "_index": 31,
                                "inline": false,
                                "allowRoot": true
                            }
                        },
                        "_lookups": {},
                        "required": 0,
                        "optionalParameters": {},
                        "allowRoot": true
                    }`,
                },
                {
                    code: `.old-style-mixin-definition {color: blue;}`,
                    nodeConstructor: tree.Ruleset,
                    matchObject: {
                        type: NodeType.Ruleset,
                        selectors: [
                            {
                                elements: [
                                    {
                                        value: '.old-style-mixin-definition',
                                    },
                                ],
                            },
                        ],
                        rules: [
                            {
                                name: [
                                    {
                                        type: NodeType.Keyword,
                                        value: 'color',
                                    },
                                ],
                                value: {
                                    type: NodeType.Anonymous,
                                    value: 'blue',
                                },
                                type: NodeType.Declaration,
                            },
                        ],
                        parent: {
                            root: true,
                            firstRoot: true,
                        },
                    },
                    serialized: `{
                        "type": "Ruleset",
                        "selectors": {
                            "0": {
                                "type": "Selector",
                                "evaldCondition": true,
                                "_index": 0,
                                "elements": {
                                    "0": {
                                        "type": "Element",
                                        "combinator": {"type": "Combinator", "value": "", "emptyOrWhitespace": true},
                                        "value": ".old-style-mixin-definition",
                                        "isVariable": false,
                                        "_index": 0
                                    }
                                }
                            }
                        },
                        "rules": {
                            "0": {
                                "type": "Declaration",
                                "name": {"0": {"type": "Keyword", "value": "color"}},
                                "value": {
                                    "type": "Anonymous",
                                    "value": "blue",
                                    "_index": 36,
                                    "rulesetLike": false,
                                    "allowRoot": true
                                },
                                "important": "",
                                "merge": false,
                                "_index": 29,
                                "inline": false,
                                "allowRoot": true
                            }
                        },
                        "_lookups": {},
                        "_variables": null,
                        "_properties": null,
                        "strictImports": false,
                        "allowRoot": true
                    }`,
                },
                {
                    code: `#namespace-definition() {.innerProperty {color: violet;}}`,
                    nodeConstructor: tree.mixin.Definition,
                    matchObject: {
                        name: '#namespace-definition',
                        type: NodeType.MixinDefinition,
                    },
                    serialized: `{
                        "type": "MixinDefinition",
                        "name": "#namespace-definition",
                        "selectors": {
                            "0": {
                                "type": "Selector",
                                "evaldCondition": true,
                                "elements": {
                                    "0": {
                                        "type": "Element",
                                        "combinator": {"type": "Combinator", "value": "", "emptyOrWhitespace": true},
                                        "value": "#namespace-definition",
                                        "isVariable": false
                                    }
                                }
                            }
                        },
                        "params": {},
                        "variadic": false,
                        "arity": 0,
                        "rules": {
                            "0": {
                                "type": "Ruleset",
                                "selectors": {
                                    "0": {
                                        "type": "Selector",
                                        "evaldCondition": true,
                                        "_index": 25,
                                        "elements": {
                                            "0": {
                                                "type": "Element",
                                                "combinator": {
                                                    "type": "Combinator",
                                                    "value": "",
                                                    "emptyOrWhitespace": true
                                                },
                                                "value": ".innerProperty",
                                                "isVariable": false,
                                                "_index": 25
                                            }
                                        }
                                    }
                                },
                                "rules": {
                                    "0": {
                                        "type": "Declaration",
                                        "name": {"0": {"type": "Keyword", "value": "color"}},
                                        "value": {
                                            "type": "Anonymous",
                                            "value": "violet",
                                            "_index": 48,
                                            "rulesetLike": false,
                                            "allowRoot": true
                                        },
                                        "important": "",
                                        "merge": false,
                                        "_index": 41,
                                        "inline": false,
                                        "allowRoot": true
                                    }
                                },
                                "_lookups": {},
                                "_variables": null,
                                "_properties": null,
                                "strictImports": false,
                                "allowRoot": true
                            }
                        },
                        "_lookups": {},
                        "required": 0,
                        "optionalParameters": {},
                        "allowRoot": true
                    }`,
                },
                {
                    code: `@detached-rules-definition: {color: orange;}`,
                    nodeConstructor: tree.Declaration,
                    matchObject: {
                        name: '@detached-rules-definition',
                        value: {
                            ruleset: {
                                type: NodeType.Ruleset,
                            },
                        },
                        type: NodeType.Declaration,
                        variable: true,
                    },
                    serialized: `{
                        "type": "Declaration",
                        "name": "@detached-rules-definition",
                        "value": {
                            "type": "DetachedRuleset",
                            "ruleset": {
                                "type": "Ruleset",
                                "selectors": null,
                                "rules": {
                                    "0": {
                                        "type": "Declaration",
                                        "name": {"0": {"type": "Keyword", "value": "color"}},
                                        "value": {
                                            "type": "Anonymous",
                                            "value": "orange",
                                            "_index": 36,
                                            "rulesetLike": false,
                                            "allowRoot": true
                                        },
                                        "important": "",
                                        "merge": false,
                                        "_index": 29,
                                        "inline": false,
                                        "allowRoot": true
                                    }
                                },
                                "_lookups": {},
                                "_variables": null,
                                "_properties": null,
                                "allowRoot": true
                            }
                        },
                        "important": "",
                        "_index": 0,
                        "inline": false,
                        "variable": true,
                        "allowRoot": true
                    }`,
                },
                {
                    code: `@map-definition: {one: yellow; two: green;}`,
                    nodeConstructor: tree.Declaration,
                    matchObject: {
                        name: '@map-definition',
                        value: {
                            ruleset: {
                                type: NodeType.Ruleset,
                            },
                        },
                        variable: true,
                    },
                    serialized: `{
                        "type": "Declaration",
                        "name": "@map-definition",
                        "value": {
                            "type": "DetachedRuleset",
                            "ruleset": {
                                "type": "Ruleset",
                                "selectors": null,
                                "rules": {
                                    "0": {
                                        "type": "Declaration",
                                        "name": {"0": {"type": "Keyword", "value": "one"}},
                                        "value": {
                                            "type": "Anonymous",
                                            "value": "yellow",
                                            "_index": 23,
                                            "rulesetLike": false,
                                            "allowRoot": true
                                        },
                                        "important": "",
                                        "merge": false,
                                        "_index": 18,
                                        "inline": false,
                                        "allowRoot": true
                                    },
                                    "1": {
                                        "type": "Declaration",
                                        "name": {"0": {"type": "Keyword", "value": "two"}},
                                        "value": {
                                            "type": "Anonymous",
                                            "value": "green",
                                            "_index": 36,
                                            "rulesetLike": false,
                                            "allowRoot": true
                                        },
                                        "important": "",
                                        "merge": false,
                                        "_index": 31,
                                        "inline": false,
                                        "allowRoot": true
                                    }
                                },
                                "_lookups": {},
                                "_variables": null,
                                "_properties": null,
                                "allowRoot": true
                            }
                        },
                        "important": "",
                        "_index": 0,
                        "inline": false,
                        "variable": true,
                        "allowRoot": true
                    }`,
                },
            ];

            expect.assertions(assumptions.length * 2);

            await awaitedForEach(assumptions, async (assumption) => {
                const foundNode = await getFirstNodeOfType<any>(
                    assumption.code,
                    assumption.nodeConstructor,
                );

                if (assumption.log) {
                    console.info({[foundNode.type]: foundNode});
                }

                try {
                    if (assumption.nodeConstructor) {
                        expect(foundNode).toMatchObject(assumption.matchObject);
                        expect(collapseJsonWhiteSpace(jsonSerializedNode(foundNode, 0))).toBe(
                            collapseJsonWhiteSpace(assumption.serialized),
                        );
                    } else {
                        expect(foundNode).toBeUndefined();
                        expect(assumption.serialized).toBeFalsy();
                    }
                } catch (error) {
                    const nodeType = foundNode == undefined ? undefined : getNodeType(foundNode);
                    console.error(`Failed on node of type "${nodeType}"`);
                    throw error;
                }
            });
        });
    });
});
