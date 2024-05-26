/**
 * plugins/index.js
 *
 * Automatically included in `./src/main.js`
 */

// Plugins
import vuetify from './vuetify'
// import monaco from './monaco'

export function registerPlugins (app) {
  app.use(vuetify)
}
