# Web-ext snowpack plugin

**Note:** This is a pretty alpha version of the plugin and it's very likely that I have to do larger changes.

[Snowpack](https://www.snowpack.dev/) plugin to use [web-ext](https://www.npmjs.com/package/web-ext) for creating web extensions for Chrome and Firefox.

The plugin is pretty similar to the [Parcel.js plugin](https://github.com/mmktomato/parcel-plugin-web-ext-tool) - many thanks to the creator.

I'm not using Parcel as I had issues to setup CSS modules with Typescript. Then I've noticed that in latest Chrome or Firefox dynamic imports are directly supported and it should work with-out a bundler.

## How does it work?
The plugin checks if there is a `web-ext-config.js` and a `manifest.json` in the root of the project.
If it's missing it will generate these files.
It also copies the `manifest.json` to the build directory. So we can use the Snowpack build directory for web-ext to load the extension.

## Development of the plugin
- `npm run build`: Build the template
- `npm run deploy`: Publish the template to npm

# How to use it in a project?
Install it as dependency with `npm install -D snowpack-plugin-web-ext` and add it to your `snowpack.config.js` into the plugins with 
```
/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
  /* other config */
  plugins: [
    /* other plugins */
    "snowpack-plugin-web-ext"
  ]
}
```

We need to start the dev server with `snowpack build --watch` instead of `snowpack dev` as we have to generate the build directory for web-ext. Change the dev script in your `package.json` to `snowpack build --watch`

# Example app
You can find an example with the plugin in the following repo https://github.com/AWolf81/snowpack-chrome-preact-popup-demo.

# Licence
MIT