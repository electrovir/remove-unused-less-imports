import {NodeType, tree} from 'less';
import {isOfNodeType} from '../augments/node';
import {walkLess} from '../parse-less/walk-less';
import {getExportableNodeNames} from './extract-all-exportable';

export function getAllImports(context: tree.Ruleset) {
    const imports: tree.Import[] = [];

    walkLess(context, (node) => {
        if (isOfNodeType(node, NodeType.Import)) {
            imports.push(node);
        }
    });

    return imports;
}

export type AvailableImport = {
    node: tree.Import;
    names: Set<string>;
};

export function getAvailableImports(context: tree.Ruleset): AvailableImport[] {
    const importNodes = getAllImports(context);

    return importNodes.map((importNode) => {
        const names = getExportableNodeNames(importNode.root);
        return {
            names,
            node: importNode,
        };
    });
}
