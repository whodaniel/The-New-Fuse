module.exports = {
  plugins: [
    'postcss-preset-env',
    'autoprefixer',
    ...(process.env.NODE_ENV === 'production'
      ? ['cssnano']
      : []),
  ],
};
