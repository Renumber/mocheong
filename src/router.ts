import { createRouter, createWebHistory } from 'vue-router'
import InvitationPage from './pages/InvitationPage.vue'
import AdminPage from './pages/AdminPage.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'invitation', component: InvitationPage },
    { path: '/admin', name: 'admin', component: AdminPage },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})
