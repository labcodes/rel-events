module.exports = {
  extends: ['airbnb-base', 'prettier'],
  plugins: ['prettier'],
  parser: 'babel-eslint',
  rules: {
    'prettier/prettier': 'error',
    'arrow-body-style': ['error', 'as-needed'],
    'no-plusplus': 'off',
    'no-param-reassign': 'off',
    'no-underscore-dangle': 'off',
    'no-prototype-builtins': 'off',
    'array-callback-return': 'off',
    'no-console': ['error', { allow: ['error'] }],
    'class-methods-use-this': 'off'
  },
  env: {
    es6: true,
    jest: true,
    browser: true,
  },
};
