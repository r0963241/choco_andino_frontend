import { createApp } from 'vue'
import App from './App.vue'
import router from './router' // 1. IMPORT MY ROUTER MAP HERE!
import './assets/main.css' // IMPORT CSS STYLE SHEET

const app = createApp(App)

app.use(router) // 2. TEACH VUE HOW TO SWITCH PAGES!

app.mount('#app')

