import type { RenderedHtml } from './types'

// Extract the <script> from page file and return it
export function extractScript(template: string | Element): { html: string | Element, script: string | null } {
  if (template instanceof Element)
    return { html: template, script: null }
  const tmpl = document.createElement('template')
  tmpl.innerHTML = template
  const scriptEl = tmpl.content.querySelector('script[type="module"]')
  const script = scriptEl?.textContent ?? null
  scriptEl?.remove()

  return {
    html: tmpl.innerHTML,
    script,
  }
}

// Converts string template into a piece of DOM. A template with a single root
// element yields that element, anything else yields a DocumentFragment
// containing every parsed node.
export function parseToHtml(template: string | Element): RenderedHtml {
  if (template instanceof Element)
    return template

  const tpl = document.createElement('template')
  tpl.innerHTML = template
  const content = tpl.content

  const meaningful = Array.from(content.childNodes).filter((node) => {
    if (node.nodeType === Node.ELEMENT_NODE)
      return true
    return node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim().length > 0
  })

  if (meaningful.length === 1 && meaningful[0].nodeType === Node.ELEMENT_NODE)
    return meaningful[0] as Element

  return content
}

// Takes in page's template and returns reference to the first non-script and
// non-style node. This method is only used when a script has already been detected
export function getPageRootElements(el: RenderedHtml): Element[] {
  return Array
    .from(el.children)
    .filter((el) => {
      const name = el.tagName.toLowerCase()
      return name !== 'script' && name !== 'style'
    })
}
