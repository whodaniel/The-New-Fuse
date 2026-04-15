export let presets: (string | (string | {
    targets: {
        node: string;
    };
})[])[];
export let plugins: ((string | {
    legacy: boolean;
})[] | (string | {
    loose: boolean;
})[])[];
