const fs = require('fs');
const path = require('path');
const semver = require('semver');

// Node script to read package.json, parse the version, and then update public/manifest.json with the version.
// It also validates that the version is a valid semver
const packageJsonPath = path.join(__dirname, 'package.json');
const manifestJsonPath = path.join(__dirname, 'public', 'manifest.json');

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const manifestJson = JSON.parse(fs.readFileSync(manifestJsonPath, 'utf8'));

const version = packageJson.version;

if (!semver.valid(version)) {
    console.error(`Invalid version: ${version}`);
    process.exit(1);
}

manifestJson.version = version;

fs.writeFileSync(manifestJsonPath, JSON.stringify(manifestJson, null, 2), 'utf8');

console.log(`Updated manifest.json to version ${version}`);