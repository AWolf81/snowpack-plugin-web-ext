import getWebextConfig, {DEFAULT_WEBEXTCONFIG} from './web-ext-config';
import {expect} from 'chai';
import 'mocha';

describe('webext config generation', () => {
  it('should load default config', () => {
    expect(getWebextConfig(DEFAULT_WEBEXTCONFIG)).to.deep.equal(DEFAULT_WEBEXTCONFIG);
  });
  it('should target multiple browsers', () => {
    const browsers = ['chromium', 'firefox-desktop'];
    expect(
      getWebextConfig({
        run: {
          target: browsers,
        },
        sourceDir: 'build',
      }),
    ).to.deep.equal({
      run: {
        target: browsers,
        noReload: false,
      },
      sourceDir: 'build',
    });
  });
  it('should target single browser', () => {
    const browser = 'chromium';
    expect(
      getWebextConfig({
        run: {
          target: browser,
        },
        sourceDir: 'build',
      }),
    ).to.deep.equal({
      run: {
        target: [browser], // added brackets
        noReload: false,
      },
      sourceDir: 'build',
    });
  });
});
