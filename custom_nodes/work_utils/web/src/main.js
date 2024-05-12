/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App from './App.vue'
import Card from './components/Card.vue'
import Table from './components/Table.vue'

// Composables
import { createApp } from 'vue'

const app = createApp(Table)

registerPlugins(app)

app.mount('#app')

globalThis.createTable = function(el) {
  app.mount(el)
}

