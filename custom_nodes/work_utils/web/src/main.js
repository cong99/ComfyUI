// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App from './App.vue'
import Card from './components/Card.vue'
import Table from './components/Table.vue'
import TextPreviewPickDialog from './components/TextPreviewPickDialog.vue'

// Composables
import { createApp } from 'vue'

class WorkUtilsWebComp {
  table(el) {
    const app = createApp(Table)
    registerPlugins(app)
    app.mount(el)
  }

  textPickDialog(el, { onSave } = {}) {
    return new Promise((resolve) => {
      const app = createApp(TextPreviewPickDialog, {
        onCompMounted: comp => {
          resolve(comp)
        },
        onSave,
      })
      registerPlugins(app)
      app.mount(el)
    })
  }
}

globalThis._web = new WorkUtilsWebComp()
