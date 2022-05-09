import {NodeType, tree} from 'less';
import {getNodeType} from '../augments/node';
import {walkLess} from './walk-less';

export function getAllExportableNodes(context: tree.Node): tree.Node[] {
    const exportableNodes: tree.Node[] = [];

    walkLess(context, (node) => {
        const nodeType: NodeType = getNodeType(node);

        if (nodeType === NodeType.Declaration) {
        }
    });

    return exportableNodes;
}
