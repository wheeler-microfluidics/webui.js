module.exports = {
  target: 'web',
  entry: './src/libDeviceUIPlugin.js',
  output: {
    filename: './index.js',
    libraryTarget: 'umd'
  },
  resolve: {
    extensions: ['', '.js']
  },
  bail: true,
  externals: {
    two: "Two"
  },
  module: {
    loaders: [
      { test: /\.css$/, loader: 'style-loader!css-loader' },
      {
        test: /\.js$/,
        loader: 'babel',
        include: /dat\.gui/,
        query: {
          presets: [["es2015", {"loose": true}], "stage-0"]
        }
      },
    ]
  }
}
