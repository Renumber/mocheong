import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'

const spaRoutes = ['guest-snap', 'guest-snap/album']

function copySpaFallbacks(): Plugin {
  return {
    name: 'copy-spa-fallbacks',
    closeBundle() {
      const indexPath = path.resolve('dist/index.html')
      if (!fs.existsSync(indexPath)) return
      const html = fs.readFileSync(indexPath)
      for (const route of spaRoutes) {
        const dir = path.resolve('dist', route)
        fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(path.join(dir, 'index.html'), html)
      }
    },
  }
}

export default defineConfig({
  plugins: [vue(), tailwindcss(), copySpaFallbacks()],
})
