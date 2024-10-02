const path = require('path')

const { glob } = require('glob')
const { fileExists, readPackageConfig } = require('./fs-utils')

const removeNpmPackageScope = (packageName) =>
  packageName.startsWith('@')
    ? packageName.substring(packageName.indexOf('/') + 1)
    : packageName

const findWorkspaceMembers = async (projectPath, workspaces) => {
  const members = await glob(
    workspaces.map((workspaceGlob) =>
      path.join(projectPath, workspaceGlob).replaceAll('\\', '/')
    )
  )

  const workspaceMembers = await Promise.all(
    members.map(async (member) => {
      const memberPackageJsonPath = path.join(member, 'package.json')

      if (await fileExists(memberPackageJsonPath)) {
        return {
          location: member,
          packageContent: await readPackageConfig(memberPackageJsonPath),
        }
      }
      return null
    })
  ).then((result) => result.filter(Boolean))

  return workspaceMembers
}

const getVersion = (specifiedVersion, dependencyName, workspaceMembers) => {
  if (specifiedVersion === 'workspace:^') {
    const { packageContent = null } = workspaceMembers.find(
      ({ packageContent }) => packageContent.name === dependencyName
    )

    if (packageContent) {
      return packageContent.version
    } else {
      throw Error(
        `unable to get workspace member version for '${dependencyName}'`
      )
    }
  }

  return specifiedVersion.startsWith('^')
    ? specifiedVersion.substring(1)
    : specifiedVersion
}

const convertAuthorToString = (author) => {
  if (typeof author === 'string') {
    return author
  } else {
    const { name = null, email = null, url = null } = author

    return name + (email ? ` <${email}>` : '') + (url ? ` (${url})` : '')
  }
}

module.exports = {
  removeNpmPackageScope,
  findWorkspaceMembers,
  getVersion,
  convertAuthorToString,
}
