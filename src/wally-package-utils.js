const getSortFn = (key) => {
  return (a, b) => {
    let x = a[key]
    let y = b[key]
    if (x > y) {
      return 1
    }
    if (x < y) {
      return -1
    }
    return 0
  }
}

const sortDependencies = getSortFn('aliasName')

const getWallyToml = ({
  packageName,
  private,
  version,
  license,
  author = [],
  dependencies = [],
}) => {
  const tomlLines = ['[package]', `name = "${packageName}"`]

  if (private) {
    tomlLines.push('private = true')
  }

  tomlLines.push(
    `version = "${version}"`,
    'registry = "https://github.com/UpliftGames/wally-index"',
    'realm = "shared"'
  )

  if (license) {
    tomlLines.push(`license = "${license}"`)
  }

  if (author && typeof author === 'string') {
    tomlLines.push(`authors = ["${author}"]`)
  } else if (author && Array.isArray(author)) {
    if (author.length === 1) {
      tomlLines.push(`authors = ["${author[0]}"]`)
    } else if (author.length > 1) {
      tomlLines.push(`authors = [\n    "${author.join('",\n    "')}",\n]`)
    }
  }

  tomlLines.push('', '[dependencies]')

  dependencies.sort(sortDependencies)
  dependencies.forEach((dependency) => {
    tomlLines.push(
      `${dependency.aliasName} = "${dependency.wallyName}@${dependency.specifiedVersion}"`
    )
  })

  tomlLines.push('')

  return tomlLines.join('\n')
}

const getRojoConfig = ({ name }) => {
  return {
    name,
    tree: {
      $path: 'src',
    },
  }
}

const getAliasFromWallyPackageName = (wallyPackageName) => {
  return wallyPackageName.split('/')[1]
}

module.exports = {
  getWallyToml,
  getRojoConfig,
  getAliasFromWallyPackageName,
}
