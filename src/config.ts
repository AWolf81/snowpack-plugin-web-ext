// source from https://github.com/mmktomato/parcel-plugin-web-ext-tool/blob/master/src/config.js

import * as process from "process";
import * as path from "path";
import {promises as fsPromise} from "fs";
import * as os from "os";

// https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/#automatic-discovery-of-configuration-files

const getCwdConfig = () => {
  const configPath = path.resolve(process.cwd(), "web-ext-config.js");
  let obj = null;

  try {
    obj = require(configPath);
  } catch (e) {
    return null;
  }

  return obj || null;
};

const getPackageJsonConfig = async () => {
  const packageJsonPath = path.resolve(process.cwd(), "package.json");
  let obj = null;

  try {
    const content = await fsPromise.readFile(packageJsonPath, { encoding: "utf8" });
    obj = JSON.parse(content);
  } catch (e) {
    return null;
  }

  return (obj && obj.webExt) ? obj.webExt : null;
};

const getUserHomeConfig = () => {
  const configPath = path.resolve(os.homedir(), ".web-ext-config.js");
  let obj = null;

  try {
    obj = require(configPath);
  } catch (e) {
    return null;
  }

  return obj || null;
};

type ConfigType = {
  artifactsDir?: string;
  config?: string;
  configDiscovery?: boolean;
  noConfigDiscovery?: boolean;
  ignoreFiles?: Array<string>;
  noInput?: boolean;
  sourceDir?: string;
  verbose?: boolean;
  // callback def
  run?: () => void;

  // index signature
  [key: string]: any;
};

const flatten = (config: ConfigType) => {
  // Merge global options and "run" options.
  // See "Global options" sections in https://extensionworkshop.com/documentation/develop/web-ext-command-reference/

  if (!config || Object.keys(config).length < 1) {
    return {};
  }

  // Intentionally omitted "help" and "version".
  const globalOptions = [
    "artifactsDir", "config", "configDiscovery", "noConfigDiscovery", "ignoreFiles", "noInput", "sourceDir", "verbose"
  ];

  const ret:ConfigType = { ...config.run };

  globalOptions.forEach(opt => {
    if (opt in config) {
      ret[opt] = config[opt];
    }
  });

  return ret;
};

export const getConfig = async () => {
  const userHomeConfig = flatten(getUserHomeConfig());
  const packageJsonConfig = flatten(await getPackageJsonConfig());
  const cwdConfig = flatten(getCwdConfig());

  let config:ConfigType = Object.assign(userHomeConfig, packageJsonConfig);
  config = Object.assign(config, cwdConfig);

  if (config.noReload === undefined) {
    // default to noReload if nothing is defined in config
    config.noReload = true;
  }
  if (!config.sourceDir) {
    config.sourceDir = process.cwd();
  }
  config.sourceDir = path.resolve(config.sourceDir);

  return config;
};
