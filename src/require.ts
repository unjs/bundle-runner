import NativeModule from 'module'
import { Files } from './bundle'
import { EvaluateModule } from './module'

export function createRequire (basedir: string, files: Files, evaluateModule: EvaluateModule): NodeJS.Require {
  const nativeRequire = NativeModule.createRequire(basedir)

  const resolveFromFiles = function (id: string) {
    const _id = id.replace(/^\.\//, '')
    if (files[_id]) {
      return _id
    }
  }

  function _resolve (id: string): string {
    return resolveFromFiles(id) || nativeRequire.resolve(id, {
      paths: [basedir]
    })
  }

  _resolve.paths = nativeRequire.resolve.paths.bind(nativeRequire.resolve)

  const _require: NodeJS.Require = function (id: string): any {
    const _resolvedFile = resolveFromFiles(id)
    if (_resolvedFile) {
      return evaluateModule(_resolvedFile, {})
    }

    return nativeRequire(_resolve(id))
  }

  _require.resolve = _resolve
  _require.cache = {}
  _require.main = undefined
  _require.extensions = nativeRequire.extensions

  return _require
}
