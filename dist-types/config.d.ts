declare type ConfigType = {
    artifactsDir?: string;
    config?: string;
    configDiscovery?: boolean;
    noConfigDiscovery?: boolean;
    ignoreFiles?: Array<string>;
    noInput?: boolean;
    sourceDir?: string;
    verbose?: boolean;
    run?: () => void;
    [key: string]: any;
};
export declare const getConfig: () => Promise<ConfigType>;
export {};
