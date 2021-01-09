// used to generate a web-ext-config.js (if there is no file in root)
type WebExtDefaultConfig = {
  run: {
    target: Array<string>|string,
    noReload?: boolean
  };
  sourceDir: string;
};

export default ({run: { target: browserTarget}, sourceDir}: WebExtDefaultConfig) => ({
    run: {
      target: Array.isArray(browserTarget) ? browserTarget : [browserTarget],
      noReload: false
    },
    sourceDir
});