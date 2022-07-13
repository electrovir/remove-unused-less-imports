import {readFile} from 'fs/promises';
import {join} from 'path';
import {jsonSerializeNode} from '../augments/node';
import {collapseJsonWhiteSpace} from '../augments/string';
import {parseLessFile} from '../parse-less/parse';
import {getDirectoryTests, getFixedFilePath} from '../test/directory-test-helpers';
import {parseTestFiles} from '../test/test-file-paths';
import {getUnusedImports, removeUnusedImports} from './remove-unused-imports';

describe(removeUnusedImports.name, () => {
    it('should pass all directory tests', async () => {
        const directoryTests = await getDirectoryTests();

        await Promise.all(
            directoryTests.map(async (directoryTest) => {
                await Promise.all(
                    directoryTest.brokenFileRelativePaths.map(async (brokenFileRelativePath) => {
                        const brokenFilePath = join(
                            directoryTest.directoryPath,
                            brokenFileRelativePath,
                        );
                        const operatedOnContents = await removeUnusedImports({
                            filePath: brokenFilePath,
                            importPaths: [],
                        });
                        const fixedFilePath = getFixedFilePath(brokenFileRelativePath);
                        const expectedFixedContents = (
                            await readFile(join(directoryTest.directoryPath, fixedFilePath))
                        ).toString();

                        expect(operatedOnContents).toBe(expectedFixedContents);
                    }),
                );
            }),
        );
    });
});

describe(getUnusedImports.name, () => {
    xit('should get all unused imports', async () => {
        const context = (await parseLessFile(parseTestFiles.unusedImports)).root;
        const unusedImports = getUnusedImports(context);

        const serialized = Array.from(unusedImports.values()).map((unusedImport) => {
            return collapseJsonWhiteSpace(jsonSerializeNode(unusedImport));
        });

        debugger;
        expect(serialized).toEqual(
            [
                // simple-file import
                `{
                    "type": "Import",
                    "options": {
                        "reference": true
                    },
                    "_index": 0,
                    "path": {
                        "type": "Quoted",
                        "escaped": false,
                        "value": "./simple-file",
                        "quote": "'",
                        "_index": 20,
                        "variableRegex": {},
                        "propRegex": {},
                        "allowRoot": false
                    },
                    "features": null,
                    "allowRoot": true,
                    "root": {
                        "type": "Ruleset",
                        "selectors": null,
                        "rules": {
                            "0": {
                            "type": "Declaration",
                            "name": "@myVar",
                            "value": {
                                "type": "Anonymous",
                                "value": "blue",
                                "_index": 8,
                                "rulesetLike": false,
                                "allowRoot": true
                            },
                            "important": "",
                            "merge": false,
                            "_index": 0,
                            "inline": false,
                            "variable": true,
                            "allowRoot": true
                            }
                        },
                        "_lookups": {},
                        "_variables": null,
                        "_properties": null,
                        "allowRoot": true,
                        "root": true,
                        "firstRoot": true,
                        "functionRegistry": {
                            "_data": {}
                        }
                    },
                    "importedFilename": "${parseTestFiles.simpleFile}"
                }`,
                // all-the-things import
                `{
                    "type": "Import",
                    "options": {"reference": true},
                    "_index": 37,
                    "path": {
                        "type": "Quoted",
                        "escaped": false,
                        "value": "./all-the-things",
                        "quote": "'",
                        "_index": 57,
                        "variableRegex": {},
                        "propRegex": {},
                        "allowRoot": false
                    },
                    "features": null,
                    "allowRoot": true,
                    "root": {
                        "type": "Ruleset",
                        "selectors": null,
                        "rules": {
                            "0": {
                                "type": "Import",
                                "options": {"reference": true},
                                "_index": 0,
                                "path": {
                                    "type": "Quoted",
                                    "escaped": false,
                                    "value": "./simple-file",
                                    "quote": "'",
                                    "_index": 20,
                                    "variableRegex": {},
                                    "propRegex": {},
                                    "allowRoot": false
                                },
                                "features": null,
                                "allowRoot": true,
                                "skip": true,
                                "root": {
                                    "type": "Ruleset",
                                    "selectors": null,
                                    "rules": {
                                        "0": {
                                            "type": "Declaration",
                                            "name": "@myVar",
                                            "value": {
                                                "type": "Anonymous",
                                                "value": "blue",
                                                "_index": 8,
                                                "rulesetLike": false,
                                                "allowRoot": true
                                            },
                                            "important": "",
                                            "merge": false,
                                            "_index": 0,
                                            "inline": false,
                                            "variable": true,
                                            "allowRoot": true
                                        }
                                    },
                                    "_lookups": {},
                                    "_variables": null,
                                    "_properties": null,
                                    "allowRoot": true,
                                    "root": true,
                                    "firstRoot": true,
                                    "functionRegistry": {"_data": {}}
                                },
                                "importedFilename": "${parseTestFiles.simpleFile}"
                            },
                            "1": {
                                "type": "Declaration",
                                "name": "@var-definition",
                                "value": {
                                    "type": "Anonymous",
                                    "value": "red",
                                    "_index": 55,
                                    "rulesetLike": false,
                                    "allowRoot": true
                                },
                                "important": "",
                                "merge": false,
                                "_index": 38,
                                "inline": false,
                                "variable": true,
                                "allowRoot": true
                            },
                            "2": {
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
                                                    "_index": 101,
                                                    "rulesetLike": false,
                                                    "allowRoot": true
                                                },
                                                "important": "",
                                                "merge": false,
                                                "_index": 94,
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
                                "_index": 60,
                                "inline": false,
                                "variable": true,
                                "allowRoot": true
                            },
                            "3": {
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
                                                    "_index": 140,
                                                    "rulesetLike": false,
                                                    "allowRoot": true
                                                },
                                                "important": "",
                                                "merge": false,
                                                "_index": 135,
                                                "inline": false,
                                                "allowRoot": true
                                            },
                                            "1": {
                                                "type": "Declaration",
                                                "name": {"0": {"type": "Keyword", "value": "two"}},
                                                "value": {
                                                    "type": "Anonymous",
                                                    "value": "green",
                                                    "_index": 157,
                                                    "rulesetLike": false,
                                                    "allowRoot": true
                                                },
                                                "important": "",
                                                "merge": false,
                                                "_index": 152,
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
                                "_index": 112,
                                "inline": false,
                                "variable": true,
                                "allowRoot": true
                            },
                            "4": {
                                "type": "MixinDefinition",
                                "name": ".mixin-new-syntax",
                                "selectors": {
                                    "0": {
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
                                                "value": ".mixin-new-syntax",
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
                                            "_index": 201,
                                            "rulesetLike": false,
                                            "allowRoot": true
                                        },
                                        "important": "",
                                        "merge": false,
                                        "_index": 194,
                                        "inline": false,
                                        "allowRoot": true
                                    }
                                },
                                "_lookups": {},
                                "required": 0,
                                "optionalParameters": {},
                                "allowRoot": true
                            },
                            "5": {
                                "type": "Comment",
                                "value": "// just a class, but also can be used as a mixin",
                                "isLineComment": true,
                                "_index": 210,
                                "allowRoot": true
                            },
                            "6": {
                                "type": "Ruleset",
                                "selectors": {
                                    "0": {
                                        "type": "Selector",
                                        "evaldCondition": true,
                                        "_index": 259,
                                        "elements": {
                                            "0": {
                                                "type": "Element",
                                                "combinator": {
                                                    "type": "Combinator",
                                                    "value": " ",
                                                    "emptyOrWhitespace": true
                                                },
                                                "value": ".mixin-old-syntax",
                                                "isVariable": false,
                                                "_index": 259
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
                                            "value": "purple",
                                            "_index": 290,
                                            "rulesetLike": false,
                                            "allowRoot": true
                                        },
                                        "important": "",
                                        "merge": false,
                                        "_index": 283,
                                        "inline": false,
                                        "allowRoot": true
                                    }
                                },
                                "_lookups": {},
                                "_variables": null,
                                "_properties": null,
                                "strictImports": false,
                                "allowRoot": true
                            },
                            "7": {
                                "type": "MixinDefinition",
                                "name": ".mixin-another",
                                "selectors": {
                                    "0": {
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
                                                "value": ".mixin-another",
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
                                            "value": "brown",
                                            "_index": 331,
                                            "rulesetLike": false,
                                            "allowRoot": true
                                        },
                                        "important": "",
                                        "merge": false,
                                        "_index": 324,
                                        "inline": false,
                                        "allowRoot": true
                                    }
                                },
                                "_lookups": {},
                                "required": 0,
                                "optionalParameters": {},
                                "allowRoot": true
                            },
                            "8": {
                                "type": "MixinDefinition",
                                "name": "#namespace-definition",
                                "selectors": {
                                    "0": {
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
                                                "_index": 371,
                                                "elements": {
                                                    "0": {
                                                        "type": "Element",
                                                        "combinator": {
                                                            "type": "Combinator",
                                                            "value": " ",
                                                            "emptyOrWhitespace": true
                                                        },
                                                        "value": ".innerProperty",
                                                        "isVariable": false,
                                                        "_index": 371
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
                                                    "_index": 403,
                                                    "rulesetLike": false,
                                                    "allowRoot": true
                                                },
                                                "important": "",
                                                "merge": false,
                                                "_index": 396,
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
                            },
                            "9": {
                                "type": "Ruleset",
                                "selectors": {
                                    "0": {
                                        "type": "Selector",
                                        "evaldCondition": true,
                                        "_index": 420,
                                        "elements": {
                                            "0": {
                                                "type": "Element",
                                                "combinator": {
                                                    "type": "Combinator",
                                                    "value": " ",
                                                    "emptyOrWhitespace": true
                                                },
                                                "value": "another-selector",
                                                "isVariable": false,
                                                "_index": 420
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
                                            "_index": 450,
                                            "rulesetLike": false,
                                            "allowRoot": true
                                        },
                                        "important": "",
                                        "merge": false,
                                        "_index": 443,
                                        "inline": false,
                                        "allowRoot": true
                                    }
                                },
                                "_lookups": {},
                                "_variables": null,
                                "_properties": null,
                                "strictImports": false,
                                "allowRoot": true
                            },
                            "10": {
                                "type": "Ruleset",
                                "selectors": {
                                    "0": {
                                        "type": "Selector",
                                        "evaldCondition": true,
                                        "_index": 459,
                                        "elements": {
                                            "0": {
                                                "type": "Element",
                                                "combinator": {
                                                    "type": "Combinator",
                                                    "value": " ",
                                                    "emptyOrWhitespace": true
                                                },
                                                "value": "body",
                                                "isVariable": false,
                                                "_index": 459
                                            }
                                        }
                                    }
                                },
                                "rules": {
                                    "0": {
                                        "type": "Declaration",
                                        "name": {"0": {"type": "Keyword", "value": "color"}},
                                        "value": {
                                            "type": "Value",
                                            "value": {
                                                "0": {
                                                    "type": "Expression",
                                                    "value": {
                                                        "0": {
                                                            "type": "Variable",
                                                            "name": "@var-definition",
                                                            "_index": 477
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        "important": "",
                                        "merge": false,
                                        "_index": 470,
                                        "inline": false,
                                        "allowRoot": true
                                    },
                                    "1": {
                                        "type": "Declaration",
                                        "name": {"0": {"type": "Keyword", "value": "background-color"}},
                                        "value": {
                                            "type": "Value",
                                            "value": {
                                                "0": {
                                                    "type": "Expression",
                                                    "value": {
                                                        "0": {"type": "Variable", "name": "@myVar", "_index": 516}
                                                    }
                                                }
                                            }
                                        },
                                        "important": "",
                                        "merge": false,
                                        "_index": 498,
                                        "inline": false,
                                        "allowRoot": true
                                    },
                                    "2": {
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
                                                    "value": ".mixin-new-syntax",
                                                    "isVariable": false,
                                                    "_index": 528
                                                }
                                            }
                                        },
                                        "arguments": {},
                                        "_index": 528,
                                        "important": false,
                                        "allowRoot": true
                                    },
                                    "3": {
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
                                                    "value": ".mixin-old-syntax",
                                                    "isVariable": false,
                                                    "_index": 553
                                                }
                                            }
                                        },
                                        "arguments": {},
                                        "_index": 553,
                                        "important": false,
                                        "allowRoot": true
                                    },
                                    "4": {
                                        "type": "Extend",
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
                                                    "value": ".mixin-another",
                                                    "isVariable": false,
                                                    "_index": 588
                                                }
                                            }
                                        },
                                        "option": null,
                                        "object_id": 0,
                                        "parent_ids": {"0": 0},
                                        "_index": 579,
                                        "allowRoot": true,
                                        "allowBefore": false,
                                        "allowAfter": false
                                    },
                                    "5": {
                                        "type": "Declaration",
                                        "name": {"0": {"type": "Keyword", "value": "text-align"}},
                                        "value": {
                                            "type": "Anonymous",
                                            "value": "center",
                                            "_index": 622,
                                            "rulesetLike": false,
                                            "allowRoot": true
                                        },
                                        "important": "",
                                        "merge": false,
                                        "_index": 610,
                                        "inline": false,
                                        "allowRoot": true
                                    },
                                    "6": {
                                        "type": "Declaration",
                                        "name": {"0": {"type": "Keyword", "value": "border-color"}},
                                        "value": {
                                            "type": "Value",
                                            "value": {
                                                "0": {
                                                    "type": "Expression",
                                                    "value": {
                                                        "0": {
                                                            "type": "NamespaceValue",
                                                            "value": {
                                                                "type": "VariableCall",
                                                                "variable": "@map-definition",
                                                                "_index": 664,
                                                                "allowRoot": true
                                                            },
                                                            "lookups": {"0": "one"},
                                                            "_index": 664
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        "important": "",
                                        "merge": false,
                                        "_index": 635,
                                        "inline": false,
                                        "allowRoot": true
                                    },
                                    "7": {
                                        "type": "Declaration",
                                        "name": {"0": {"type": "Keyword", "value": "color"}},
                                        "value": {
                                            "type": "Value",
                                            "value": {
                                                "0": {
                                                    "type": "Expression",
                                                    "value": {
                                                        "0": {
                                                            "type": "NamespaceValue",
                                                            "value": {
                                                                "type": "VariableCall",
                                                                "variable": "@map-definition",
                                                                "_index": 697,
                                                                "allowRoot": true
                                                            },
                                                            "lookups": {"0": "two"},
                                                            "_index": 697
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        "important": "",
                                        "merge": false,
                                        "_index": 675,
                                        "inline": false,
                                        "allowRoot": true
                                    },
                                    "8": {
                                        "type": "Declaration",
                                        "name": {"0": {"type": "Keyword", "value": "background-color"}},
                                        "value": {
                                            "type": "Value",
                                            "value": {
                                                "0": {
                                                    "type": "Expression",
                                                    "value": {
                                                        "0": {
                                                            "type": "NamespaceValue",
                                                            "value": {
                                                                "type": "VariableCall",
                                                                "variable": "@map-definition",
                                                                "_index": 741,
                                                                "allowRoot": true
                                                            },
                                                            "lookups": {"0": "two"},
                                                            "_index": 741
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        "important": "",
                                        "merge": false,
                                        "_index": 708,
                                        "inline": false,
                                        "allowRoot": true
                                    },
                                    "9": {
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
                                                    "value": "#namespace-definition",
                                                    "isVariable": false,
                                                    "_index": 752
                                                },
                                                "1": {
                                                    "type": "Element",
                                                    "combinator": {
                                                        "type": "Combinator",
                                                        "value": "",
                                                        "emptyOrWhitespace": true
                                                    },
                                                    "value": ".innerProperty",
                                                    "isVariable": false,
                                                    "_index": 773
                                                }
                                            }
                                        },
                                        "arguments": {},
                                        "_index": 752,
                                        "important": false,
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
                        "_variables": null,
                        "_properties": null,
                        "allowRoot": true,
                        "root": true,
                        "firstRoot": true,
                        "functionRegistry": {"_data": {}}
                    },
                    "importedFilename": "${parseTestFiles.allTheThings}"
                }`,
            ].map((entry) => collapseJsonWhiteSpace(entry)),
        );
    });
});
