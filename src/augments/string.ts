export function collapseJsonWhiteSpace(input: string): string {
    if (!input) {
        return '';
    }
    try {
        return JSON.stringify(JSON.parse(input));
    } catch (error) {
        console.error(`Failed to parse: "${input}"`);
        throw error;
    }
}
