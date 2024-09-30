const path = require('path')
const fs = require('fs').promises

const walk = require('ignore-walk')

const {
  readPackageConfig,
  fileExists,
  removeEmptyDirectories,
  writeFile,
  writeJsonFile,
  removeFileIfPresent,
} = require('./fs-utils')
const log = require('./log')
const {
  getRojoConfig,
  getAliasFromWallyPackageName,
  getWallyToml,
} = require('./wally-package-utils')
const { translatePackageName } = require('./translate-packages')
const {
  removeNpmPackageScope,
  findWorkspaceMembers,
  getVersion,
} = require('./npm-package-utils')
const {
  runDarklua,
  getDarkluaConfig,
  getRojoSourcemap,
} = require('./tool-utils')

const DARKLUA_CONFIG_FILE_NAME = '.darklua-wally.json'

const convertPackage = async (options) => {
  const {
    projectPath,
    copyContent,
    output,
    nodeModules,
    packageContent,
    packageTranslations,
    darkluaConfig,
    useFindFirstChild,
    workspaceMembers = [],
  } = options
  log.info(`convert package at '${projectPath}'`)

  const srcFolder = 'src'

  await fs.cp(path.join(projectPath, srcFolder), path.join(output, srcFolder), {
    recursive: true,
  })

  const projectNpmIgnorePath = path.join(projectPath, '.npmignore')

  if (await fileExists(projectNpmIgnorePath)) {
    log.trace('copy .npmignore and filter files')
    const npmignoreCopyPath = path.join(output, '.npmignore')
    await fs.cp(projectNpmIgnorePath, npmignoreCopyPath).catch((err) => {
      throw Error(`unable to copy '${projectNpmIgnorePath}': ${err}`)
    })

    const allFiles = await walk({
      path: output,
      ignoreFiles: [],
    })
    const keepFiles = new Set(
      await walk({
        path: output,
        ignoreFiles: ['.npmignore'],
      })
    )

    await Promise.all(
      allFiles
        .filter((filePath) => !keepFiles.has(filePath))
        .map(async (filePath) => await fs.rm(path.join(output, filePath)))
    )
    await Promise.all([
      removeEmptyDirectories(output),
      removeFileIfPresent(npmignoreCopyPath),
    ])
  }

  const npmDependencies = await Promise.all(
    Object.entries(packageContent.dependencies ?? {}).map(
      async ([dependencyName, specifiedVersion]) => {
        const dependencyPackageJsonPath = path.join(
          nodeModules,
          dependencyName,
          'package.json'
        )

        if (await fileExists(dependencyPackageJsonPath)) {
          const dependencyPackageJson = await readPackageConfig(
            dependencyPackageJsonPath
          )
          const mainFile = dependencyPackageJson && dependencyPackageJson?.main

          if (mainFile.endsWith('.lua') || mainFile.endsWith('.luau')) {
            return {
              npmName: dependencyName,
              wallyName: translatePackageName(
                dependencyName,
                packageTranslations
              ),
              aliasName: removeNpmPackageScope(dependencyName),
              specifiedVersion: getVersion(
                specifiedVersion,
                dependencyName,
                workspaceMembers
              ),
            }
          } else {
            log.debug(
              `skip dependency '${dependencyName}' because it is not in Lua or Luau (main file is '${mainFile}')`
            )
          }
        }

        log.trace(
          `unable to find dependency '${dependencyName}' in installed modules`
        )

        return null
      }
    )
  ).then((dependencies) => dependencies.filter(Boolean))

  const wallyRojoConfig = path.join(output, 'default.project.json')

  const wallyPackageName = translatePackageName(
    packageContent.name,
    packageTranslations
  )
  const wallyAlias = getAliasFromWallyPackageName(wallyPackageName)

  const defaultSourcemap = await writeJsonFile(
    wallyRojoConfig,
    getRojoConfig({ name: wallyAlias }),
    true
  ).then(() => getRojoSourcemap(wallyRojoConfig))

  const sourcemap = {
    name: 'WallyPackage',
    className: 'Folder',
    filePaths: ['wally-package.project.json'],
    children: [
      {
        ...defaultSourcemap,
        filePaths: defaultSourcemap.filePaths.filter(
          (filePath) => filePath !== 'default.project.json'
        ),
      },
      ...npmDependencies.map(({ aliasName, npmName }) => {
        return {
          name: aliasName,
          className: 'ModuleScript',
          filePaths: [`${npmName}.luau`],
        }
      }),
    ],
  }

  const darkluaConfigPath = path.join(output, DARKLUA_CONFIG_FILE_NAME)
  const sourcemapPath = path.join(output, 'sourcemap.json')

  const links = npmDependencies.map(({ npmName }) =>
    path.join(output, `${npmName}.luau`)
  )

  await Promise.all([
    writeJsonFile(sourcemapPath, sourcemap),
    darkluaConfig
      ? fs.cp(darkluaConfig, darkluaConfigPath)
      : writeJsonFile(
          darkluaConfigPath,
          getDarkluaConfig(useFindFirstChild),
          true
        ),
    ...links.map((linkPath) => writeFile(linkPath, 'return nil')),
  ])

  await runDarklua(output, DARKLUA_CONFIG_FILE_NAME, srcFolder)

  const wallyTomlPath = path.join(output, 'wally.toml')
  const wallyToml = getWallyToml({
    packageName: wallyPackageName,
    private: packageContent.private,
    version: packageContent.version,
    license: packageContent.license,
    author: [packageContent?.author]
      .concat(packageContent?.contributors ?? [])
      .filter(Boolean),
    dependencies: npmDependencies,
  })

  await Promise.all([
    fs.writeFile(wallyTomlPath, wallyToml),
    fs.rm(darkluaConfigPath),
    fs.rm(sourcemapPath),
    ...links.map((linkPath) => fs.rm(linkPath)),
    ...copyContent.map(async (content) => {
      const destination = path.join(output, content)

      return await fs.cp(content, destination).catch((err) => {
        log.warn(`unable to copy ${content} to ${destination}: ${err}`)
      })
    }),
  ])

  await removeEmptyDirectories(output)
}

const convertProject = async (options) => {
  const { projectPath, output, packageTranslations } = options

  const packageJsonPath = path.join(projectPath, 'package.json')
  const packageContent = await readPackageConfig(packageJsonPath)

  await fs.mkdir(output, { recursive: true })

  if (packageContent?.workspaces) {
    log.trace('find all workspace members to convert')
    const workspaceMembers = await findWorkspaceMembers(
      projectPath,
      packageContent.workspaces
    )

    await Promise.all(
      workspaceMembers.map(async ({ location, packageContent }) => {
        const wallyAlias = getAliasFromWallyPackageName(
          translatePackageName(packageContent.name, packageTranslations)
        )
        return await convertPackage({
          ...options,
          packageContent,
          projectPath: location,
          output: path.join(output, wallyAlias),
          workspaceMembers,
        })
      })
    )
  } else {
    await convertPackage({ packageContent, ...options })
  }
}

module.exports = {
  convertProject,
}
