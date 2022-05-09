import {typedHasOwnProperty} from 'augment-vir';
import {AnyNodeSubType, NodeType, tree} from 'less';

export function getNodeType(node: tree.Node): NodeType {
    const type = node.type;
    const constructorName = node.constructor.name;
    if (type) {
        return type;
    } else {
        console.error({node});
        console.error(`Has to use constructor for ${constructorName}`);
        return constructorName as NodeType;
    }
}

function logNodePropError(node: tree.Node, details: any): void {
    console.error({type: getNodeType(node)});
    console.error({node});
    if (details) {
        console.error(details);
    }
}

type NodeString = [tree.Node, string];
type NodeStringArray = [NodeString, ...NodeString[]];
type InnerNodeToStringReturn = NodeString | NodeStringArray;

function isNodeStringArray(
    innerNodeToStringReturn: InnerNodeToStringReturn,
): innerNodeToStringReturn is NodeStringArray {
    return Array.isArray(innerNodeToStringReturn[0]);
}

function innerNodeToString(node: AnyNodeSubType | AnyNodeSubType[]): InnerNodeToStringReturn {
    if (Array.isArray(node)) {
        const innerNodeStrings: NodeString[] = node.reduce((accum, innerNode): NodeString[] => {
            const innerNodeString = innerNodeToString(innerNode);
            if (isNodeStringArray(innerNodeString)) {
                accum.push(...innerNodeString);
            } else {
                accum.push(innerNodeString);
            }

            return accum as NodeString[];
        }, [] as NodeString[]);
        if (innerNodeStrings.length) {
            return innerNodeStrings as NodeStringArray;
        } else {
            node.forEach((innerNode) => logNodePropError(innerNode, undefined));
            throw new Error(`Got no node strings.`);
        }
    } else {
        if (typedHasOwnProperty('elements', node)) {
            const elements = node.elements;
            return innerNodeToString(elements);
        } else if (typedHasOwnProperty('selector', node)) {
            const selector = node.selector;
            return innerNodeToString(selector);
        } else if (typedHasOwnProperty('variable', node)) {
            const variable = node.variable;
            if (typeof variable === 'string') {
                return [
                    node,
                    variable,
                ];
            } else {
                logNodePropError(node, {variable});
                throw new Error(`No type matched for variable.`);
            }
        } else if (typedHasOwnProperty('name', node)) {
            const name = node.name;
            if (typeof name === 'string') {
                return [
                    node,
                    name,
                ];
            } else if (Array.isArray(name)) {
                return innerNodeToString(name);
            } else {
                logNodePropError(node, {name});
                throw new Error(`No type matched for name.`);
            }
        } else if (typedHasOwnProperty('value', node)) {
            const value = node.value;
            if (typeof value === 'string') {
                return [
                    node,
                    value,
                ];
            } else if (value instanceof tree.Node) {
                return innerNodeToString(value);
            } else if (typeof value === 'number') {
                return [
                    node,
                    String(value),
                ];
            } else if (Array.isArray(value)) {
                return innerNodeToString(value);
            } else {
                logNodePropError(node, {value});
                throw new Error(`No type matched for value.`);
            }
        } else {
            logNodePropError(node, undefined);
            throw new Error(`No string-like property matched.`);
        }
    }
}

function nodeStringToString(nodeString: NodeString): string {
    const nodeType = getNodeType(nodeString[0]);
    return `${nodeType}: ${nodeString[1]}`;
}

export function nodeToString(node: tree.Node): string {
    const nodeStrings = innerNodeToString(node);
    if (isNodeStringArray(nodeStrings)) {
        return nodeStrings.map((nodeString) => nodeStringToString(nodeString)).join(' ');
    } else {
        return nodeStringToString(nodeStrings);
    }
}
