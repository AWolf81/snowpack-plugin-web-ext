import getWebextConfig, {DEFAULT_WEBEXTCONFIG} from './web-ext-config';

describe('webext config generation', () => {
  it('should load default config', () => {
    expect(getWebextConfig(DEFAULT_WEBEXTCONFIG)).toStrictEqual(DEFAULT_WEBEXTCONFIG);
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
    ).toStrictEqual({
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
    ).toStrictEqual({
      run: {
        target: [browser], // added brackets
        noReload: false,
      },
      sourceDir: 'build',
    });
  });
});
