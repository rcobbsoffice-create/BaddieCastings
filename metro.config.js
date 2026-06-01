// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').DefaultConfig} */
const config = getDefaultConfig(__dirname);

module.exports = config;
