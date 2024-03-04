import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/router.ts'),
      name: 'crumbs',
      formats: ['es'],
      fileName: 'crumbs',
    },
    minify: false,
  },
  plugins: [dts({ rollupTypes: true })],
})
