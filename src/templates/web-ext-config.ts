// used to generate a web-ext-config.js (if there is no file in root)
export default {
    run: {
      target: ["{{browserTarget}}"]
    },
    "sourceDir": "{{sourceDir}}"
};