import {Overwrite} from 'augment-vir';
import {NodeType, tree} from 'less';
import {
    allNodeTypes,
    getNodeType,
    jsonSerializeNode,
    mappedNodeConstructors,
    testAllNodeConstructors,
} from '../augments/node';
import {walkLess} from '../parse-less/walk-less';

type ExportableNode = tree.Declaration | tree.Ruleset | tree.mixin.Definition;

function getExportableRulesetNames(node: tree.Ruleset): string[] {
    if (node.selectors) {
        /**
         * Selectors with more than one element are not valid mixins or namespaces and thus are not
         * exportable and can be completely ignored.
         */
        const selectorsWithOnlyOneElement = node.selectors.filter(
            (selector): selector is Overwrite<tree.Selector, {elements: [tree.Element]}> =>
                selector.elements.length === 1,
        );

        const selectorNames = selectorsWithOnlyOneElement.map((selector) => {
            return selector.elements[0].value;
        });

        const exportableSelectorNames = selectorNames.filter(
            (selectorName) =>
                // only id or class selectors can be used as mixins and thus exported
                !!selectorName.match(/^\.|^#/),
        );

        return exportableSelectorNames;
    }
    return [];
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

/** Gets all variable, mixin, etc. names that COULD be exported */
export function getExportableNodeNames(context: tree.Node): Set<string> {
    const exportableNodes = getAllExportableNodes(context);
    const names: string[] = exportableNodes
        .map((node): string | string[] => {
            if (node instanceof tree.Declaration) {
                if (typeof node.name === 'string') {
                    return node.name;
                }
            } else if (node instanceof tree.mixin.Definition) {
                return node.name;
            } else if (node instanceof tree.Ruleset) {
                const rulesetName = getExportableRulesetNames(node);
                if (rulesetName) {
                    return rulesetName;
                }
            }
            console.error(jsonSerializeNode(node));
            throw new Error(`Failed to extract node name from "${node.type}" type of node.`);
        })
        .flat();

    return new Set(names);
}
