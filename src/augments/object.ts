import {getObjectTypedKeys} from 'augment-vir';

export function incrementProps<
    T extends Readonly<Record<PropertyKey, number>>,
    U extends Partial<T>,
>(originalCounts: T, incrementThesePropsByThisMuch: U): T {
    const incremented = getObjectTypedKeys(incrementThesePropsByThisMuch).reduce(
        (summation: typeof incrementThesePropsByThisMuch, currentKey) => {
            if (currentKey in summation) {
                const originalCount: number | undefined = originalCounts[currentKey];
                if (originalCount == undefined) {
                    throw new Error(`"${currentKey}" not found in originalCounts input.`);
                }
                const increaseAmount: number = summation[currentKey] ?? 0;
                summation[currentKey] = (originalCount + increaseAmount) as U[keyof U];
            }
            return summation;
        },
        {...incrementThesePropsByThisMuch},
    );
    const increasedCounts: T = {...originalCounts, ...incremented};

    return increasedCounts;
}

export function createTypedConst<T, U extends T>(input: U): U {
    return input;
}
