const { getDefaultConfig } = require('expo/metro-config');
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

const config = getDefaultConfig(__dirname);
const sentryConfig = getSentryExpoConfig(__dirname);

// SentryとExpoの設定をマージ
module.exports = {
  ...config,
  ...sentryConfig,
  // 必要に応じて特定の設定を上書き
  resolver: {
    ...config.resolver,
    ...sentryConfig.resolver,
    // SplashScreenなど、必要なモジュールの解決を確保
    extraNodeModules: {
      ...config.resolver.extraNodeModules,
      ...sentryConfig.resolver.extraNodeModules,
    }
  }
};
