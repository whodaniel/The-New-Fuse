// chrome-extension/webpack.config.js
import path from 'path';
import CopyPlugin from 'copy-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
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
    }
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
      new HtmlWebpackPlugin({
        filename: 'popup.html',
        template: path.resolve(__dirname, 'src/popup/popup-template.html'),
        chunks: ['popup'],
        minify: false
      }),
      new CopyPlugin({
        patterns: [
          {
            from: './src/manifest.json',
            to: 'manifest.json',
            transform(content) {
              const manifest = JSON.parse(content.toString());
              // Adjust paths to be relative to the dist directory
              if (manifest.action && manifest.action.default_popup && manifest.action.default_popup.startsWith('dist/')) {
                manifest.action.default_popup = manifest.action.default_popup.replace(/^dist\//, '');
              }
              return JSON.stringify(manifest, null, 2);
            },
          },
          { from: './src/options/options.html', to: 'options.html' },
          { from: './src/options/options.css', to: 'options.css' },
          { from: './src/styles/content.css', to: 'content.css' },
          { from: './src/styles/element-selection.css', to: 'element-selection.css' },
          { from: './src/icons', to: 'icons', noErrorOnMissing: true },
          { from: './src/styles', to: 'styles', noErrorOnMissing: true },
          { from: '../ui-html-css', to: 'ui-html-css', noErrorOnMissing: true }, // Added to copy HTML showcase
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
