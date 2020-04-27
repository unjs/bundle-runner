import vm from 'vm'
import NativeModule from 'module'

export type Compile = (filename: string, code: string) => vm.Script

export function createCompile (): Compile {
  const _compileCache: { [key: string]: vm.Script } = {}

  return function compile (filename, code) {
    if (_compileCache[filename]) {
      return _compileCache[filename]
    }

    const wrapper = NativeModule.wrap(code)

    const script = new vm.Script(wrapper, {
      filename,
      displayErrors: true
    })

    _compileCache[filename] = script
    return script
  }
}
