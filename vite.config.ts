import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'
import dts from 'vite-plugin-dts'
import crumbs from './src/vite-plugin'

export default defineConfig({
  server: {
    port: 3003,
  },
  build: {
    lib: {
      entry: {
        'router': resolve(__dirname, 'src/router.ts'),
        'vite-plugin': resolve(__dirname, 'src/vite-plugin.ts'),
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: [
        'vite',
        /^node:/,
      ],
    },
  },
  plugins: [
    dts({ rollupTypes: true }),
    crumbs(),
  ],
  test: {
    environment: 'happy-dom',
  },
})
