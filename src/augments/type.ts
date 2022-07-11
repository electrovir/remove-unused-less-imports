export type Constructor<T> = new (...args: any[]) => T;

/**
 * This function returns another function that simply returns whatever input it's given. However, it
 * also checks that the input matches the original wrapTypeWithReadonly's generic, while maintaining
 * strict "const" like typing.
 */
export function wrapTypeWithReadonly<P>() {
    return <T extends P>(input: T): Readonly<T> => {
        return input;
    };
}

export type AsTuple<T extends Readonly<any[]> & (number extends T['length'] ? never : unknown)> =
    Pick<T, Exclude<keyof T, keyof Array<any>>>;

export type ConstructorReturnType<T> = T extends new () => infer R ? R : never;
