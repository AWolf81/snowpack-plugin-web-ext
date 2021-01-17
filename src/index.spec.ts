import {PluginRunOptions, SnowpackConfig, SnowpackPlugin} from 'snowpack';

const reloadAllExtensions = jest.fn();

jest.mock('chrome-launcher'); // mock chrome so it's not starting
jest.mock('web-ext'); // // important: mock before import

jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  return {
    ...actualFs,
    promises: {
      ...actualFs.promises,
      writeFile: jest.fn(),
      copyFile: jest.fn(),
    },
    existsSync: jest.fn().mockReturnValue(false),
  };
});

jest.mock('./templates/manifest.ts');
jest.mock('./templates/web-ext-config.ts');

import {promises} from 'fs';
import * as webExt from 'web-ext';
import snowpackWebExtPlugin from './index';
import createManifest from './templates/manifest';
import createWebextDefaultConfig from './templates/web-ext-config';

import {getConfig} from './config';

const {mkdir, writeFile, copyFile} = promises;

// jest.spyOn(webExt.cmd, 'run').mockResolvedValue({
//   // registerCleanup: webExtActual.cmd.run.registerCleanup,
//   reloadAllExtensions,
// });

describe('Snowpack web-ext plugin', () => {
  const testSnowpackConfig = {
    installOptions: {
      cwd: './',
    },
    buildOptions: {
      out: 'build',
    },
  } as SnowpackConfig;
  // const sandbox = sinon.createSandbox();
  let plugin: SnowpackPlugin;

  // helper to start plugin
  const startPlugin = async (snowpackConfig: SnowpackConfig = testSnowpackConfig) => {
    let runner;
    const runOptions = {} as PluginRunOptions;
    plugin = snowpackWebExtPlugin(snowpackConfig);
    if (plugin.config) {
      await plugin.config(snowpackConfig);
    }
    if (plugin.run) {
      runner = await plugin.run(runOptions);
    }
    return runner;
  };

  beforeAll(() => {
    // we need to create output folder as we're not running snowpack
    const createDir = async () => {
      await mkdir('./build', {recursive: true});
    };
    createDir();
  });

  beforeEach(async () => {
    await startPlugin();
  });

  it('should call web-ext `run` cmd', async () => {
    const config = await getConfig(); // @todo getConfig needs to be tested separately - just check that it is passed here

    expect(webExt.cmd.run).toHaveBeenCalledWith(config, expect.any(Object));
  });

  it('should call web-ext `build` cmd', async () => {
    const productionConfig = {
      ...testSnowpackConfig,
      installOptions: {
        ...testSnowpackConfig.installOptions,
        env: {
          NODE_ENV: 'production',
        },
      },
    };
    await startPlugin(productionConfig);

    const config = await getConfig(); // getConfig needs to be tested separately - just check that it is passed here
    expect(webExt.cmd.build).toHaveBeenCalledWith(config, expect.any(Object));
  });

  it('should generate manifest & webext', async () => {
    // two template calls happend?
    expect(createManifest).toHaveBeenCalled();
    expect(createWebextDefaultConfig).toHaveBeenCalled();
    // Both files written?
    expect(writeFile).toHaveBeenCalledTimes(2);
    // finally copy called for manifest to build folder copying
    expect(copyFile).toHaveBeenCalled();
  });

  xit('should reload all extensions on repeated call', async () => {
    expect(reloadAllExtensions).not.toHaveBeenCalled();
    console.log('start plugin', startPlugin);
    await startPlugin(); // run again
    console.log('started', reloadAllExtensions.mock.calls);
  });

  /*
  // cleanup test not working yet
  it('should clear runner on register cleanup', async () => {
    expect(runner).toBeDefined(); // we're having a runner
    if (runner) await runner.exit();
    expect(runner).toBeUndefined(); // cleanup called
  });
  */
});
