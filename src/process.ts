import { read } from 'jimp'
import * as path from 'path'
import { window, workspace, env } from 'vscode'
import * as os from 'os'
import normalize from 'normalize-path'
import * as fs from 'fs-extra'
import { parse } from 'comment-json'
import {getAliases,getBaseUrl} from './getAlias'
// const clipboardy = require('clipboardy')
function complied(str: string, context: { [key: string]: string }) {
  return str.replace(/\${(.*?)}/g, (match, $1) => {
    // $1表示第一个括号内匹配的值
    return context[$1.trim()]
  })
}

class ImgSnippet {
  constructor(
    private config: {
      tpl: string,
      remtpl: string,
      RemMode:boolean
    } = {
      tpl: 'width: ${width}px;\nheight: ${height}px;',
      remtpl: 'width: ${width}rem;\nheight: ${height}rem;',
      RemMode:false,
    }
    
  ) {
    this.initAliasPaths()

    workspace.onDidChangeWorkspaceFolders(_e => {
      this.initAliasPaths()
    })
  }

  aliasPaths: { [key: string]: string } = {}
  aliasBaseUrl?: string
  get currentFileURI() {
    return window.activeTextEditor?.document.uri
  }

  get workspacePath() {
    return (
      (this.currentFileURI &&
        workspace.getWorkspaceFolder(this.currentFileURI!)?.uri.fsPath) ||
      (workspace.workspaceFolders && workspace.workspaceFolders[0].uri.fsPath)
    )
  }

  // 匹配相对路径
  regUrlPath: RegExp = /((http(s)*:)*\/\/)(\w|\.|\/)+/
  regFilePath: RegExp = /(\.{1,2}(\/?))+([^\/]+\/)*[^\/]+\.\w+/

  private getRegFilePath(key: string) {
    // https://cloud.tencent.com/developer/ask/58617
    return new RegExp(String.raw`${key}\/([^\/]+\/)*[^\/]+\.\w+`)
  }

  initAliasPaths() {
    if (!this.workspacePath) {
      return
    }

    this.aliasBaseUrl = getBaseUrl()
    this.aliasPaths = getAliases()
    console.log('aliaspaths:',this.aliasPaths)
    console.log('aliasbaseurl:',this.aliasBaseUrl)
  }

  getAbsPath(currentFilePath: string, targetPath: string) {
    if (this.regUrlPath.test(targetPath)) {
      return targetPath
    }
    const paths = this.aliasPaths
    const keys = Object.keys(paths)
    const pathSplit = targetPath.split('/')
    const aliasKey = keys.find(item =>
      pathSplit.find(item2 => {
        return item == item2
      })
    )

    if (aliasKey) {
      // 替换别名
      targetPath = targetPath.replace(aliasKey, paths[aliasKey])
      const fullpath = path.join(
        normalize(this.aliasBaseUrl || ''),
        normalize(this.workspacePath!),
        normalize(targetPath)
      )
      return fullpath
    } else {
      const fullpath = path.resolve(
        normalize(path.dirname(currentFilePath)),
        normalize(targetPath)
      )
      return fullpath
    }
  }
  // 获取片段提示
  async cover(text: string) {
    let info
    let match = this.getFilePath(text)
    if (!match) {
      return null
    }
    const targetPath = match[0]
    const currentFilePath = this.currentFileURI?.fsPath || ''
    // 判断是否为本地Path
    const isUrl = this.regUrlPath.test(match[0])
    if (isUrl) {
      info = await this.getImageInfo(targetPath, false)
    } else {
      const path = this.getAbsPath(currentFilePath, targetPath)
      info = await this.getImageInfo(path, true)
    }
    let result = ''
    if(this.config.RemMode){
      info.width = (info.width as number)/100
      info.height = (info.height as number)/100
      result = complied(this.config.remtpl, info as any)
    } else {
      result = complied(this.config.tpl, info as any)
    }
    // const complied = template(this.config.tpl)

    return {
      label: result,
      insertText: result
    }
  }



  private async getImageInfo(path: string, isLocal: boolean) {
    const param = isLocal
      ? path
      : ({
          url: path
        } as any)
    const instance = await read(param)
    const width = instance.getWidth()
    const height = instance.getHeight()
    return {
      width,
      height
    }
  }

  private getFilePath(str: string) {
    let match
    if (this.regUrlPath.test(str)) {
      return str.match(this.regUrlPath)
    }

    if (this.regFilePath.test(str)) {
      return str.match(this.regFilePath)
    }

    Object.keys(this.aliasPaths).forEach(item => {
      const originReg = this.getRegFilePath(item)
      if (originReg.test(str)) {
        match = str.match(originReg)
      }
    })
    return match || false
  }
}

export default ImgSnippet
