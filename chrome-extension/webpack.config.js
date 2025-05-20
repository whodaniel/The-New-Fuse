// chrome-extension/webpack.config.js
import path from 'path';
import CopyPlugin from 'copy-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? 'source-map' : 'cheap-module-source-map',
    entry: {
      popup: './src/popup/index.tsx',
      background: './src/background.ts',
      content: './src/content/index.ts',
      options: './src/options/index.tsx',
      floatingPanel: './src/floatingPanel/index.tsx' // Changed to index.tsx
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      clean: true, // Clean the dist folder before each build
    },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs'],
    mainFields: ['browser', 'module', 'main'],
    alias: {
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@styles': path.resolve(__dirname, 'src/styles'),
      '@components': path.resolve(__dirname, 'src/components')
    },
    modules: [
      'node_modules',
      path.resolve(__dirname, '../../node_modules'),
    ]
  },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          include: [
            path.resolve(__dirname, 'src')
          ],
          use: [
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: true
              }
            }
          ],
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
      new CopyPlugin({
        patterns: [
          { from: './src/manifest.json', to: 'manifest.json' },
          { from: './src/popup/popup.html', to: 'popup.html' },
          { from: './src/options/options.html', to: 'options.html' },
          { from: './src/icons', to: 'icons' },
          { from: './src/styles/content.css', to: 'content.css' },
          { from: './src/popup/popup.css', to: 'popup.css' },
          { from: './src/popup/connection-enhancements.css', to: 'connection-enhancements.css' },
          // Ensure floatingPanel.html is copied from the public directory
          { from: './public/floatingPanel.html', to: 'floatingPanel.html' },
          // Ensure floatingPanel.css is copied from its correct location
          { from: './src/floatingPanel/floatingPanel.css', to: 'floatingPanel.css' },
          // Copy WebSocket server help page
          { from: './public/websocket-server-help.html', to: 'websocket-server-help.html' },
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
            enforce: true
          },
        },
      },
    },
    // Optional: for better debugging in development
    // stats: {
    //   errorDetails: true,
    //   children: true, // if you have complex configurations using child compilers
    // },
  };
};
