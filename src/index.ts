import {existsSync, promises} from 'fs';
import {relative as relativePath, join as pathJoin} from 'path';
import type {SnowpackConfig, SnowpackPluginFactory} from 'snowpack';
import * as webExt from 'web-ext';
import type {JSONSchemaForNPMPackageJsonFiles} from '@schemastore/package';

import {getConfig} from './config';
import createManifest from './templates/manifest';
import createWebextDefaultConfig from './templates/web-ext-config';

const {writeFile, readFile, copyFile} = promises;

type ExtensionRunnerType = {
  reloadAllExtensions: () => void;
  registerCleanup: (cb: () => void) => void;
  exit(): Promise<void>;
} | null;

export let runner: ExtensionRunnerType = null;

export let isProductionBuild = false;

export const DEFAULT_BROWSER = 'chromium';

export const checkManifest = async (root = process.cwd(), buildOutDir: string): Promise<void> => {
  try {
    if (!existsSync(`${root}/manifest.json`)) {
      // no manifest file exists --> create a manifest.json
      const data = await readFile(pathJoin(root, 'package.json'));
      const packageJson: JSONSchemaForNPMPackageJsonFiles = JSON.parse(data.toString('utf-8'));
      const manifestContent = createManifest(packageJson);

      await writeFile(pathJoin(root, 'manifest.json'), JSON.stringify(manifestContent, null, 2));
      console.log(`${root}/manifest.json was succesfully created!`);
    }

    // always copy the manifest from root folder to build (with overwrite)
    await copyFile(`${root}/manifest.json`, `${buildOutDir}/manifest.json`);
  } catch (err) {
    console.error(err);
  }
};

export const checkWebExtConfig = async (
  root = process.cwd(),
  buildOutDir: string,
): Promise<void> => {
  try {
    if (!existsSync(`${root}/web-ext-config.js`) && !existsSync(`${root}/web-ext.config.js`)) {
      // no web-ext config file exists --> create a config file and show a log
      const relBuildDir = relativePath(root, buildOutDir);
      const webextConfig = createWebextDefaultConfig({
        run: {target: DEFAULT_BROWSER},
        sourceDir: relBuildDir,
      });

      await writeFile(
        pathJoin(root, 'web-ext-config.js'),
        `module.exports = \n${JSON.stringify(webextConfig, null, 2)}`,
      );
      console.log(`${root}/web-ext-config.js was succesfully created!`);
    }
  } catch (err) {
    console.error(err);
  }
};

const plugin: SnowpackPluginFactory = () => ({
  name: 'web-ext-snowpack-plugin',
  async config(snowpackConfig: SnowpackConfig) {
    const cwd = snowpackConfig?.installOptions?.cwd;
    const {out} = snowpackConfig?.buildOptions;

    // Check if there is a manifest.json (if not create a generic manifest in root directory)
    await checkManifest(cwd, out);
    // Check if there is a config (if not create one and run chrome as default, just to have the file in place)
    await checkWebExtConfig(cwd, out);
    isProductionBuild = <boolean>(
      (snowpackConfig.installOptions.env &&
        snowpackConfig.installOptions.env['NODE_ENV'] === 'production')
    );
  },
  async run() {
    // Note: Snowpack is ready with the files we're already in 'on("bundled")'
    // @todo: Parcel web-ext plugin is bailing if watch mode is disabled. Is it required?

    const config = await getConfig();

    console.info('Web-ext started...');

    if (isProductionBuild) {
      // build for production
      await webExt.cmd.build(config, {
        sourceDir: 'build',
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
  },
});

export default plugin;
