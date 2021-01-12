import {JSONSchemaForNPMPackageJsonFiles} from '@schemastore/package';

export const DEFAULT_MANIFEST = {
  name: 'my-web-extension',
  version: '0.0.1', // @todo: we could check if we're finding a git version tag
  description: 'Add a brief description of your extension here...',
  manifest_version: 2,
  permissions: [],
  minimum_chrome_version: '61', // dynamic imports
  //"minimum_chrome_version": "88", // min for manifest version 3 (not ready yet 08.01.2021)
  browser_action: {
    default_popup: 'index.html',
  },
  background: {
    scripts: [],
    // background scripts will be replaced by service worker in MV3
    // (see https://developer.chrome.com/docs/extensions/mv3/migrating_to_service_workers/)
    // background: {
    //   service_worker: ""
    // },
  },
  content_scripts: [],
  web_accessible_resources: [],
};

export type ManifestType = typeof DEFAULT_MANIFEST;

export default (data: JSONSchemaForNPMPackageJsonFiles): ManifestType => {
  const manifestKeys: Array<string> = Object.keys(DEFAULT_MANIFEST);
  const manifestInput = Object.keys(data)
    .filter((key) => manifestKeys.indexOf(key) !== -1)
    .reduce((obj, k) => (obj = {...obj, [k]: data[k]}), {});

  return {
    ...DEFAULT_MANIFEST,
    ...manifestInput,
  };
};
