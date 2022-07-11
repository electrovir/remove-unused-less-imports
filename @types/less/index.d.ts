// copied and modified from DefinitelyTyped here: https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/less/index.d.ts
// and has the following license:
/*
This project is licensed under the MIT license.
Copyrights are respective of each contributor listed at the beginning of each definition file.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
// this should eventually be cleaned up and pushed to DefinitelyTyped itself

declare namespace Less {
    // https://github.com/less/less.js/blob/master/lib/less/import-manager.js#L10
    interface RootFileInfo {
        /** Whether to adjust URL's to be relative */
        rewriteUrls?: boolean;
        /** Full resolved filename of current file */
        filename: string;
        relativeUrls: boolean;
        /** Path to append to normal URLs for this node */
        rootpath: string;
        /** Path to the current file, absolute */
        currentDirectory: string;
        /** Absolute path to the entry file */
        entryPath: string;
        /** Filename of the base file */
        rootFilename: string;
        /** Whether the file should not be output and only output parts that are referenced */
        reference: boolean;
    }

    class PluginManager {
        constructor(less: typeof LessStatic);

        addPreProcessor(preProcessor: PreProcessor, priority?: number): void;
    }

    class LessError extends Error {
        public type: string;
        public fileName: string;
        public index: number;
        public line: number;
        public column: number;
        public callLine: number;
    }

    interface Plugin {
        install: (less: typeof LessStatic, pluginManager: PluginManager) => void;
    }

    interface PreProcessor {
        process: (src: string, extra: PreProcessorExtraInfo) => string;
    }

    interface PreProcessorExtraInfo {
        context: {pluginManager: PluginManager};

        fileInfo: RootFileInfo;

        imports: {[key: string]: any};
    }

    interface SourceMapOption {
        sourceMapURL?: string;
        sourceMapBasepath?: string;
        sourceMapRootpath?: string;
        outputSourceFiles?: boolean;
        sourceMapFileInline?: boolean;
    }

    interface StaticOptions {
        async: boolean;
        fileAsync: boolean;
        modifyVars: {[variable: string]: string};
    }

    interface ImportManager {
        less: any;
        contents: {[fileName: string]: string};
        rootFilename: string;
        paths: string[];
        contentsIgnoredChars: {};
        mime: undefined | any;
        error: null | LessError;
        context: any;
        queue: any[];
        files: {};
    }

    /**
     * Reference to:
     *
     * - https://github.com/less/less.js/blob/master/bin/lessc
     * - http://lesscss.org/usage/#less-options
     *
     * @interface Options
     */
    interface Options {
        sourceMap?: SourceMapOption;
        /** Filename of the main file to be passed to less.render() */
        filename?: string;
        /** The locations for less looking for files in @import rules */
        paths?: string[];
        /** True, if run the less parser and just reports errors without any output. */
        lint?: boolean;
        /** Pre-load global Less.js plugins */
        plugins?: Plugin[];
        /** @deprecated If true, compress using less built-in compression. */
        compress?: boolean;
        strictImports?: boolean;
        /** If true, allow imports from insecure https hosts. */
        insecure?: boolean;
        depends?: boolean;
        maxLineLen?: number;
        /** @deprecated If false, No color in compiling. */
        color?: boolean;
        /** @deprecated False by default. */
        ieCompat?: boolean;
        /** @deprecated If true, enable evaluation of JavaScript inline in `.less` files. */
        javascriptEnabled?: boolean;
        /** Whether output file information and line numbers in compiled CSS code. */
        dumpLineNumbers?: 'comment' | string;
        /** Add a path to every generated import and url in output css files. */
        rootpath?: string;
        /** Math mode options for avoiding symbol conficts on math expressions. */
        math?: 'always' | 'strict' | 'parens-division' | 'parens' | 'strict-legacy' | number;
        /** If true, stops any warnings from being shown. */
        silent?: boolean;
        /** Without this option, Less attempts to guess at the output unit when it does maths. */
        strictUnits?: boolean;
        /** Defines a variable that can be referenced by the file. */
        globalVars?: {
            [key: string]: string;
        };
        /** Puts Var declaration at the end of base file. */
        modifyVars?: {
            [key: string]: string;
        };
        /** Read files synchronously in Node.js */
        syncImport?: boolean;
    }

    interface RenderError {
        column: number;
        extract: string[];
        filename: string;
        index: number;
        line: number;
        message: string;
        type: string;
    }

    interface RenderOutput {
        css: string;
        map: string;
        imports: string[];
    }

    interface RefreshOutput {
        endTime: Date;
        startTime: Date;
        sheets: number;
        totalMilliseconds: number;
    }
}

declare namespace LessStatic {
    const options: Less.StaticOptions;

    type Options = Less.Options;
    type ImportManager = Less.ImportManager;

    const importManager: Less.ImportManager | undefined;
    const sheets: HTMLLinkElement[];

    function modifyVars(vars: {[name: string]: string}): Promise<Less.RefreshOutput>;

    function refreshStyles(): void;

    function render(
        input: string,
        callback: (error: Less.RenderError, output: Less.RenderOutput | undefined) => void,
    ): void;
    function render(
        input: string,
        options: Less.Options,
        callback: (error: Less.RenderError, output: Less.RenderOutput | undefined) => void,
    ): void;

    function render(input: string): Promise<Less.RenderOutput>;
    function render(input: string, options: Less.Options): Promise<Less.RenderOutput>;

    function refresh(
        reload?: boolean,
        modifyVars?: {[variable: string]: string},
        clearFileCache?: boolean,
    ): Promise<Less.RefreshOutput>;

    const version: number[];

    function watch(): void;

    class Parser {
        constructor(
            context: {
                pluginManager?: Less.PluginManager;
            },
            imports: {contents: {[fileName: string]: string}},
            fileInfo: Partial<Less.RootFileInfo>,
        );
        parse(css: string, handle: (error: Less.LessError, tree: any) => void): void;
    }

    function parse(
        input: string,
        options: any,
        callback: (
            error: Less.LessError | null,
            root: tree.Ruleset,
            imports: Less.ImportManager,
            options: Less.Options,
        ) => void,
    ): void;

    export namespace tree {
        class Node {
            type?: NodeType;
            typeIndex: number;
            parent: Node | null;
            visibilityBlocks: undefined;
            nodeVisible: undefined;
            rootNode: null;
            parsed: null;
            index: number;
            currentFileInfo: Less.RootFileInfo;
            setParent(nodes: Node | Node[], parent: Node): any;
            getIndex(): any;
            fileInfo(): any;
            isRulesetLike(): any;
            toCSS(context: any): any;
            genCSS(context: any, output: any): any;
            accept(visitor: any /*Visitor*/): any;
            eval(): any;
            _operate(context: any, op: string, a: any, b: any): any;
            fround(context: any, value: any): any;
            blocksVisibility(): any;
            addVisibilityBlock(): any;
            removeVisibilityBlock(): any;
            ensureVisibility(): any;
            ensureInvisibility(): any;
            isVisible(): any;
            visibilityInfo(): any;
            copyVisibilityInfo(info?: any): any;
            compare(a: any, b: any): number | any;
            numericCompare(a: any, b: any): number | undefined;
        }
        class Anonymous extends Node {
            value: string;

            mapLines: undefined;
            _index: number;
            _fileInfo: undefined;
        }
        class Assignment extends Node {}
        class AtRule extends Node {}
        class Attribute extends Node {}
        class Call extends Node {
            name: string;
        }
        class Color extends Node {
            static fromKeyword(value: string): Color | undefined;
        }
        class Combinator extends Node {}
        class Comment extends Node {}
        class Condition extends Node {}
        class Declaration extends Node {
            name: Keyword[] | string;
            value: Value | Anonymous;
            important: string;
            variable: boolean;
            inline: boolean;
        }
        class DetachedRuleset extends Node {
            ruleset: Node;
        }
        class Dimension extends Node {
            value: number;
            unit: Unit;
        }
        class Element extends Node {
            combinator: any;
            value: string;
        }
        class Expression extends Node {
            noSpacing: undefined;
            value: Variable[];
        }
        class Extend extends Node {
            selector: Selector;
        }
        class Keyword extends Node {
            value: string;
        }
        class JavaScript extends JsEvalNode {}
        class JsEvalNode extends Node {}
        class Media extends AtRule {}
        class NamespaceValue extends Node {
            value: Node;
            lookups: string[];
        }
        class Negative extends Node {}
        class Operation extends Node {}
        class Paren extends Node {}
        class Property extends Node {}
        class Quoted extends Node {
            value: string;
        }
        class Ruleset extends Node {
            isRuleSet: boolean;
            allowRoot?: boolean;
            ruleSets(): any;
            selectors: Selector[] | null;
            rules: (Ruleset | Declaration)[];
            _lookups: {};
            strictImports?: boolean;
            root?: boolean;
            firstRoot?: boolean;
            functionRegistry?: FunctionRegistry;
            variables(): {[name: string]: Variable};
            variable(name: string): Variable;
            properties(): {[name: string]: Variable};
            property(name: string): Variable;
        }
        class Import extends Node {
            options: Partial<{
                reference: boolean;
            }>;
            path: Quoted;
            root: RuleSet;
        }
        class Selector extends Node {
            extendList: any | undefined;
            condition: any | undefined;
            evaldCondition: boolean;
            elements: Element[];
            mixinElements_: any | undefined;
        }
        class UnicodeDescriptor extends Node {}
        class Unit extends Node {
            numerator: any[];
            denominator: any[];
        }
        class URL extends Node {}
        class Variable extends Node {
            name: string;
            _index: number;
            _fileInfo: Less.RootFileInfo;
        }

        class Value extends Node {
            value: Node[];
        }
        class VariableCall extends Node {
            variable: string;
        }
        export namespace mixin {
            class Call extends MixinCall {
                selector: Selector;
            }
            class Definition extends MixinDefinition {}
        }
    }

    class MixinCall extends tree.Node {}
    class MixinDefinition extends tree.Node {
        name: string;
    }

    export type AnyNodeSubType =
        | tree.Anonymous
        | tree.Assignment
        | tree.AtRule
        | tree.Attribute
        | tree.Call
        | tree.Color
        | tree.Combinator
        | tree.Comment
        | tree.Condition
        | tree.Declaration
        | tree.DetachedRuleset
        | tree.Dimension
        | tree.Element
        | tree.Expression
        | tree.Extend
        | tree.Import
        | tree.JsEvalNode
        | tree.Keyword
        | tree.mixin.Call
        | tree.mixin.Definition
        | tree.NamespaceValue
        | tree.Negative
        | tree.Operation
        | tree.Paren
        | tree.Property
        | tree.Quoted
        | tree.Ruleset
        | tree.Selector
        | tree.UnicodeDescriptor
        | tree.Unit
        | tree.URL
        | tree.Value
        | tree.Variable
        | tree.VariableCall;

    type FunctionRegistry = {
        _data: any;
        add(name: string, func: Function): void;
        addMultiple(functions: {[name: string]: Function}): void;
        get(name: string): Function;
        getLocalFunctions(): any;
        inherit(): any;
        create(base: any): any;
    };

    class ParseTree {
        constructor(root: tree.Ruleset, imports: Less.ImportManager);
    }

    export const enum NodeType {
        Anonymous = 'Anonymous',
        Assignment = 'Assignment',
        AtRule = 'AtRule',
        Attribute = 'Attribute',
        Call = 'Call',
        Color = 'Color',
        Combinator = 'Combinator',
        Comment = 'Comment',
        Condition = 'Condition',
        Declaration = 'Declaration',
        DetachedRuleset = 'DetachedRuleset',
        Dimension = 'Dimension',
        Element = 'Element',
        Expression = 'Expression',
        Extend = 'Extend',
        Import = 'Import',
        JavaScript = 'JavaScript',
        Keyword = 'Keyword',
        Media = 'Media',
        MixinCall = 'MixinCall',
        MixinDefinition = 'MixinDefinition',
        NamespaceValue = 'NamespaceValue',
        Negative = 'Negative',
        Operation = 'Operation',
        Paren = 'Paren',
        Property = 'Property',
        Quoted = 'Quoted',
        Ruleset = 'Ruleset',
        Selector = 'Selector',
        UnicodeDescriptor = 'UnicodeDescriptor',
        Unit = 'Unit',
        URL = 'Url',
        Value = 'Value',
        VariableCall = 'VariableCall',
        Variable = 'Variable',
    }

    export namespace visitors {
        /**
         * Subclasses of this class can have visit* or visit*Out methods that will get called for
         * whatever type is in *. Example: visitColor will get called for all nodes of the class Color.
         */
        class Visitor {
            /**
             * Visit* or visit*Out where * is the node type are accepted methods for subclasses.
             * Example: visitColor will get called for all nodes of the class Color.
             */
            visit(node: tree.Node): tree.Node;
        }
        class ImportVisitor {}
        class MarkVisibleSelectorsVisitor {}
        class ExtendVisitor {}
        class JoinSelectorVisitor {}
        class ToCSSVisitor {}
    }
}

declare module 'less' {
    export = LessStatic;
}
