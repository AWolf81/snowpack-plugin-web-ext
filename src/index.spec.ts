import {PluginRunOptions, SnowpackConfig, SnowpackPlugin} from 'snowpack';
import * as path from 'path';

// @todo reloadAll & cleanup mock needed later
// const reloadAllExtensions = jest.fn();
// const registerCleanup = jest.fn();
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

describe('Snowpack web-ext plugin', () => {
  const testSnowpackConfig = {
    installOptions: {
      cwd: process.cwd(),
    },
    buildOptions: {
      out: 'build',
    },
  } as SnowpackConfig;
  // const sandbox = sinon.createSandbox();
  let plugin: SnowpackPlugin;

  // helper to start plugin
  const startPlugin = async (snowpackConfig: SnowpackConfig = testSnowpackConfig) => {
    const runOptions = {} as PluginRunOptions;
    plugin = snowpackWebExtPlugin(snowpackConfig);
    if (plugin.config) {
      await plugin.config(snowpackConfig);
    }
    if (plugin.run) {
      await plugin.run(runOptions);
    }
  };

  beforeAll(() => {
    // we need to create output folder as we're not running snowpack
    const createDir = async () => {
      await mkdir('./build', {recursive: true});
    };
    createDir();
  });

  it('should set cwd as default root for getManifest getWebExtconfig', async () => {
    console.log('check cwd', process.cwd());
    const manifestFile = path.normalize(path.join(process.cwd(), 'manifest.json'));
    const webextConfigFile = path.normalize(path.join(process.cwd(), 'web-ext-config.js'));

    await startPlugin({
      ...testSnowpackConfig,
      installOptions: {
        ...testSnowpackConfig.installOptions,
        cwd: undefined,
      },
    });
    expect((writeFile as jest.Mock).mock.calls[0]).toEqual(
      expect.arrayContaining([expect.stringContaining(manifestFile), expect.anything()]),
    );
    expect((writeFile as jest.Mock).mock.calls[1]).toEqual(
      expect.arrayContaining([expect.stringContaining(webextConfigFile), expect.anything()]),
    );
  });

  /*it('should reload all extensions on repeated call', async () => {
    await startPlugin(); // run

    expect(reloadAllExtensions).not.toHaveBeenCalled();
    console.log('start plugin', startPlugin);
    await startPlugin(); // run again
    expect(reloadAllExtensions).toHaveBeenCalled();
  });*/

  describe('Check run & build', () => {
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

    /*
    // cleanup test not working yet
    it('should clear runner on register cleanup', async () => {
      expect(runner).toBeDefined(); // we're having a runner
      if (runner) await runner.exit();
      expect(runner).toBeUndefined(); // cleanup called
    });
    */
  });
});
