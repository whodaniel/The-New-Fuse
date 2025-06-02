#!/bin/bash
set -e

# Script to build the Chrome extension with ES modules

echo "Starting Chrome extension build process..."

# Change to the script's directory
cd "$(dirname "$0")"

# Generate icons
echo "Generating icons..."
node generate-icons.cjs
node scripts/generate-notification-icons.cjs

# Create temp CommonJS config file that webpack-cli can understand
echo "Creating webpack config file..."
cat > webpack.temp.cjs << 'EOF'
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? 'source-map' : 'cheap-module-source-map',
    entry: {
      popup: './src/popup/index.tsx',
      background: './src/background.ts',
      content: './src/content/index.ts',
      options: './src/options/index.tsx',
      floatingPanel: './src/floatingPanel/index.tsx'
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      clean: true,
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs'],
      mainFields: ['browser', 'module', 'main'],
      alias: {
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@styles': path.resolve(__dirname, 'src/styles'),
        '@components': path.resolve(__dirname, 'src/components')
      }
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: {
            loader: 'ts-loader',
            options: {
              transpileOnly: true
            }
          },
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader'
          ],
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource',
        },
      ],
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: '[name].css',
      }),
      new HtmlWebpackPlugin({
        filename: 'popup.html',
        template: './src/popup/popup-template.html',
        chunks: ['popup'],
        minify: false
      }),
      new CopyPlugin({
        patterns: [
          { from: './src/manifest.json', to: 'manifest.json' },
          { from: './src/options/options.html', to: 'options.html' },
          { from: './src/options/options.css', to: 'options.css' },
          { from: './src/styles/content.css', to: 'content.css' },
          { from: './src/styles/element-selection.css', to: 'element-selection.css' },
          { from: './src/icons', to: 'icons', noErrorOnMissing: true },
          { from: './src/styles', to: 'styles', noErrorOnMissing: true },
        ],
      }),
    ],
    optimization: {
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            format: {
              comments: false,
            },
            compress: {
              drop_console: isProduction,
            }
          },
          extractComments: false,
        }),
        new CssMinimizerPlugin(),
      ],
    }
  };
};
EOF

# Ensure all dependencies are installed
echo "Checking dependencies..."
for pkg in webpack webpack-cli ts-loader style-loader css-loader copy-webpack-plugin html-webpack-plugin terser-webpack-plugin mini-css-extract-plugin css-minimizer-webpack-plugin
do
  if ! yarn list $pkg &>/dev/null; then
    echo "Installing missing dependency: $pkg"
    yarn add --dev $pkg
  fi
done

# Run webpack with the temporary config
echo "Running webpack build..."
npx webpack --config webpack.temp.cjs --mode production

# Cleanup
echo "Cleaning up temporary files..."
rm webpack.temp.cjs

echo "Build completed. Check dist/ directory."
ls -la dist/
