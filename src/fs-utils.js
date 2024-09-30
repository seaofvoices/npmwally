const path = require('path')
const fs = require('fs').promises

const log = require('./log')

const readPackageConfig = async (packagePath) => {
  const packageContent = await fs.readFile(packagePath).catch((err) => {
    log.error(`unable to read package.json at '${packagePath}': ${err}`)
    return null
  })

  if (packageContent !== null) {
    try {
      const packageData = JSON.parse(packageContent)
      return packageData
    } catch (err) {
      log.error(`unable to parse package.json at '${packagePath}': ${err}`)
    }
  }

  return null
}

const writeFile = async (filePath, content) => {
  const parent = path.dirname(filePath)
  if (parent) {
    await fs.mkdir(parent, { recursive: true })
  }
  return await fs.writeFile(filePath, content)
}

const writeJsonFile = async (filePath, content, pretty = false) => {
  const jsonContent = pretty
    ? JSON.stringify(content, null, 2)
    : JSON.stringify(content)
  return await writeFile(filePath, jsonContent)
}

const fileExists = async (filePath) => {
  return await fs
    .stat(filePath)
    .then((stat) => stat.isFile())
    .catch((err) => {
      if (err.code === 'ENOENT') {
        return false
      }
    })
}

const removeFileIfPresent = async (filePath) => {
  if (await fileExists(fileExists)) {
    await fs.rm(filePath)
    return true
  }
  return false
}

const removeEmptyDirectories = async (directory) => {
  const fileStats = await fs.lstat(directory)
  if (!fileStats.isDirectory()) {
    return
  }

  let fileNames = await fs.readdir(directory)
  if (fileNames.length > 0) {
    const recursiveRemovalPromises = fileNames.map((fileName) =>
      removeEmptyDirectories(path.join(directory, fileName))
    )
    await Promise.all(recursiveRemovalPromises)

    fileNames = await fs.readdir(directory)
  }

  if (fileNames.length === 0) {
    await fs.rmdir(directory)
  }
}

module.exports = {
  readPackageConfig,
  writeFile,
  writeJsonFile,
  fileExists,
  removeFileIfPresent,
  removeEmptyDirectories,
}
