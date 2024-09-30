const seaofvoices = {
  'luau-task': 'seaofvoices/luau-task',
  'luau-json': 'seaofvoices/luau-json',
  'luau-signal': 'seaofvoices/luau-signal',
}

const jsdotlua = Object.fromEntries(
  [
    'jest',
    'jest-circus',
    'jest-config',
    'jest-console',
    'jest-core',
    'jest-diff',
    'jest-each',
    'jest-environment',
    'jest-environment-roblox',
    'jest-fake-timers',
    'jest-globals',
    'jest-jasmine2',
    'jest-matcher-utils',
    'jest-message-util',
    'jest-mock',
    'jest-reporters',
    'jest-runner',
    'jest-runtime',
    'jest-snapshot',
    'jest-snapshot-serializer-raw',
    'jest-test-result',
    'jest-types',
    'jest-util',
    'jest-validate',

    'diff-sequences',
    'path',
    'throat',
    'emittery',
    'expect',
    'pretty-format',

    'luau-polyfill',
    'collections',
    'es7-types',
    'number',
    'instance-of',
    'string',
    'math',
    'console',
    'boolean',
    'timers',

    'react',
    'react-roblox',
    'shared',
    'scheduler',
    'react-reconciler',
    'react-is',
    'react-devtools-shared',
    'react-debug-tools',
    'react-test-renderer',
    'roact-compat',
    'react-shallow-renderer',
    'react-devtools-extensions',
    'react-cache',

    'luau-regexp',
    'chalk',
    'picomatch',
    'graphql',
    'luau-requests',
    'dom-testing-library',
    'react-testing-library',
    'zen-observable',

    'promise',
  ].map((name) => [`@jsdotlua/${name}`, `jsdotlua/${name}`])
)

const allPackages = Object.assign(
  {
    'luau-regexp': 'jsdotlua/luau-regexp',
    'symbol-luau': 'jsdotlua/symbol-luau',
  },
  jsdotlua,
  seaofvoices
)

const defaultPackageName = (npmPackageName) => {
  if (npmPackageName.startsWith('@')) {
    return npmPackageName.substring(1)
  }

  throw Error(`unable to find wally package for '${npmPackageName}'`)
}

const translatePackageName = (npmPackageName, additionalTranslations = {}) => {
  return (
    additionalTranslations[npmPackageName] ||
    allPackages[npmPackageName] ||
    defaultPackageName(npmPackageName)
  )
}

module.exports = {
  translatePackageName,
}
