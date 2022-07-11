import {getObjectTypedKeys, isObject, mapObject, typedHasOwnProperty} from 'augment-vir';
import {AnyNodeSubType, NodeType, tree} from 'less';
import {AsTuple, Constructor, ConstructorReturnType, wrapTypeWithReadonly} from './type';

export const allNodeTypes = wrapTypeWithReadonly<Readonly<NodeType[]>>()([
    NodeType.Anonymous,
    NodeType.Assignment,
    NodeType.AtRule,
    NodeType.Attribute,
    NodeType.Call,
    NodeType.Color,
    NodeType.Combinator,
    NodeType.Comment,
    NodeType.Condition,
    NodeType.Declaration,
    NodeType.DetachedRuleset,
    NodeType.Dimension,
    NodeType.Element,
    NodeType.Expression,
    NodeType.Extend,
    NodeType.Import,
    NodeType.JavaScript,
    NodeType.Keyword,
    NodeType.Media,
    NodeType.MixinCall,
    NodeType.MixinDefinition,
    NodeType.NamespaceValue,
    NodeType.Negative,
    NodeType.Operation,
    NodeType.Paren,
    NodeType.Property,
    NodeType.Quoted,
    NodeType.Ruleset,
    NodeType.Selector,
    NodeType.UnicodeDescriptor,
    NodeType.Unit,
    NodeType.URL,
    NodeType.Value,
    NodeType.Variable,
    NodeType.VariableCall,
] as const);

export const allNodeConstructors = wrapTypeWithReadonly<Readonly<Constructor<tree.Node>[]>>()([
    tree.Anonymous,
    tree.Assignment,
    tree.AtRule,
    tree.Attribute,
    tree.Call,
    tree.Color,
    tree.Combinator,
    tree.Comment,
    tree.Condition,
    tree.Declaration,
    tree.DetachedRuleset,
    tree.Dimension,
    tree.Element,
    tree.Expression,
    tree.Extend,
    tree.Import,
    tree.JavaScript,
    tree.Keyword,
    tree.Media,
    tree.mixin.Call,
    tree.mixin.Definition,
    tree.NamespaceValue,
    tree.Negative,
    tree.Operation,
    tree.Paren,
    tree.Property,
    tree.Quoted,
    tree.Ruleset,
    tree.Selector,
    tree.UnicodeDescriptor,
    tree.Unit,
    tree.URL,
    tree.Value,
    tree.Variable,
    tree.VariableCall,
] as const);

type Constructors = {
    [K in keyof AsTuple<typeof allNodeTypes>]: typeof allNodeConstructors[K];
};
type Types = {[K in keyof AsTuple<typeof allNodeTypes>]: typeof allNodeTypes[K]};
type TypesMappedToConstructors = {
    [K in keyof Types as Types[K]]: Constructors[K];
};

export const mappedNodeConstructors = (() => {
    return allNodeTypes.reduce((accum, currentNodeType, index) => {
        accum[currentNodeType] = allNodeConstructors[index]!;
        return accum;
    }, {} as Record<NodeType, Constructor<tree.Node>>) as TypesMappedToConstructors;
})();

export function isOfNodeType<SpecificNodeType extends NodeType>(
    inputNode: unknown,
    type: SpecificNodeType,
): inputNode is ConstructorReturnType<TypesMappedToConstructors[SpecificNodeType]> {
    return getNodeType(inputNode as any) === type;
}

export function testAllNodeConstructors(node: tree.Node): NodeType[] {
    const matchingConstructorEntries: [NodeType, Constructor<tree.Node>][] = (
        Object.entries(mappedNodeConstructors) as [NodeType, Constructor<tree.Node>][]
    ).filter(
        ([
            key,
            value,
        ]) => {
            return node instanceof value;
        },
    );

    return matchingConstructorEntries.map((entry) => entry[0]);
}

export function getNodeType(node: Pick<tree.Node, 'type'>): NodeType {
    const type = node.type;
    const constructorName = node.constructor.name;
    if (type) {
        return type;
    } else {
        console.error({node});
        throw new Error(`Has to use constructor for ${constructorName}`);
    }
}

function logNodePropError(node: tree.Node, details: any): void {
    console.error({type: getNodeType(node)});
    console.error({node});
    if (details) {
        console.error(details);
    }
}

type NodeString = Readonly<
    [Readonly<Pick<tree.Node, 'type'>> | 'Array', Readonly<Record<string, string>>]
>;
type NodeStringArray = [NodeString, ...NodeString[]];

function wrapInnerNodeToString<T extends tree.Node>(node: T, prop: keyof T): NodeStringArray {
    const subNodes = node[prop] as unknown as AnyNodeSubType | AnyNodeSubType[] | undefined;

    if (!Array.isArray(subNodes) && !(subNodes instanceof tree.Node)) {
        logNodePropError(node, {prop});
        throw new Error(`Property value on node at "${String(prop)}" was not more nodes.`);
    }
    return [
        [
            node,
            {[prop]: '->'},
        ],
        ...innerNodeToString(subNodes),
    ];
}

function innerNodeToString(node: AnyNodeSubType | AnyNodeSubType[]): NodeStringArray {
    if (Array.isArray(node)) {
        const innerNodeStrings: NodeString[] = node.reduce(
            (accum, innerNode, index): NodeString[] => {
                const innerNodeString: NodeStringArray = [
                    [
                        'Array',
                        {[index]: '->'},
                    ],
                    ...innerNodeToString(innerNode),
                ];
                accum.push(...innerNodeString);

                return accum as NodeString[];
            },
            [] as NodeString[],
        );
        if (innerNodeStrings.length) {
            return innerNodeStrings as NodeStringArray;
        } else {
            node.forEach((innerNode) => logNodePropError(innerNode, undefined));
            throw new Error(`Got no node strings.`);
        }
    } else {
        if (typedHasOwnProperty('lookups', node)) {
            const lookups: NodeString[] = node.lookups.map((lookup, index): NodeString => {
                return [
                    node,
                    {[`lookups.${index}`]: lookup},
                ];
            });
            const innerValues: NodeStringArray = wrapInnerNodeToString(node, 'value');

            const returnValues: NodeStringArray = [
                ...innerValues,
                ...lookups,
            ];
            return returnValues;
        } else if (typedHasOwnProperty('elements', node)) {
            return wrapInnerNodeToString(node, 'elements');
        } else if (typedHasOwnProperty('selector', node)) {
            return wrapInnerNodeToString(node, 'selector');
        } else if (node instanceof tree.Import) {
            return wrapInnerNodeToString(node, 'path');
        } else if (typedHasOwnProperty('rules', node)) {
            return wrapInnerNodeToString(node, 'rules');
        } else if (
            typedHasOwnProperty('variable', node) &&
            node.variable != undefined &&
            typeof node.variable !== 'boolean'
        ) {
            const variable = node.variable;
            if (typeof variable === 'string') {
                return [
                    [
                        node,
                        {variable},
                    ],
                ];
            } else {
                logNodePropError(node, {variable});
                throw new Error(`No type matched for variable.`);
            }
        } else if (typedHasOwnProperty('name', node)) {
            const name = node.name;
            if (typeof name === 'string') {
                return [
                    [
                        node,
                        {name},
                    ],
                ];
            } else if (Array.isArray(name)) {
                return wrapInnerNodeToString(node, 'name');
            } else {
                logNodePropError(node, {name});
                throw new Error(`No type matched for name.`);
            }
        } else if (typedHasOwnProperty('value', node)) {
            const value = node.value;
            if (typeof value === 'string') {
                return [
                    [
                        node,
                        {value},
                    ],
                ];
            } else if (value instanceof tree.Node) {
                return wrapInnerNodeToString(node, 'value');
            } else if (typeof value === 'number') {
                return [
                    [
                        node,
                        {value: String(value)},
                    ],
                ];
            } else if (Array.isArray(node.value)) {
                return wrapInnerNodeToString(node, 'value');
            } else {
                logNodePropError(node, {value});
                throw new Error(`No type matched for value.`);
            }
        } else if (typedHasOwnProperty('ruleset', node)) {
            return wrapInnerNodeToString(node, 'ruleset');
        } else {
            logNodePropError(node, undefined);
            throw new Error(`No string-like property matched.`);
        }
    }
}

function nodeStringToString(nodeString: NodeString): string {
    const isArrayType = nodeString[0] === 'Array';
    const nodeType = isArrayType ? 'Array' : getNodeType(nodeString[0]);
    const nodeInnerAccess = nodeString[1];
    if (Object.keys(nodeInnerAccess).length !== 1) {
        console.error(nodeInnerAccess);
        throw new Error(`What do I do with multiple inner accesses?`);
    }
    const firstKey = Object.keys(nodeInnerAccess)[0]!;
    const firstKeyAccess = isArrayType ? `[${firstKey}]` : `.${firstKey}:`;
    const nodeInnerAccessString = `${firstKeyAccess} ${nodeInnerAccess[firstKey]}`;

    return `${nodeType}${nodeInnerAccessString}`;
}

export function nodeToLineString(node: tree.Node): string {
    const nodeStrings = innerNodeToString(node);
    return nodeStrings.map((nodeString) => nodeStringToString(nodeString)).join(' ');
}

const unserializableKeys = [
    'parent',
    // this one is serializable I just don't want to look at it
    '_fileInfo',
];

function nodeToSerializable(node: unknown): unknown {
    if (isObject(node)) {
        if (node instanceof tree.Node) {
            const serialized = getObjectTypedKeys(node).reduce(
                (accum, key: keyof tree.Node) => {
                    if (!unserializableKeys.includes(key)) {
                        accum[key] = nodeToSerializable(node[key]);
                    }
                    return accum;
                },
                {type: node.type} as Record<keyof tree.Node, any>,
            );

            return serialized;
        } else {
            return mapObject(node, (key, value) => {
                return nodeToSerializable(value);
            });
        }
    }
    return node;
}

export function jsonSerializeNode(input: tree.Node, indent = 2): string {
    return JSON.stringify(nodeToSerializable(input), null, indent);
}

export function importNodeToLineString(importNode: tree.Import): string {
    const reference = importNode.options.reference ? '(reference) ' : '';
    return `@import `;
}
