import {awaitedForEach} from 'augment-vir';
import {Options, tree} from 'less';
import {getNodeType, jsonSerializeNode} from '../augments/node';
import {collapseJsonWhiteSpace} from '../augments/string';
import {Constructor} from '../augments/type';
import {parseLess} from '../parse-less/parse';
import {walkLess} from '../parse-less/walk-less';

export type Assumption = {
    code: string;
    nodeConstructor: Constructor<tree.Node> | undefined | 'root';
    serialized: string;
    options?: Options | undefined;
    log?: true | undefined;
};

async function getFirstNodeOfType(
    codeToParse: string,
    nodeConstructor: Assumption['nodeConstructor'],
    options: Options,
): Promise<tree.Node | undefined> {
    let nodeToReturn: tree.Node | undefined;
    const parsedRoot = (await parseLess(codeToParse, options)).root;

    if (nodeConstructor === 'root') {
        return parsedRoot;
    }
    walkLess(parsedRoot, (node) => {
        // bypass the root node
        if (node instanceof tree.Ruleset && node.root) {
            return false;
        }
        if (nodeConstructor) {
            if (node instanceof nodeConstructor!) {
                nodeToReturn = node;
                return true;
            }
        } else {
            nodeToReturn = node as any;
            return true;
        }
        return false;
    });

    if (nodeConstructor && !nodeToReturn) {
        throw new Error(`Did not find node of type "${nodeConstructor.name}" in "${codeToParse}"`);
    }
    if (!nodeConstructor && nodeToReturn) {
        console.error(nodeToReturn);
        throw new Error(
            `Didn't expect to find any nodes but found "${nodeToReturn.type}" in "${codeToParse}"`,
        );
    }
    return nodeToReturn;
}

export async function testAssumptions(assumptions: Assumption[]) {
    expect.assertions(assumptions.length);

    await awaitedForEach(assumptions, async (assumption) => {
        const foundNode = await getFirstNodeOfType(
            assumption.code,
            assumption.nodeConstructor,
            assumption.options ?? {},
        );

        if (assumption.log && foundNode) {
            console.info({[getNodeType(foundNode)]: foundNode});
        }

        try {
            if (assumption.nodeConstructor && foundNode) {
                expect(collapseJsonWhiteSpace(jsonSerializeNode(foundNode, 0))).toBe(
                    collapseJsonWhiteSpace(assumption.serialized),
                );
            } else {
                expect(foundNode).toBeUndefined();
            }
        } catch (error) {
            const nodeType = foundNode == undefined ? undefined : getNodeType(foundNode);
            console.error(`Failed on node of type "${nodeType}"`);
            throw error;
        }
    });
}
