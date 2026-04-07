/** @type {import('@bacons/apple-targets').Config} */
module.exports = (config) => ({
  type: 'widget',
  name: 'SpendlerWidget',
  displayName: 'Spendler',
  bundleIdentifier: 'app.spendler.widget',
  deploymentTarget: '17.0',
  entitlements: {
    'com.apple.security.application-groups':
      config.ios.entitlements['com.apple.security.application-groups'],
  },
  frameworks: ['SwiftUI', 'WidgetKit'],
});
