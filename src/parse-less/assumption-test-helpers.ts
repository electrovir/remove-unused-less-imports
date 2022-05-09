import {awaitedForEach} from 'augment-vir';
import {tree} from 'less';
import {getNodeType, jsonSerializedNode} from '../augments/node';
import {collapseJsonWhiteSpace} from '../augments/string';
import {Constructor} from '../augments/type';
import {parseLess} from './parse';
import {walkLess} from './walk-less';

export type Assumption = {
    code: string;
    nodeConstructor: Constructor<tree.Node> | undefined;
    serialized: string;
    log?: true;
};

async function getFirstNodeOfType<T extends tree.Node | undefined>(
    codeToParse: string,
    nodeConstructor: T extends undefined ? undefined : Constructor<T>,
): Promise<T> {
    let nodeToReturn: T | undefined;

    walkLess((await parseLess(codeToParse)).root, (node) => {
        // bypass the root node
        if (node instanceof tree.Ruleset && node.root) {
            return false;
        }
        if (nodeConstructor) {
            if (node instanceof nodeConstructor!) {
                nodeToReturn = node as T;
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
    return nodeToReturn as T;
}

export async function testAssumptions(assumptions: Assumption[]) {
    expect.assertions(assumptions.length);

    await awaitedForEach(assumptions, async (assumption) => {
        const foundNode = await getFirstNodeOfType<any>(
            assumption.code,
            assumption.nodeConstructor,
        );

        if (assumption.log) {
            console.info({[foundNode.type]: foundNode});
        }

        try {
            if (assumption.nodeConstructor) {
                expect(collapseJsonWhiteSpace(jsonSerializedNode(foundNode, 0))).toBe(
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
