import {NodeType, tree} from 'less';
import {
    allNodeTypes,
    getNodeType,
    jsonSerializedNode,
    mappedNodeConstructors,
    testAllNodeConstructors,
} from '../augments/node';
import {walkLess} from './walk-less';

type ExportableNode = tree.Declaration | tree.Ruleset | tree.mixin.Definition;

function getRulesetName(node: tree.Ruleset): string | undefined {
    if (typeof node?.selectors?.[0]?.elements?.[0]?.value === 'string') {
        return node.selectors[0].elements[0].value;
    }
    return undefined;
}

function getAllExportableNodes(context: tree.Node): ExportableNode[] {
    const exportableNodes: ExportableNode[] = [];

    walkLess(
        context,
        (node) => {
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

            if (node instanceof tree.Declaration) {
                if (node.variable) {
                    exportableNodes.push(node);
                }
            } else if (node instanceof tree.mixin.Definition) {
                exportableNodes.push(node);
            } else if (node instanceof tree.Ruleset && !node.root) {
                exportableNodes.push(node);
            }
        },
        {
            // only the top level stuff can be exported
            skipChildren: true,
        },
    );

    return exportableNodes;
}

export function getExportableNodeNames(context: tree.Node): Set<string> {
    const exportableNodes = getAllExportableNodes(context);
    const names = exportableNodes.map((node) => {
        if (node instanceof tree.Declaration) {
            if (typeof node.name === 'string') {
                return node.name;
            }
        } else if (node instanceof tree.mixin.Definition) {
            return node.name;
        } else if (node instanceof tree.Ruleset) {
            const rulesetName = getRulesetName(node);
            if (rulesetName) {
                return rulesetName;
            }
        }
        console.error(jsonSerializedNode(node));
        throw new Error(`Failed to extract node name from "${node.type}" type of node.`);
    });

    return new Set(names);
}
