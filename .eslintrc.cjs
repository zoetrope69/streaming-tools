// eslint doesn't support ES modules
// eslint-disable-next-line import/no-commonjs
module.exports = {
  env: {
    node: true,
    browser: true,
    commonjs: true,
    es2021: true,
  },
  extends: ["preact", "eslint:recommended", "prettier"],
  plugins: ["prettier", "import"],
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    "prettier/prettier": ["error"],
    "no-console": ["error"],
    "import/no-unresolved": 2,
    "import/no-commonjs": 2,
    "import/extensions": [2, "ignorePackages"],
  },
};
