import * as vscode from 'vscode'
import * as path from 'path'
import * as fs from 'fs'

function getAliasesFromWebpackConfig(
  webpackConfigPath: string
): Record<string, string> {
  try {
    const webpackConfig = require(webpackConfigPath)
    const aliases = webpackConfig.resolve?.alias

    return aliases || {}
  } catch (error) {
    console.error('Error reading webpack.config.js:', error)
    return {}
  }
}

function getAliasesFromBabelConfig(
  babelConfigPath: string
): Record<string, string> {
  try {
    const babelConfig = JSON.parse(fs.readFileSync(babelConfigPath, 'utf8'))
    const plugins = babelConfig.plugins || []

    const moduleResolverPlugin = plugins.find(
      (plugin: any) => Array.isArray(plugin) && plugin[0] === 'module-resolver'
    )
    const aliases = moduleResolverPlugin ? moduleResolverPlugin[1].alias : {}

    return aliases || {}
  } catch (error) {
    console.error('Error reading Babel config:', error)
    return {}
  }
}

function getAliasesFromTsConfig(tsConfigPath: string): Record<string, string> {
  try {
    const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'))
    const paths = tsConfig.compilerOptions?.paths || {}

    const aliases: Record<string, string> = {}
    for (const alias in paths) {
      const value = paths[alias][0]
      const resolvedAlias = alias.replace('/*', '')
      aliases[resolvedAlias] = value
    }

    return aliases
  } catch (error) {
    console.error('Error reading tsconfig.json:', error)
    return {}
  }
}

function getAliasesFromJsConfig(jsConfigPath: string): Record<string, string> {
  try {
    const jsConfig = JSON.parse(fs.readFileSync(jsConfigPath, 'utf8'))
    const paths = jsConfig.compilerOptions?.paths || {}

    const aliases: Record<string, string> = {}
    for (const alias in paths) {
      const value = paths[alias][0]
      const resolvedAlias = alias.replace('/*', '')
      aliases[resolvedAlias] = value
    }

    return aliases
  } catch (error) {
    console.error('Error reading jsconfig.json:', error)
    return {}
  }
}

function getAliasesFromVueConfig(
  vueConfigPath: string
): Record<string, string> {
  try {
    const vueConfig = require(vueConfigPath)
    const aliases = vueConfig.configureWebpack?.resolve?.alias

    return aliases || {}
  } catch (error) {
    console.error('Error reading vue.config.js:', error)
    return {}
  }
}

function getAliases() {
  const workspaceFolders = vscode.workspace.workspaceFolders
  if (!workspaceFolders) {
    console.error('No workspace folder found.')
    return {}
  }

  const workspacePath = workspaceFolders[0].uri.fsPath

  // Webpack config
  const webpackConfigPath = path.join(workspacePath, 'webpack.config.js')
  const webpackAliases = getAliasesFromWebpackConfig(webpackConfigPath)

  // Babel config
  const babelConfigPath = path.join(workspacePath, '.babelrc')
  const babelAliases = getAliasesFromBabelConfig(babelConfigPath)

  // TypeScript config
  const tsConfigPath = path.join(workspacePath, 'tsconfig.json')
  const tsAliases = getAliasesFromTsConfig(tsConfigPath)

  // javaScript config
  const jsConfigPath = path.join(workspacePath, 'jsconfig.json')
  const jsAliases = getAliasesFromJsConfig(jsConfigPath)

  // Vue CLI config
  const vueConfigPath = path.join(workspacePath, 'vue.config.js')
  const vueAliases = getAliasesFromVueConfig(vueConfigPath)

  const allAliases = {
    ...webpackAliases,
    ...babelAliases,
    ...tsAliases,
    ...jsAliases,
    ...vueAliases
  }

  return allAliases
}

function getBaseUrl() {

  const workspaceFolders = vscode.workspace.workspaceFolders
  if (!workspaceFolders) {
    console.error('No workspace folder found.')
    return {}
  }
  const workspacePath = workspaceFolders[0].uri.fsPath
    // TypeScript config
  const tsConfigPath = path.join(workspacePath, 'tsconfig.json')
  const tsConfig = (fs.existsSync(tsConfigPath) && JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'))) || ""

  // javaScript config
  const jsConfigPath = path.join(workspacePath, 'jsconfig.json')
  const jsConfig = (fs.existsSync(jsConfigPath) && JSON.parse(fs.readFileSync(jsConfigPath, 'utf8'))) || ""

  return tsConfig?.compilerOptions?.baseUrl || jsConfig?.compilerOptions?.baseUrl || ""
}

export { getAliases, getBaseUrl }
