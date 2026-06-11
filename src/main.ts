import { createApp, type Directive } from 'vue'
import './style.css'
import App from './App.vue'

/** v-reveal: 뷰포트 진입 시 페이드인 */
const reveal: Directive<HTMLElement> = {
  mounted(el) {
    el.classList.add('reveal')
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add('reveal-visible')
            observer.unobserve(el)
          }
        }
      },
      { threshold: 0.15 },
    )
    observer.observe(el)
  },
}

createApp(App).directive('reveal', reveal).mount('#app')
