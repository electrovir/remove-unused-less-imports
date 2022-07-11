import {tree} from 'less';
import {parseLess, parseLessFile} from '../parse-less/parse';
import {parseTestFiles} from '../test/test-file-paths';
import {Assumption, testAssumptions} from './assumption-test-helpers';
import {getExportableNodeNames} from './extract-all-exportable';

describe(getExportableNodeNames.name, () => {
    function expectNodeNames(context: tree.Node, expected: string[]) {
        const actualNodeNames = getExportableNodeNames(context);
        expect(Array.from(actualNodeNames).sort()).toEqual(expected);
    }

    async function testExportableNodeNamesFromFile(
        filePath: string,
        expectedNodeNames: string[],
    ): Promise<void> {
        expectNodeNames((await parseLessFile(filePath)).root, expectedNodeNames);
    }

    async function testExportableNodeNamesFromCode(code: string, expectedNodeNames: string[]) {
        expectNodeNames((await parseLess(code)).root, expectedNodeNames);
    }

    it('should extract all exportable items', async () => {
        await testExportableNodeNamesFromFile(
            parseTestFiles.allTheThings,
            [
                '@var-definition',
                '@detached-rules-definition',
                '@map-definition',
                '.mixin-new-syntax',
                '.mixin-old-syntax',
                '.mixin-another',
                '#namespace-definition',
            ].sort(),
        );
    });

    it('should extract all exports with multiple selectors', async () => {
        await testExportableNodeNamesFromCode(
            `#id-name, .class-name {color: blue;}`,
            [
                '#id-name',
                '.class-name',
            ].sort(),
        );
    });

    describe('assumptions', () => {
        it('should be correct assumptions', async () => {
            const assumptions: Assumption[] = [
                {
                    code: `@my-var: blue;`,
                    nodeConstructor: tree.Declaration,
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
                    code: `#id-name, .class-name {color: blue;}`,
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
                                        "value": "#id-name",
                                        "isVariable": false,
                                        "_index": 0
                                    }
                                }
                            },
                            "1": {
                                "type": "Selector",
                                "evaldCondition": true,
                                "_index": 10,
                                "elements": {
                                    "0": {
                                        "type": "Element",
                                        "combinator": {"type": "Combinator", "value": " ", "emptyOrWhitespace": true},
                                        "value": ".class-name",
                                        "isVariable": false,
                                        "_index": 10
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
                                    "_index": 30,
                                    "rulesetLike": false,
                                    "allowRoot": true
                                },
                                "important": "",
                                "merge": false,
                                "_index": 23,
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
                    code: `#id-name .class-name {color: blue;}`,
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
                                        "value": "#id-name",
                                        "isVariable": false,
                                        "_index": 0
                                    },
                                    "1": {
                                        "type": "Element",
                                        "combinator": {"type": "Combinator", "value": " ", "emptyOrWhitespace": true},
                                        "value": ".class-name",
                                        "isVariable": false,
                                        "_index": 9
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
                                    "_index": 29,
                                    "rulesetLike": false,
                                    "allowRoot": true
                                },
                                "important": "",
                                "merge": false,
                                "_index": 22,
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
                    code: ``,
                    nodeConstructor: undefined,
                    serialized: '',
                },
                {
                    code: `.new-style-mixin-definition() {color: blue;}`,
                    nodeConstructor: tree.mixin.Definition,
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

            await testAssumptions(assumptions);
        });
    });
});
