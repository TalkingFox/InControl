var path = require('path');
var pathToPhaser = path.join(__dirname, '/node_modules/phaser/');
const simplePeer = path.join(__dirname, '/node_modules/simple-peer/simplepeer.min.js');

module.exports = {
  entry: {
    host: './src/host.ts',
    client: './src/client.ts'
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].entry.js'
  },
  node: {
    fs: 'empty',
    tls: 'empty'
  },
  devServer: {
    contentBase: path.resolve(__dirname, './'),
    publicPath: '/build/',
    host: '127.0.0.1',
    port: 3000,
    open: true
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      'simple-peer': simplePeer
    }
  },
  module: {
    rules: [
      { test: /\.ts$/, loader: 'ts-loader', exclude: '/node_modules/' },
      { test: /phaser\.js$/, loader: 'expose-loader?Phaser' }
    ]
  }
};
