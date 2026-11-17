import { resetMockDb } from '@/shared/mock'
import { clearEntry } from './entry'

// 시연 초기화: 주소에 `?reset` 을 붙여 열면 가짜 DB 와 시작 흐름 기록(온보딩 봄·이번 세션 통과)을 지우고
// 처음 상태(스플래시부터)로 시작한다. 지운 뒤 주소에서 `?reset` 을 뗀다.
// main.tsx 가 라우터·화면보다 먼저 import 한다(라우터가 첫 주소를 읽기 전에 주소를 고쳐야 해서).
// API 연결 때 가짜 DB 와 함께 지운다.

const url = new URL(window.location.href)
if (url.searchParams.has('reset')) {
  resetMockDb()
  clearEntry()
  url.searchParams.delete('reset')
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
}
