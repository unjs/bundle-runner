import { SourceMapConsumer } from 'source-map'

export type RawSourceMaps = {
  [source: string]: string
}

type SourceMapConsumers = { [source: string]: Promise<SourceMapConsumer> }

const filenameRE = /\(([^)]+\.js):(\d+):(\d+)\)$/
const webpackRE = /^webpack:\/\/\//

export function createSourceMap (rawMaps: RawSourceMaps = {}) {
  const _consumersCache: SourceMapConsumers = {}

  function getConsumer (source: string) {
    const rawMap = rawMaps[source]
    if (!rawMap) {
      return
    }
    if (!_consumersCache[source]) {
      _consumersCache[source] = Promise.resolve(new SourceMapConsumer(rawMap))
    }
    return _consumersCache[source]
  }

  async function rewriteTraceLine (_trace: string) {
    const m = _trace.match(filenameRE)

    if (!m) {
      return _trace
    }

    const consumer = await getConsumer(m[1])
    if (!consumer) {
      return _trace
    }

    const originalPosition = consumer.originalPositionFor({
      line: Number(m[2]),
      column: Number(m[3])
    })

    if (!originalPosition.source) {
      return _trace
    }

    const { source, line, column } = originalPosition
    const mappedPosition = `(${source.replace(webpackRE, '')}:${line}:${column})`
    const trace = _trace.replace(filenameRE, mappedPosition)
    return trace
  }

  async function rewriteErrorTrace (err: Error): Promise<Error> {
    if (err && typeof err.stack === 'string') {
      const stack = err.stack.split('\n')
      const newStack = await Promise.all(stack.map(rewriteTraceLine))
      err.stack = newStack.join('\n')
    }
    return err
  }

  return {
    rewriteErrorTrace
  }
}
