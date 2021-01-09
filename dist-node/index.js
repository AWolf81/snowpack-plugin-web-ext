'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var fs = require('fs');
var path = require('path');
var webExt = _interopDefault(require('web-ext'));
var process$1 = require('process');
var os = require('os');

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly) symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    });
    keys.push.apply(keys, symbols);
  }

  return keys;
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};

    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }

  return target;
}

const getCwdConfig = () => {
  const configPath = path.resolve(process$1.cwd(), "web-ext-config.js");
  let obj = null;

  try {
    obj = require(configPath);
  } catch (e) {
    return null;
  }

  return obj || null;
};

const getPackageJsonConfig = async () => {
  const packageJsonPath = path.resolve(process$1.cwd(), "package.json");
  let obj = null;

  try {
    const content = await fs.promises.readFile(packageJsonPath, {
      encoding: "utf8"
    });
    obj = JSON.parse(content);
  } catch (e) {
    return null;
  }

  return obj && obj.webExt ? obj.webExt : null;
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

const flatten = config => {
  // Merge global options and "run" options.
  // See "Global options" sections in https://extensionworkshop.com/documentation/develop/web-ext-command-reference/
  if (!config || Object.keys(config).length < 1) {
    return {};
  } // Intentionally omitted "help" and "version".


  const globalOptions = ["artifactsDir", "config", "configDiscovery", "noConfigDiscovery", "ignoreFiles", "noInput", "sourceDir", "verbose"];

  const ret = _objectSpread2({}, config.run);

  globalOptions.forEach(opt => {
    if (opt in config) {
      ret[opt] = config[opt];
    }
  });
  return ret;
};

const getConfig = async () => {
  const userHomeConfig = flatten(getUserHomeConfig());
  const packageJsonConfig = flatten(await getPackageJsonConfig());
  const cwdConfig = flatten(getCwdConfig());
  let config = Object.assign(userHomeConfig, packageJsonConfig);
  config = Object.assign(config, cwdConfig);

  if (config.noReload === undefined) {
    // default to noReload if nothing is defined in config
    config.noReload = true;
  }

  if (!config.sourceDir) {
    config.sourceDir = process$1.cwd();
  }

  config.sourceDir = path.resolve(config.sourceDir);
  return config;
};

const DEFAULT_MANIFEST = {
  "name": "my-web-extension",
  "version": "0.0.1",
  "description": "Add a brief description of your extension here...",
  "manifest_version": 2,
  "permissions": [],
  "minimum_chrome_version": "61",
  //"minimum_chrome_version": "88", // min for manifest version 3 (not ready yet 08.01.2021)
  "browser_action": {
    "default_popup": "index.html"
  },
  "background": {
    "scripts": [] // background scripts will be replaced by service worker in MV3
    // (see https://developer.chrome.com/docs/extensions/mv3/migrating_to_service_workers/)
    // background: {
    //   service_worker: ""
    // },

  },
  "content_scripts": [],
  "web_accessible_resources": []
};
var createManifest = (({
  name,
  version,
  description
}) => _objectSpread2(_objectSpread2({}, DEFAULT_MANIFEST), {}, {
  name,
  version,
  description
}));

var createWebextDefaultConfig = (({
  run: {
    target: browserTarget
  },
  sourceDir
}) => ({
  run: {
    target: Array.isArray(browserTarget) ? browserTarget : [browserTarget],
    noReload: false
  },
  sourceDir
}));

const {
  writeFile,
  readFile,
  copyFile
} = fs.promises;
let runner = null;
let isProductionBuild = false;
const DEFAULT_BROWSER = "chromium";

const checkManifest = async (root = process.cwd(), buildOutDir) => {
  try {
    if (!fs.existsSync(`${root}/manifest.json`)) {
      // no manifest file exists --> create a manifest.json
      const data = await readFile(`${root}/package.json`);
      const packageJson = JSON.parse(data.toString("utf-8"));
      const manifestContent = createManifest(packageJson);
      await writeFile(`${root}/manifest.json`, JSON.stringify(manifestContent, null, 2));
      console.log(`${root}/manifest.json was succesfully created!`);
    } // always copy the manifest from root folder to build (with overwrite)


    await copyFile(`${root}/manifest.json`, `${buildOutDir}/manifest.json`);
  } catch (err) {
    console.error(err);
  }
};

const checkWebExtConfig = async (root = process.cwd(), buildOutDir) => {
  try {
    if (!fs.existsSync(`${root}/web-ext-config.js`) && !fs.existsSync(`${root}/web-ext.config.js`)) {
      // no web-ext config file exists --> create a config file and show a log
      const relBuildDir = path.relative(root, buildOutDir);
      const webextConfig = createWebextDefaultConfig({
        run: {
          target: DEFAULT_BROWSER
        },
        sourceDir: relBuildDir
      });
      await writeFile(`${root}/web-ext-config.js`, `module.exports = \n${JSON.stringify(webextConfig, null, 2)}`);
      console.log(`${root}/web-ext-config.js was succesfully created!`);
    }
  } catch (err) {
    console.error(err);
  }
};

const plugin = () => ({
  name: "web-ext-snowpack-plugin",

  config(snowpackConfig) {
    var _snowpackConfig$insta;

    const cwd = snowpackConfig === null || snowpackConfig === void 0 ? void 0 : (_snowpackConfig$insta = snowpackConfig.installOptions) === null || _snowpackConfig$insta === void 0 ? void 0 : _snowpackConfig$insta.cwd;
    const {
      out
    } = snowpackConfig === null || snowpackConfig === void 0 ? void 0 : snowpackConfig.buildOptions; // Check if there is a manifest.json (if not create a generic manifest in root directory)

    checkManifest(cwd, out); // Check if there is a config (if not create one and run chrome as default, just to have the file in place)

    checkWebExtConfig(cwd, out);
    isProductionBuild = snowpackConfig.installOptions.env && snowpackConfig.installOptions.env["NODE_ENV"] === 'production';
  },

  async run() {
    var _runner;

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
      shouldExitProgram: true
    });
    (_runner = runner) === null || _runner === void 0 ? void 0 : _runner.registerCleanup(() => {
      runner = null;
    });
  }

});

exports.default = plugin;
//# sourceMappingURL=index.js.map
