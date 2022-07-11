import {NodeType, tree} from 'less';
import {
    allNodeTypes,
    getNodeType,
    jsonSerializeNode,
    mappedNodeConstructors,
    testAllNodeConstructors,
} from '../augments/node';
import {walkLess} from '../parse-less/walk-less';

type ImportableNode = tree.VariableCall | tree.mixin.Call | tree.Extend | tree.Variable;

function getMixinCallName(node: tree.mixin.Call): string {
    const name = node.selector?.elements[0]?.value;
    if (!name) {
        console.error(jsonSerializeNode(node));
        throw new Error(`Could not find node name in mixin call`);
    }
    return name;
}

function getExtendNames(node: tree.Extend): string[] {
    return node.selector.elements.map((element) => {
        return element.value;
    });
}

function getAllImportableNodes(context: tree.Node): ImportableNode[] {
    /** These are nodes that COULD have been imported. */
    const importableNodes: ImportableNode[] = [];

    walkLess(context, (node) => {
        const nodeType: NodeType = getNodeType(node);
        if (!allNodeTypes.includes(nodeType)) {
            console.error({unexpectedNodeType: nodeType, node});
            throw new Error(`Unexpected node type: "${nodeType}"`);
        }
        if (!testAllNodeConstructors(node).length) {
            console.error({nodeConstructor: node.constructor.name, node});
            throw new Error(`Unexpected node constructor.`);
        }
        if (!(node instanceof mappedNodeConstructors[nodeType])) {
            console.error({misMappedNodeType: nodeType, node});
            throw new Error(`Node type "${nodeType}" has been mis-mapped to its constructor.`);
        }

        if (node instanceof tree.VariableCall) {
            importableNodes.push(node);
        } else if (node instanceof tree.mixin.Call) {
            importableNodes.push(node);
        } else if (node instanceof tree.Extend) {
            importableNodes.push(node);
        } else if (node instanceof tree.Variable) {
            importableNodes.push(node);
        }
    });

    return importableNodes;
}

/** Gets all var, mixin, etc. names that COULD have been imported from another file. */
export function getImportableNodeNames(context: tree.Node): Set<string> {
    const importableNodes = getAllImportableNodes(context);

    const names = importableNodes
        .map((node): string | string[] => {
            if (node instanceof tree.VariableCall) {
                return node.variable;
            } else if (node instanceof tree.mixin.Call) {
                return getMixinCallName(node);
            } else if (node instanceof tree.Extend) {
                return getExtendNames(node);
            } else if (node instanceof tree.Variable) {
                return node.name;
            }

            console.error(jsonSerializeNode(node));
            throw new Error(
                `Failed to extract node name from "${(node as tree.Node).type}" type of node.`,
            );
        })
        .flat();

    return new Set(names);
}
