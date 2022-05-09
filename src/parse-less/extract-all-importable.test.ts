import {tree} from 'less';
import {parseTestFiles} from '../test/test-file-paths';
import {Assumption, testAssumptions} from './assumption-test-helpers';
import {getImportableNodeNames} from './extract-all-importable';
import {parseLessFile} from './parse';

describe(getImportableNodeNames.name, () => {
    async function testImportableNodeNames(
        filePath: string,
        expectedNodeNames: string[],
    ): Promise<void> {
        const actualNodeNames = getImportableNodeNames((await parseLessFile(filePath)).root);
        expect(Array.from(actualNodeNames).sort()).toEqual(expectedNodeNames);
    }

    it('should correctly get all importable names', async () => {
        await testImportableNodeNames(
            parseTestFiles.allTheThings,
            [
                '@var-definition',
                '.mixin-new-syntax',
                '.mixin-old-syntax',
                '.mixin-another',
                '@map-definition',
                '#namespace-definition',
            ].sort(),
        );
    });

    describe('assumptions', () => {
        it('should be correct assumptions', async () => {
            const assumptions: Assumption[] = [
                {
                    code: `body {@var-definition: blue; color: @var-definition;}`,
                    nodeConstructor: tree.Ruleset,
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
                                        "value": "body",
                                        "isVariable": false,
                                        "_index": 0
                                    }
                                }
                            }
                        },
                        "rules": {
                            "0": {
                                "type": "Declaration",
                                "name": "@var-definition",
                                "value": {
                                    "type": "Anonymous",
                                    "value": "blue",
                                    "_index": 23,
                                    "rulesetLike": false,
                                    "allowRoot": true
                                },
                                "important": "",
                                "merge": false,
                                "_index": 6,
                                "inline": false,
                                "variable": true,
                                "allowRoot": true
                            },
                            "1": {
                                "type": "Declaration",
                                "name": {"0": {"type": "Keyword", "value": "color"}},
                                "value": {
                                    "type": "Value",
                                    "value": {
                                        "0": {
                                            "type": "Expression",
                                            "value": {
                                                "0": {"type": "Variable", "name": "@var-definition", "_index": 36}
                                            }
                                        }
                                    }
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
                    code: `body {color: @var-definition;}`,
                    nodeConstructor: tree.Variable,
                    serialized: `{"type": "Variable", "name": "@var-definition", "_index": 13}`,
                },
                {
                    code: `body {.mixin-syntax();}`,
                    nodeConstructor: tree.Ruleset,
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
                                        "value": "body",
                                        "isVariable": false,
                                        "_index": 0
                                    }
                                }
                            }
                        },
                        "rules": {
                            "0": {
                                "type": "MixinCall",
                                "selector": {
                                    "type": "Selector",
                                    "evaldCondition": true,
                                    "elements": {
                                        "0": {
                                            "type": "Element",
                                            "combinator": {
                                                "type": "Combinator",
                                                "value": "",
                                                "emptyOrWhitespace": true
                                            },
                                            "value": ".mixin-syntax",
                                            "isVariable": false,
                                            "_index": 6
                                        }
                                    }
                                },
                                "arguments": {},
                                "_index": 6,
                                "important": false,
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
                    code: `body {.mixin-syntax();}`,
                    nodeConstructor: tree.mixin.Call,
                    serialized: `{
                        "type": "MixinCall",
                        "selector": {
                            "type": "Selector",
                            "evaldCondition": true,
                            "elements": {
                                "0": {
                                    "type": "Element",
                                    "combinator": {"type": "Combinator", "value": "", "emptyOrWhitespace": true},
                                    "value": ".mixin-syntax",
                                    "isVariable": false,
                                    "_index": 6
                                }
                            }
                        },
                        "arguments": {},
                        "_index": 6,
                        "important": false,
                        "allowRoot": true
                    }`,
                },
                {
                    code: `body {background-color: @map-definition[two];}`,
                    nodeConstructor: tree.VariableCall,
                    serialized: `{"type": "VariableCall", "variable": "@map-definition", "_index": 39, "allowRoot": true}`,
                },
                {
                    code: `body {&:extend(.mixin-old-syntax);}`,
                    nodeConstructor: tree.Extend,
                    serialized: `{
                        "type": "Extend",
                        "selector": {
                            "type": "Selector",
                            "evaldCondition": true,
                            "elements": {
                                "0": {
                                    "type": "Element",
                                    "combinator": {"type": "Combinator", "value": "", "emptyOrWhitespace": true},
                                    "value": ".mixin-old-syntax",
                                    "isVariable": false,
                                    "_index": 15
                                }
                            }
                        },
                        "option": null,
                        "object_id": 1,
                        "parent_ids": {"0": 1},
                        "_index": 6,
                        "allowRoot": true,
                        "allowBefore": false,
                        "allowAfter": false
                    }`,
                },
            ];
            await testAssumptions(assumptions);
        });
    });
});
