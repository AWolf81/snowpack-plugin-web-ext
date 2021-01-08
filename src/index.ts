import { existsSync, promises } from "fs";
import { relative as relativePath } from "path";
import type { SnowpackConfig, SnowpackPluginFactory } from "snowpack";
import webExt from "web-ext";
import parse from "json-templates";

import { getConfig } from "./config";
import manifestTemplate from "./templates/manifest";
import webextDefaultConfigTemplate from "./templates/web-ext-config";

const { writeFile, readFile, copyFile } = promises;

let runner: { 
  reloadAllExtensions: () => void; 
  registerCleanup: (cb: Function) => void;
} | null = null;

let isProductionBuild = false;

// package.json could be with-out name, key or version values (need a fallback)
const DEFAULT_MANIFEST_DATA = {
  name: "my-web-extension",
  version: "0.0.1", // @todo: we could check if we're finding a git version tag
  description: "Add a brief description of your extension here..."
};

const DEFAULT_BROWSER = "chromium";

const checkManifest = async (root = process.cwd(), buildOutDir: string ) => {
  try {
    if (!existsSync(`${root}/manifest.json`)) {
      // no manifest file exists --> create a manifest.json
      const manifest = parse(manifestTemplate); // create template from raw file
      const data = await readFile(`${root}/package.json`);

      const packageJson = {
        ...DEFAULT_MANIFEST_DATA,
        ...JSON.parse(data.toString("utf-8")), 
      };

      const manifestContent = manifest(packageJson);

      await writeFile(`${root}/manifest.json`, JSON.stringify(manifestContent, null, 2)); 
      console.log(`${root}/manifest.json was succesfully created!`);
    }

    // always copy the manifest from root folder to build (with overwrite)
    await copyFile(`${root}/manifest.json`, `${buildOutDir}/manifest.json`);
  } catch(err) {
    console.error(err)
  }
}

const checkWebExtConfig = async (root = process.cwd(), buildOutDir: string) => {
  try {
    if (!existsSync(`${root}/web-ext-config.js`) && !existsSync(`${root}/web-ext.config.js`)) {
      // no web-ext config file exists --> create a config file and show a log
      const webextDefaultConfig = parse(webextDefaultConfigTemplate); // create template from raw file
      const relBuildDir = relativePath(root, buildOutDir);
      const webextConfig = webextDefaultConfig({browserTarget: DEFAULT_BROWSER, sourceDir: relBuildDir});
      
      await writeFile(`${root}/web-ext-config.js`, `module.exports = \n${JSON.stringify(webextConfig, null, 2)}`);
      console.log(`${root}/web-ext-config.js was succesfully created!`);
    }
  } catch(err) {
    console.error(err)
  }
}

const plugin: SnowpackPluginFactory = () => ({
  name: "web-ext-snowpack-plugin",
  config(snowpackConfig:SnowpackConfig) {
    const cwd = snowpackConfig?.installOptions?.cwd;
    const { out } = snowpackConfig?.buildOptions;

    // Check if there is a manifest.json (if not create a generic manifest in root directory)
    checkManifest(cwd, out);
    // Check if there is a config (if not create one and run chrome as default, just to have the file in place)
    checkWebExtConfig(cwd, out);
    isProductionBuild = <boolean>(snowpackConfig.installOptions.env && snowpackConfig.installOptions.env["NODE_ENV"] === 'production');
  },
  async run() {
    // Note: Snowpack is ready with the files we're already in 'on("bundled")'
    // @todo: Parcel web-ext plugin is bailing if watch mode is disabled. Is it required?

    const config = await getConfig();

    console.info("Web-ext started...");

    if (isProductionBuild) {
      // build for production
      await webExt.cmd.build(config, {
        sourceDir: "build"
      });
      return;
    }
    
    if (runner) {
      runner.reloadAllExtensions();
      return;
    }

    runner = await webExt.cmd.run(config, {
      shouldExitProgram: true,
    });

    runner?.registerCleanup(() => {
      runner = null;
    });
  }
});

export default plugin;