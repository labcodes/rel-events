module.exports = {
  extends: ['airbnb-base', 'prettier'],
  plugins: ['prettier'],
  parser: 'babel-eslint',
  rules: {
    'prettier/prettier': 'error',
    'arrow-body-style': ['error', 'as-needed'],
    'no-plusplus': 'off',
    'no-param-reassign': 'off',
    'no-prototype-builtins': 'off',
    'no-restricted-properties': 'off',
    'no-underscore-dangle': 'off',
    'array-callback-return': 'off',
    'camelcase': 'off',
    'no-console': ['error', { allow: ['error'] }],
    'class-methods-use-this': 'off'
  },
  env: {
    es6: true,
    jest: true,
    browser: true,
  },
};
