import {getObjectTypedKeys} from 'augment-vir';
import {mappedNodeConstructors} from './node';

describe('mappedNodeConstructors', () => {
    it('should have real constructors', () => {
        getObjectTypedKeys(mappedNodeConstructors).forEach((nodeType) => {
            const constructor = mappedNodeConstructors[nodeType];
            expect(constructor).toBeDefined();
        });
    });
});
