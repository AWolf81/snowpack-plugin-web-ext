import { existsSync, promises } from "fs";
import { relative as relativePath } from "path";
import webExt from "web-ext";
import { getConfig } from "./config";
import createManifest from "./templates/manifest";
import createWebextDefaultConfig from "./templates/web-ext-config";
const { writeFile, readFile, copyFile } = promises;
let runner = null;
let isProductionBuild = false;
const DEFAULT_BROWSER = "chromium";
const checkManifest = async (root = process.cwd(), buildOutDir) => {
    try {
        if (!existsSync(`${root}/manifest.json`)) {
            // no manifest file exists --> create a manifest.json
            const data = await readFile(`${root}/package.json`);
            const packageJson = JSON.parse(data.toString("utf-8"));
            const manifestContent = createManifest(packageJson);
            await writeFile(`${root}/manifest.json`, JSON.stringify(manifestContent, null, 2));
            console.log(`${root}/manifest.json was succesfully created!`);
        }
        // always copy the manifest from root folder to build (with overwrite)
        await copyFile(`${root}/manifest.json`, `${buildOutDir}/manifest.json`);
    }
    catch (err) {
        console.error(err);
    }
};
const checkWebExtConfig = async (root = process.cwd(), buildOutDir) => {
    try {
        if (!existsSync(`${root}/web-ext-config.js`) && !existsSync(`${root}/web-ext.config.js`)) {
            // no web-ext config file exists --> create a config file and show a log
            const relBuildDir = relativePath(root, buildOutDir);
            const webextConfig = createWebextDefaultConfig({ run: { target: DEFAULT_BROWSER }, sourceDir: relBuildDir });
            await writeFile(`${root}/web-ext-config.js`, `module.exports = \n${JSON.stringify(webextConfig, null, 2)}`);
            console.log(`${root}/web-ext-config.js was succesfully created!`);
        }
    }
    catch (err) {
        console.error(err);
    }
};
const plugin = () => ({
    name: "web-ext-snowpack-plugin",
    config(snowpackConfig) {
        const cwd = snowpackConfig?.installOptions?.cwd;
        const { out } = snowpackConfig?.buildOptions;
        // Check if there is a manifest.json (if not create a generic manifest in root directory)
        checkManifest(cwd, out);
        // Check if there is a config (if not create one and run chrome as default, just to have the file in place)
        checkWebExtConfig(cwd, out);
        isProductionBuild = (snowpackConfig.installOptions.env && snowpackConfig.installOptions.env["NODE_ENV"] === 'production');
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
