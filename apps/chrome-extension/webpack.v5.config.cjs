/**
 * Fuse Connect v6 - Webpack Configuration
 */
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? 'source-map' : 'cheap-module-source-map',

    entry: {
      'background/index': './src/v5/background/index.ts',
      'content/index': './src/v5/content/index.ts',
      'popup/popup': './src/v5/popup/popup.js',
    },

    output: {
      path: path.resolve(__dirname, 'dist-v5'),
      filename: '[name].js',
      clean: true,
    },

    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      extensionAlias: {
        '.js': ['.ts', '.js'],
      },
    },

    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              compilerOptions: {
                module: 'ESNext',
                moduleResolution: 'bundler',
              },
            },
          },
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, 'css-loader'],
        },
      ],
    },

    plugins: [
      new MiniCssExtractPlugin({
        filename: '[name].css',
      }),
      new CopyPlugin({
        patterns: [
          { from: './src/v5/manifest.json', to: 'manifest.json' },
          { from: './src/v5/popup/index.html', to: 'popup/index.html' },
          { from: './src/v5/popup/popup.css', to: 'popup/popup.css' },
          { from: './assets/icons', to: 'icons', noErrorOnMissing: true },
          { from: './src/v5/native-host', to: 'native-host', noErrorOnMissing: true },
        ],
      }),
    ],

    optimization: {
      minimize: isProduction,
    },
  };
};
