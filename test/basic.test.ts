import { createBundle } from '../src'

describe('basic', () => {
  test('createBundle', () => {
    createBundle({ entry: 'entry.js' })
  })
})
