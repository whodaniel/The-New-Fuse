import { Plugin } from 'vite'
import path from 'path'

export function dependencyPlugin(): Plugin {
  return {
    name: 'dependency-resolver',
    resolveId(source) {
      const mapping: Record<string, string> = {
        'goober': path.resolve(process.cwd(), 'node_modules/goober/dist/goober.modern.js'),
        '@radix-ui/number': path.resolve(process.cwd(), 'node_modules/@radix-ui/number/dist/index.mjs'),
        '@floating-ui/dom': path.resolve(process.cwd(), 'node_modules/@floating-ui/dom/dist/floating-ui.dom.mjs')
      }
      
      if (source in mapping) {
        return mapping[source]
      }
    }
  }
}
