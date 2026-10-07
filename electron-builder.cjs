const config = require('./electron-builder.json');

// Electron resolves macOS helpers from the internal bundle/product name.
// Keep that name ASCII, independently of the user-facing display name.
module.exports = process.platform === 'darwin' ? {
  ...config,
  productName: 'iCubeGames',
  mac: {
    ...config.mac,
    executableName: 'iCubeGames',
    extendInfo: {
      CFBundleName: 'iCubeGames',
      CFBundleDisplayName: 'Айкуб Игры',
    },
  },
} : config;
