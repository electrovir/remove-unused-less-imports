import {awaitedForEach} from 'augment-vir';
import {NodeType, tree} from 'less';
import {getNodeType} from '../augments/node';
import {Constructor} from '../augments/type';
import {getAllExportableNodes} from './extract-all-exportable';
import {parseLess} from './parse';
import {walkLess} from './walk-less';

describe(getAllExportableNodes.name, () => {
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

    it('should be able to make assumptions', async () => {
        type Assumption = {
            code: string;
            nodeConstructor: Constructor<tree.Node> | undefined;
            matchObject: Record<string, any>;
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
            },
            {
                code: ``,
                nodeConstructor: undefined,
                matchObject: {},
            },
            {
                code: `.new-style-mixin-definition() {color: blue;}`,
                nodeConstructor: tree.Node,
                matchObject: {
                    type: NodeType.MixinDefinition,
                },
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
            },
            {
                code: `#namespace-definition() {.innerProperty {color: violet;}}`,
                nodeConstructor: tree.mixin.Definition,
                matchObject: {
                    name: '#namespace-definition',
                    type: NodeType.MixinDefinition,
                },
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
            },
        ];

        expect.assertions(assumptions.length);

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
                } else {
                    expect(foundNode).toBeUndefined();
                }
            } catch (error) {
                const nodeType = foundNode == undefined ? undefined : getNodeType(foundNode);
                console.error(`Failed on node of type "${nodeType}"`);
                throw error;
            }
        });
    });
});
