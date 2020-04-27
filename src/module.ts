import path from 'path'
import { RunningScriptOptions } from 'vm'
import { createCompile } from './compile'
import { createRequire } from './require'
import { Files } from './bundle'

const _global = {
  Buffer,
  URL,
  console,
  process,
  setTimeout,
  setInterval,
  setImmediate,
  clearTimeout,
  clearInterval,
  clearImmediate
}

export interface CreateEvaluateOptions {
  basedir?: string,
  runInNewContext?: 'once' | boolean,
  runningScriptOptions?: RunningScriptOptions
}

export type EvaluateModule = (filename: string, context: Object) => any

type Sandbox = typeof _global
type GetSandbox = (context?: object) => Sandbox

function createGetSandbox (once: boolean): GetSandbox {
  let _initialContext: Sandbox

  return function getSandbox (context = {}): Sandbox {
    if (!once) {
      return { ..._global, ...context }
    }
    return _initialContext || (_initialContext = { ..._global, ...context })
  }
}

function createModule (options: Partial<NodeJS.Module>): NodeJS.Module {
  return {
    require: options.require || require,
    id: options.id || 'default',
    filename: options.filename || 'default',
    parent: options.parent || null,
    paths: options.paths || [],
    exports: options.exports || {},
    loaded: options.loaded !== undefined ? options.loaded : false,
    children: options.children || []
  }
}

export function createEvaluateModule (files: Files, { basedir, runInNewContext, runningScriptOptions }: CreateEvaluateOptions): EvaluateModule {
  const _evalCache: { [key: string]: object } = {}

  const compile = createCompile()
  const require = createRequire(basedir || process.cwd(), files, evaluateModule)

  const getSandbox = runInNewContext
    ? createGetSandbox(runInNewContext === 'once')
    : null

  function evaluateModule (filename: string, context: Object) {
    if (_evalCache[filename]) {
      return _evalCache[filename]
    }

    const code = files[filename]
    const script = compile(filename, code)
    const compiledWrapper = getSandbox
      ? script.runInNewContext(getSandbox(context), runningScriptOptions)
      : script.runInThisContext(runningScriptOptions)

    const module = createModule({ filename, id: filename, require })
    compiledWrapper.call(module, module.exports, require, module, filename, path.dirname(filename))

    const res = Object.prototype.hasOwnProperty.call(module.exports, 'default')
      ? module.exports.default
      : module.exports

    _evalCache[filename] = res
    return res
  }

  return evaluateModule
}
