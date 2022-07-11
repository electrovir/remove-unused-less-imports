export function flattenSets<T>(input: Set<T>[] | Set<Set<T>>): Set<T> {
    const sets: Set<T>[] = Array.isArray(input) ? input : Array.from(input);

    return new Set(sets.map((set) => Array.from(set)).flat());
}
