module.exports = function(config) {
  config.set({
    browsers: ['PhantomJS'],

    frameworks: ['jasmine'],

    reporters: ['dots'],

    files: [
      'test/**/*_test.js'
    ],

    preprocessors: {
      'test/**/*_test.js': ['webpack']
    },

    webpack: {
      // webpack configuration
      module: {
        loaders: [
          { test: /\.jsx?$/, exclude: /node_modules/, loader: 'babel-loader' }
        ]
      }
    },

    webpackMiddleware: {
      // webpack-dev-middleware configuration
      // i. e.
      noInfo: true
    },

    plugins: [
      'karma-jasmine',
      'karma-phantomjs-launcher',
      'karma-webpack'
    ]

  });
};
