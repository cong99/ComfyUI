import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import externalGlobals from "rollup-plugin-external-globals";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      // 不打包依赖
      external: ['vue', 'vuetify'],
      plugins: [
        // 不打包依赖映射的对象
        externalGlobals({
          vue: 'Vue',
          vuetify: 'Vuetify',
          'vuetify/components': 'Vuetify.components',
          'vuetify/directives': 'Vuetify.directives'
        }),
      ],
    },
  },
})
