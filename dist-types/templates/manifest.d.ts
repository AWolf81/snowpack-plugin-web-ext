declare const DEFAULT_MANIFEST: {
    name: string;
    version: string;
    description: string;
    manifest_version: number;
    permissions: never[];
    minimum_chrome_version: string;
    browser_action: {
        default_popup: string;
    };
    background: {
        scripts: never[];
    };
    content_scripts: never[];
    web_accessible_resources: never[];
};
declare type ManifestType = typeof DEFAULT_MANIFEST;
declare const _default: ({ name, version, description }: ManifestType) => {
    name: string;
    version: string;
    description: string;
    manifest_version: number;
    permissions: never[];
    minimum_chrome_version: string;
    browser_action: {
        default_popup: string;
    };
    background: {
        scripts: never[];
    };
    content_scripts: never[];
    web_accessible_resources: never[];
};
export default _default;
