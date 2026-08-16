// Fuse Connect v7 webpack config
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    mode: isProduction ? 'production' : 'development',
    // Source maps delay MV3 popup load if DevTools auto-attaches; keep them off in prod.
    devtool: isProduction ? false : 'cheap-module-source-map',
    target: ['web', 'es2020'],
    entry: {
      // MV3 service workers are most reliably registered from the extension root.
      'service-worker': './src/v6/background/index.ts',
      'content/index': './src/v6/content/index.ts',
      'popup/popup': './src/v6/popup/popup.js',
      'content/ai-studio-automation': './src/v6/content/ai-studio/ai-studio.js',
      'content/iframe-bridge': './src/v6/content/ai-studio/iframe-bridge.js',
      'content/youtube-integration': './src/v6/content/ai-studio/youtube.js',
      'content/notebooklm-integration': './src/v6/content/ai-studio/notebooklm.js',
    },
    output: {
      path: path.resolve(__dirname, 'dist-v7'),
      filename: '[name].js',
      clean: true,
      // Classic script for MV3 service_worker without "type": "module".
      iife: true,
      globalObject: 'globalThis',
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
              transpileOnly: true,
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
            from: './src/v6/manifest.json',
            to: 'manifest.json',
            transform(content) {
              const manifest = JSON.parse(content.toString());
              return JSON.stringify(manifest, null, 2);
            },
          },
          {
            from: './src/v6/popup',
            to: 'popup',
            noErrorOnMissing: true,
            globOptions: {
              // Webpack emits the bundled popup.js; copying source would break it.
              // popup-boot.js is a classic shell script and must be copied as-is.
              ignore: ['**/popup.js'],
            },
            // Avoid re-minifying the tiny boot shell (keeps load path predictable).
            info: { minimized: true },
          },
          { from: './icons', to: 'icons', noErrorOnMissing: true },
          {
            from: './src/v6/native-host',
            to: 'native-host',
            noErrorOnMissing: true,
            // Keep host scripts readable; do not run Terser on them.
            info: { minimized: true },
          },
        ],
      }),
    ],
    optimization: {
      splitChunks: false,
      runtimeChunk: false,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              // Keep console.error / console.warn for popup diagnostics.
              drop_console: false,
              pure_funcs: isProduction ? ['console.log', 'console.debug', 'console.info'] : [],
            },
          },
        }),
        new CssMinimizerPlugin(),
      ],
    },
  };
};
