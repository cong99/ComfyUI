import './style.css'
import App from './App.vue'

const { createApp } = Vue
const { createVuetify } = Vuetify

const vuetify = createVuetify()

createApp(App).use(vuetify).mount('#app')
