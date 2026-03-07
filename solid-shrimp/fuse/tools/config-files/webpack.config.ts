import path from 'path';
import { Configuration } from 'webpack';

const config: Configuration = {
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@the-new-fuse': path.resolve(__dirname, 'packages/'),
    }
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  }
};

export default config;