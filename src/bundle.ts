import { isAbsolute, dirname } from 'path'
import fs from 'fs'
import { CreateEvaluateOptions, createEvaluateModule } from './module'
import { createSourceMap } from './source-map'

export type Files = { [name: string]: any }

export type CreateBundleOptions = CreateEvaluateOptions

export type Bundle = {
  basedir: string
  entry: string
  files: { [filename: string]: string }
  maps: { [filename: string]: string }
}

function loadBundle (bundle: Partial<Bundle> | string, basedir?: string): Bundle {
  let bundleFile = 'bundle.js'

  // Load bundle if given filepath
  if (typeof bundle === 'string' && /\.js(on)?$/.test(bundle) && isAbsolute(bundle)) {
    bundleFile = bundle

    if (!fs.existsSync(bundleFile)) {
      throw new Error(`Cannot locate bundle file: ${bundleFile}`)
    }

    bundle = fs.readFileSync(bundleFile, 'utf-8')

    if (/\.json$/.test(bundleFile)) {
      try {
        bundle = JSON.parse(bundle)
      } catch (e) {
        throw new Error(`Invalid JSON bundle file: ${bundleFile}`)
      }
    }
  }

  if (typeof bundle === 'string') {
    bundle = {
      basedir: basedir || dirname(bundleFile),
      maps: {},
      entry: bundleFile,
      files: {
        [bundleFile]: bundle
      }
    }
  }

  if (!bundle) {
    throw new Error('Cannot load bundle!')
  }

  if (!bundle.entry) {
    throw new Error('Invalid bundle! Entry missing')
  }

  if (!bundle.maps) {
    bundle.maps = {}
  }

  if (!bundle.files) {
    bundle.files = {}
  }

  bundle.basedir = basedir || bundle.basedir || dirname(bundleFile)

  return bundle as Bundle
}

export function createBundle (_bundle: Partial<Bundle> | string, options: CreateBundleOptions = {}) {
  const bundle = loadBundle(_bundle, options.basedir)
  const { rewriteErrorTrace } = createSourceMap(bundle.maps)

  const evaluateModule = createEvaluateModule(bundle.files, options)

  function evaluateEntry (context: object) {
    return evaluateModule(bundle.entry, context)
  }

  return {
    bundle,
    evaluateModule,
    evaluateEntry,
    rewriteErrorTrace
  }
}
