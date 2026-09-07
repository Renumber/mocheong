import { createRouter, createWebHistory } from 'vue-router'
import InvitationView from '../views/InvitationView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'invitation', component: InvitationView },
    { path: '/guest-snap', redirect: { path: '/', hash: '#guest-snap' } },
    {
      path: '/guest-snap/album',
      name: 'guest-snap-album',
      component: () => import('../views/GuestSnapAlbum.vue'),
    },
  ],
  scrollBehavior(to) {
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
})
