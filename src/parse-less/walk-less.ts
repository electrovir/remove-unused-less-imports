import {tree} from 'less';

type WalkOptions = {
    /**
     * Defaults to false. If set to true, walkLess will iterate over all the .less files loaded
     * through @import, which is usually undesired. If you want to check those scripts, they should
     * probably get checked on their own instead.
     */
    walkImports?: boolean;
};

export function walkLess(
    node: tree.Node,
    callback: (node: tree.Node) => any,
    options: WalkOptions = {},
): boolean {
    if (callback(node)) {
        return true;
    }

    if (!options.walkImports && node instanceof tree.Import) {
        return false;
    }

    const children = getChildren(node);

    return children.some((child) => {
        return walkLess(child, callback);
    });
}

function getChildren(node: tree.Node): tree.Node[] {
    const children = new Set<tree.Node>();
    insertNodeChildren(node, children, undefined);
    return Array.from(children);
}

/** These property names point upwards in the AST so if we traverse them we will get stuck in an infinite loop */
const circularReferenceKeys: Readonly<Set<string>> = new Set(['parent']);

/** Mutates the given "allNodes" set, inserting all the child nodes it finds into that set */
function insertNodeChildren(node: tree.Node, allNodes = new Set<tree.Node>(), parent?: tree.Node) {
    function shouldAddChild(child: any): child is tree.Node {
        return (
            child instanceof tree.Node && child !== node && child !== parent && !allNodes.has(child)
        );
    }

    getAllProperties(node).forEach((key) => {
        if (circularReferenceKeys.has(key)) {
            return;
        }

        const propertyValue = node[key];
        if (propertyValue) {
            if (shouldAddChild(propertyValue)) {
                allNodes.add(propertyValue);
            } else if (Array.isArray(propertyValue)) {
                const innerNodes: tree.Node[] = propertyValue.filter(
                    (value) => value instanceof tree.Node,
                );
                if (innerNodes.length) {
                    innerNodes.forEach((innerNode) => {
                        if (shouldAddChild(innerNode)) {
                            allNodes.add(innerNode);
                        }
                    });
                }
            }
        }
    });
}

/**
 * Less.js isn't type safe and does funny things so there's no way to be sure that there aren't
 * random properties with children nodes. Thus, instead of hard-coding in the properties to check
 * we're just checking all of them.
 */
function getAllProperties(node: tree.Node): (keyof tree.Node)[] {
    const keys = new Set<keyof tree.Node>(Object.keys(node) as (keyof tree.Node)[]);
    const prototype = Object.getPrototypeOf(node);

    if (prototype instanceof tree.Node) {
        getAllProperties(prototype).forEach((property) => keys.add(property));
    }

    return Array.from(keys);
}
