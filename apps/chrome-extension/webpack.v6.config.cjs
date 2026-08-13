// chrome-extension/webpack.config.cjs
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? 'source-map' : 'cheap-module-source-map',
    entry: {
      popup: './src/popup/popup-fallback.js',
      background: './src/background.ts',
      content: './src/v5/content/index.ts',
      options: './src/options/index.ts',
      floatingPanel: './src/floatingPanel/EnhancedFloatingPanel.tsx',
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      clean: true,
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs'],
      mainFields: ['browser', 'module', 'main'],
      extensionAlias: {
        '.js': ['.ts', '.js'],
        '.mjs': ['.mts', '.mjs'],
      },
      alias: {
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@styles': path.resolve(__dirname, 'src/styles'),
        '@components': path.resolve(__dirname, 'src/components'),
      },
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: {
            loader: 'ts-loader',
            options: {
              transpileOnly: true, // Skip type checking for faster builds
              compilerOptions: {
                module: 'ESNext',
                moduleResolution: 'bundler',
                strict: false,
                noImplicitAny: false,
              },
            },
          },
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, 'css-loader'],
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
      new CopyPlugin({
        patterns: [
          {
            from: './src/manifest.json',
            to: 'manifest.json',
            transform(content) {
              const manifest = JSON.parse(content.toString());
              // Adjust paths to be relative to the dist directory
              if (
                manifest.action &&
                manifest.action.default_popup &&
                manifest.action.default_popup.startsWith('dist/')
              ) {
                manifest.action.default_popup = manifest.action.default_popup.replace(
                  /^dist\//,
                  ''
                );
              }
              return JSON.stringify(manifest, null, 2);
            },
          },
          { from: './src/options/options.html', to: 'options.html' },
          { from: './src/styles/content.css', to: 'content.css' },
          { from: './src/styles/element-selection.css', to: 'element-selection.css' },
          { from: './src/floatingPanel/floatingPanel.html', to: 'floatingPanel.html' },
          { from: './src/popup/popup.html', to: 'popup.html' },
          { from: './src/icons', to: 'icons', noErrorOnMissing: true },
        ],
      }),
    ],
    optimization: {
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: isProduction,
              pure_funcs: isProduction ? ['console.log', 'console.debug'] : [],
            },
          },
        }),
        new CssMinimizerPlugin(),
      ],
      splitChunks: {
        chunks: 'all',
        maxInitialRequests: 3,
        cacheGroups: {
          defaultVendors: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            chunks: 'all',
            priority: -10,
            reuseExistingChunk: true,
          },
          commons: {
            name: 'commons',
            chunks: 'all',
            minChunks: 2,
            enforce: true,
          },
        },
      },
    },
  };
};
