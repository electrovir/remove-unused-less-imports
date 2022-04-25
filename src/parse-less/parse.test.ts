import {assertInstanceOf} from 'augment-vir/dist/jest-only';
import {render, tree} from 'less';
import {parseTestFiles} from '../test/test-file-paths';
import {parseLess, parseLessFile} from './parse';

const varName = '@myVar' as const;

describe(parseLess.name, () => {
    it('should extract a tree out of a string', async () => {
        const parseResult = await parseLess(`${varName}: blue;`);

        expect(parseResult).toBeDefined();
        expect(parseResult.root).toBeDefined();
        const firstRule = parseResult.root.rules[0];

        assertInstanceOf(firstRule, tree.Declaration);

        expect(firstRule.name).toBe(varName);
    });

    it('should extract a variable usage', async () => {
        const parseResult = await parseLess(`${varName}: blue; body {color: ${varName}}`);

        expect(parseResult.root).toBeDefined();
        const ruleSet = parseResult.root.rules[1];

        assertInstanceOf(ruleSet, tree.Ruleset);

        const rule = ruleSet.rules[0];
        assertInstanceOf(rule, tree.Declaration);

        const ruleValue = rule.value;
        assertInstanceOf(ruleValue, tree.Value);

        const valueValue = ruleValue.value[0];
        assertInstanceOf(valueValue, tree.Expression);

        const valueValueValue = valueValue.value[0];
        assertInstanceOf(valueValueValue, tree.Variable);

        expect(valueValueValue.name).toBe(varName);
    });
});

describe(render.name, () => {
    it('should fail when a var name is not defined', async () => {
        await expect(render(`body {color: ${varName}}`)).rejects.toThrow(
            `variable ${varName} is undefined`,
        );
    });
});

describe(parseLessFile.name, () => {
    it('should extract a tree out of a less file', async () => {
        const parseResult = await parseLessFile(parseTestFiles.simpleFile);

        expect(parseResult).toBeDefined();
        expect(parseResult.root).toBeDefined();
        const firstRule = parseResult.root.rules[0];

        assertInstanceOf(firstRule, tree.Declaration);

        expect(firstRule.name).toBe(varName);
    });
});
