import fs from 'node:fs/promises'

/**
 * Simple vite plugin which transforms any `.page.html` into vite consumable `.html?raw`.
 * This is purely just a syntax improvement
 */
export default function crumbs() {
  // TODO: figure out if we can provide types to the mount() methods and the return object
  return {
    name: 'page-html-as-raw',
    enforce: 'pre',
    async load(id: any) {
      const [file] = id.split('?')
      if (!file.endsWith('.page.html'))
        return null

      const content = await fs.readFile(file, 'utf-8')
      return `export default ${JSON.stringify(content)}`
    },
  } as const
}
