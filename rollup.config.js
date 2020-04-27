import NativeModule from 'module'
import typescript from '@rollup/plugin-typescript'

export default [
  {
    input: './src/index.ts',
    external: NativeModule.builtinModules,
    output: [
      { file: './dist/bundle-runner.cjs.js', format: 'cjs' },
      { file: './dist/bundle-runner.esm.js', format: 'esm' }
    ],
    plugins: [
      typescript()
    ]
  }
]
