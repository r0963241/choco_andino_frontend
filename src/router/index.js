import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/homeView.vue'
import LoginView from '../views/loginView.vue'
import DashboardView from '../views/dashboardView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView
    }
  ]
})

export default router
