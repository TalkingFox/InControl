var path = require('path');
var pathToPhaser = path.join(__dirname, '/node_modules/phaser/');
var phaser = path.join(pathToPhaser, 'dist/phaser.js');
var peer = path.join(path.join(__dirname, '/node_modules/peerjs/dist/peer.js'))
var qrious = path.join(__dirname, '/node_modules/qrious/dist/qrious.js')
var jsqr = path.join(__dirname, '/node_modules/jsqr/dist/jsQR.js');

module.exports = {
  entry: {
    host: './src/host.ts',
    client: './src/client.ts'
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].entry.js'
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
      phaser: phaser,
      peer: peer,
      qrious: qrious
    }
  },
  module: {
    rules: [
      { test: /\.ts$/, loader: 'ts-loader', exclude: '/node_modules/' },
      { test: /phaser\.js$/, loader: 'expose-loader?Phaser' }
    ]
  }
};
