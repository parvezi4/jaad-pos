module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
    '@babel/preset-react',
  ],
  env: {
    production: {
      presets: ['module:metro-react-native-babel-preset'],
    },
  },
};
