declare type WebExtDefaultConfig = {
    run: {
        target: Array<string> | string;
        noReload?: boolean;
    };
    sourceDir: string;
};
declare const _default: ({ run: { target: browserTarget }, sourceDir }: WebExtDefaultConfig) => {
    run: {
        target: string[];
        noReload: boolean;
    };
    sourceDir: string;
};
export default _default;
