export default {
    "manifest_version": 2,
    "name": "{{name}}",
    "version": "{{version}}",
    "description": "{{description}}",
    "permissions": [
      "active_tab"
    ],
    "minimum_chrome_version": "61", // dynamic imports
    //"minimum_chrome_version": "88", // min for manifest version 3 (not ready yet 08.01.2021)
    "browser_action": {
      "default_icon": "icon.png",
      "default_popup": "index.html"
    },
    "background": {
      "scripts": []
      // background scripts will be replaced by service worker in MV3
      // (see https://developer.chrome.com/docs/extensions/mv3/migrating_to_service_workers/)
      // background: {
      //   service_worker: ""
      // },
    },
    "content_scripts": [],
    "web_accessible_resources": []
  }