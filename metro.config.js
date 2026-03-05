const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Force babel transform on @powersync/web so import.meta gets rewritten
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

// Ensure @powersync/web files are not excluded from babel transformation
const originalResolveRequest = config.resolver?.resolveRequest;
config.resolver = {
  ...config.resolver,
  // Mark @powersync/web as needing transformation (not pre-built)
  unstable_enablePackageExports: true,
};

module.exports = withNativeWind(config, { input: "./global.css" });
