const { Command } = require('commander')
const path = require('path')
const process = require('process')

const log = require('./log')
const { convertProject } = require('./convert-project')
const fs = require('fs').promises

const CLI_VERSION = '0.1.1'

const getLevelFilterFromVerbosity = (value) => {
  switch (value) {
    case 0:
      return log.LogLevel.Warn
    case 1:
      return log.LogLevel.Info
    case 2:
      return log.LogLevel.Debug
    default:
      return log.LogLevel.Trace
  }
}

const createConvertCommand = () =>
  new Command()
    .name('convert')
    .description('convert a npm package to wally')
    .option('--project <project>', 'the folder where the package.json exists')
    .option(
      '--output <output>',
      'where to generate the wally package (default is `wally`)'
    )
    .option(
      '--modules-folder <module-folder>',
      'the name of the directory where packages are installed (default is `node_modules`)'
    )
    .option(
      '--translate-package <translate-package>',
      'A package name to translate from npm to wally',
      (value, prev) => {
        const content = value.split('=').map((name) => name.trim())
        if (content.length == 2 && content[0] && content[1]) {
          prev[content[0]] = content[1]
        } else {
          log.warn(
            `unable to parse package name translation '${value}'. It must be something like 'luau-json=seaofvoices/luau-json'`
          )
        }
        return prev
      },
      {}
    )
    .option(
      '--copy <copy>',
      'Content to copy over to the wally package',
      (value, prev) => {
        prev.push(value)
        return prev
      },
      []
    )
    .option(
      '--darklua-config <darklua-config>',
      'provide a custom darklua config to convert requires'
    )
    .option(
      '--use-find-first-child',
      'generate requires with FindFirstChild',
      false
    )
    .action(
      async (
        {
          project = '.',
          modulesFolder = 'node_modules',
          translatePackage = {},
          copy = [],
          output = 'wally',
          darkluaConfig = null,
          useFindFirstChild = false,
        },
        command
      ) => {
        log.setLevelFilter(
          getLevelFilterFromVerbosity(command.optsWithGlobals().verbose)
        )
        const projectNodeModules = path.join(project, modulesFolder)

        try {
          await fs.stat(projectNodeModules)
        } catch (err) {
          log.error(
            `unable to find modules folder at ${projectNodeModules}: ${err}`
          )
          process.exit(1)
        }

        const packageJsonPath = path.join(project, 'package.json')

        try {
          await fs.stat(packageJsonPath)
        } catch (err) {
          log.error(`unable to find package.json at ${packageJsonPath}: ${err}`)
          process.exit(1)
        }

        await convertProject({
          projectPath: project,
          nodeModules: projectNodeModules,
          copyContent: copy,
          output,
          packageTranslations: translatePackage,
          darkluaConfig,
          useFindFirstChild,
        })
      }
    )

const createCLI = () => {
  const program = new Command()

  program
    .name('npmwally')
    .description('a utility to convert npm packages to wally')
    .version(CLI_VERSION)
    .option(
      '-v, --verbose',
      'verbosity that can be increased',
      (_, prev) => prev + 1,
      0
    )
    .addCommand(createConvertCommand())

  return (args) => {
    program.parse(args)
  }
}

module.exports = {
  createCLI,
}
