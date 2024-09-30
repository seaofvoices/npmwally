const promiseSpawn = require('@npmcli/promise-spawn')
const log = require('./log')

const runDarklua = async (cwd, configPath, contentPath) => {
  log.debug(
    `run darklua process with '${configPath}', in '${cwd}' on '${contentPath}'`
  )

  const darkluaResult = await promiseSpawn(
    'darklua',
    ['process', '--config', configPath, contentPath, contentPath],
    { cwd }
  )

  if (darkluaResult.code !== 0) {
    throw Error(`failed to convert requires: ${darkluaResult.stderr}`)
  }
}

const getDarkluaConfig = (useFindFirstChild) => ({
  process: [
    {
      rule: 'convert_require',
      current: {
        name: 'path',
        sources: {
          '@pkg': '.',
        },
      },
      target: {
        name: 'roblox',
        indexing_style: useFindFirstChild
          ? 'find_first_child'
          : 'wait_for_child',
        rojo_sourcemap: './sourcemap.json',
      },
    },
  ],
})

const getRojoSourcemap = async (rojoConfig) => {
  log.debug(`run rojo sourcemap with '${rojoConfig}'`)
  const rojoSourcemapResult = await promiseSpawn('rojo', [
    'sourcemap',
    rojoConfig,
  ])

  if (rojoSourcemapResult.code !== 0) {
    throw Error(`unable to generate sourcemap: ${rojoSourcemapResult.stderr}`)
  }

  try {
    return JSON.parse(rojoSourcemapResult.stdout)
  } catch (err) {
    throw Error(`unable to parse generated rojo sourcemap: ${err}`)
  }
}

module.exports = {
  runDarklua,
  getDarkluaConfig,
  getRojoSourcemap,
}
