#!/usr/bin/env node

'use strict';

let fs = require('fs');
let readline = require('readline');
let _exec = require('child_process').execSync;
let path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const BOWER_CONFIG = path.resolve(PROJECT_ROOT, 'bower.json');
const NPM_CONFIG = path.resolve(PROJECT_ROOT, 'package.json');

let exec = (command) => {
  console.log(
    _exec(command, { encoding: 'utf8' })
  );
}

let ask = (question, callback) => {
  let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question(question, (answer) => {
    rl.close();
    callback(answer);
  });
};

let currentPackageVersion = () => {
  return require(NPM_CONFIG).version;
};

let validateSemver = (version) => {
  if (!/^[0-9]\.[0-9]+\.[0-9](-.+)?/.test(version)) {
    throw `Version ${version} is not valid! It must be a valid semver string like 1.0.2 or 2.3.0-beta.1`;
  }
};

let updateSemver = (filename, version) => {
  let json = require(filename);
  let currentVersion = json.version;

  json.version  = version;
  fs.writeFileSync(filename, JSON.stringify(json, null, 2));

  console.log(`Version updated: ${currentVersion} => ${version}`);
};

let release = (version) => {
  validateSemver(version);

  console.log('Build...');
  exec('npm run dist');

  console.log('Running tests...');
  exec('npm test');

  console.log('Updating package.json...');
  updateSemver(NPM_CONFIG, version);

  console.log('Updating bower.json...');
  updateSemver(BOWER_CONFIG, version);

  console.log('Git release...');
  exec(`
    git commit -am "Version ${version}"

    git tag v${version}
    git tag latest -f

    git push origin master
    git push origin v${version}
    git push origin latest -f
  `);

  console.log('Publishing to npm...');
  exec('npm publish');
};

ask(`Next version (current is ${currentPackageVersion()}): `, (version) => {
  ask(`Type next version once again: `, (versionConfirmation) => {
    if (version !== versionConfirmation) {
      throw 'You should enter same versions.';
    }

    release(version);
  });
});
