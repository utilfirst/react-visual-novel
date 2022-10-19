import {defineConfig} from 'tsup'

export default defineConfig([
  {
    entry: ['./index.ts'],
    format: ['esm'],
    platform: 'node',
    target: 'node14',
    dts: true,
  },
])
