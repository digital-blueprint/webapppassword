// Trick to use the auto-downloaded puppeteer chrome binary
process.env.CHROME_BIN = require('puppeteer').executablePath();

module.exports = function(config) {
  config.set({
    basePath: 'dist',
    frameworks: ['mocha'],
    client: {
      mocha: {
        ui: 'tdd',
      },
    },
    files: [
      {pattern: './*.js', included: true, watched: true, served: true, type: 'module'},
      {pattern: './**/*', included: false, watched: true, served: true},
    ],
    autoWatch: true,
    browsers: ['ChromeHeadlessNoSandbox', 'FirefoxHeadless'],
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox']
      }
    },
    singleRun: false,
    logLevel: config.LOG_ERROR
  });
}
