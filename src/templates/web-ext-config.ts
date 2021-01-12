// used to generate a web-ext-config.js (if there is no file in root)

export type WebExtDefaultConfig = {
  run: {
    target: Array<string> | string;
    noReload?: boolean;
  };
  sourceDir: string;
};

export const DEFAULT_WEBEXTCONFIG: WebExtDefaultConfig = {
  run: {
    target: ['chromium'],
    noReload: false,
  },
  sourceDir: './',
};

export default ({run: {target: browserTarget}, sourceDir}: WebExtDefaultConfig) => ({
  run: {
    target: Array.isArray(browserTarget) ? browserTarget : [browserTarget],
    noReload: false,
  },
  sourceDir,
});
