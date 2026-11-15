import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/app/global.css'
import App from '@/app/App'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/app/queryClient'
import { registerSW } from 'virtual:pwa-register'

registerSW({ immediate: true })

// iOS Safari 는 viewport 의 user-scalable=no 를 무시하고 핀치 확대를 하므로 제스처 시작을 막는다.
// (접근성 참고: 확대를 막으면 시력이 약한 사용자가 글자를 키울 수 없다)
for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
  document.addEventListener(type, (event) => event.preventDefault())
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
