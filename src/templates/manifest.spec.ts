import getManifest, {DEFAULT_MANIFEST} from './manifest';
import {expect} from 'chai';
import 'mocha';

describe('manifest generation', () => {
  const testManifestPart = `{
    "name": "my-awesome-extension",
    "version": "1.0.1",
    "description": "Awesome extension!"
  }`;
  const testPackageJson = `{
    "name": "my-awesome-extension",
    "version": "1.0.1",
    "description": "Awesome extension!",
    "devDependencies": {
        "react": "latest"
    },
    "something-else": {
        "even": {
            "nested": "key-values"
        }
    },
    "scripts": {
        "test": "mocha"
    }
  }`;

  it('should generate with-out invalid props from package.json e.g. devDependencies', () => {
    const packageJson = JSON.parse(testPackageJson);
    const manifest = getManifest(packageJson);
    expect(manifest).to.not.have.property('devDependencies');
    expect(manifest).to.not.have.property('something-else');

    expect(manifest).to.deep.equal({
      ...DEFAULT_MANIFEST,
      ...JSON.parse(testManifestPart),
    });
  });
});
