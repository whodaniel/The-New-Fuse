/**
 * Fuse Connect v7 - Webpack Configuration
 *
 * Note: source-of-truth code currently lives under `src/v6`.
 * This config builds the v7 artifact (`dist-v7`) from that source.
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
      'background/index': './src/v6/background/index.ts',
      'content/index': './src/v6/content/index.ts',
      'popup/popup': './src/v6/popup/popup.js',
      // AI Studio integrations
      'content/ai-studio-automation': './src/v6/content/ai-studio/ai-studio.js',
      'content/youtube-integration': './src/v6/content/ai-studio/youtube.js',
      'content/notebooklm-integration': './src/v6/content/ai-studio/notebooklm.js',
      'content/iframe-bridge': './src/v6/content/ai-studio/iframe-bridge.js',
    },

    output: {
      path: path.resolve(__dirname, 'dist-v7'),
      filename: '[name].js',
      clean: true,
      pathinfo: false,
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
          { from: './src/v6/manifest.json', to: 'manifest.json' },
          { from: './src/v6/popup/index.html', to: 'popup/index.html' },
          { from: './src/v6/popup/popup.css', to: 'popup/popup.css' },
          { from: './assets/icons', to: 'icons', noErrorOnMissing: true },
          { from: './src/v6/native-host', to: 'native-host', noErrorOnMissing: true },
        ],
      }),
      // Polyfill Buffer and process
      new (require('webpack').ProvidePlugin)({
        Buffer: ['buffer', 'Buffer'],
        process: 'process/browser',
      }),
    ],

    optimization: {
      minimize: true,
    },
  };
};
