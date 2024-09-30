<div align="center">

[![checks](https://github.com/seaofvoices/npmwally/actions/workflows/test.yml/badge.svg)](https://github.com/seaofvoices/npmwally/actions/workflows/test.yml)
![version](https://img.shields.io/github/package-json/v/seaofvoices/npmwally)
[![GitHub top language](https://img.shields.io/github/languages/top/seaofvoices/npmwally)](https://github.com/luau-lang/luau)
![license](https://img.shields.io/npm/l/npmwally)
![npm](https://img.shields.io/npm/dt/npmwally)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/seaofvoices)

</div>

# npmwally

**npmwally** is a command-line tool that automates the conversion of a Lua/Luau npm package into a [Wally](https://github.com/UpliftGames/wally) package.

## Features

- **Package Detection:** Scans the `package.json` and identifies Lua/Luau dependencies.
- **Dependency Translation:** Maps npm package names to their wally equivalents.
- **Module Requires Conversion:** Runs darklua to convert the string/path requires into Roblox requires.
- **Generate a Wally Package:** Generate a `wally.toml` and a `default.project.json`. Remove files as specified in the `.npmignore` configuration file.

## Requirements

When converting packages, **npmwally** will run [Rojo](https://github.com/rojo-rbx/rojo) and [darklua](https://github.com/seaofvoices/darklua). Make sure to have those installed.

## Usage

You can install `npmwally` with npm or yarn:

```bash
npm install npmwally --save-dev

yarn add npmwally -D
```

### Convert a Package

To convert an npm package to a Wally package, use the `convert` command:

```bash
npmwally convert --output <output-directory>
```

For more information about the available options, use the `--help` argument:

```bash
npmwally convert --help
```

#### Example

```bash
npmwally convert --use-find-first-child
```

This command will:

- convert the Lua/Luau code the current working directory to a Wally package in './wally`.
- convert requires using `FindFirstChild` indexing.

### Options

- `--project <project>`: The folder where the `package.json` file exists (default is the current directory).
- `--output <output>`: The folder where the Wally package will be generated (default is `wally`).
- `--modules-folder <module-folder>`: The folder where npm packages are installed (default is `node_modules`).
- `--translate-package <translate-package>`: A package name to translate from npm to Wally format (`npm-package=wally-package`).
- `--copy <copy>`: Additional files or directories to copy into the Wally package.
- `--darklua-config <darklua-config>`: Path to a custom Darklua configuration file.
- `--use-find-first-child`: Use `FindFirstChild` instead of direct indexing in generated requires.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE.txt) file for details.
