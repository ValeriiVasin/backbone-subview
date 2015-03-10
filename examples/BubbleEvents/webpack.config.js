/*eslint-env node*/
module.exports = {
  entry: {
    app: ['./app.js']
  },
  output: {
    filename: 'bundle.js'
  },
  module: {
    loaders: [
      { test: /\.jsx?$/, exclude: /node_modules/, loader: 'babel-loader' }
    ]
  }
};
