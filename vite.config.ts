import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

const root = path.dirname(fileURLToPath(import.meta.url))
const amplifyOutputs = existsSync(path.resolve(root, 'amplify_outputs.json'))
  ? path.resolve(root, 'amplify_outputs.json')
  : path.resolve(root, 'src/amplify-outputs.stub.json')

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@amplify-outputs': amplifyOutputs,
    },
  },
})
