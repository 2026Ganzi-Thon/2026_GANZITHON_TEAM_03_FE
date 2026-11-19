import { resetMockIsland } from '@/shared/mock'
import { clearLegacyEntry, clearOnboardingSeen } from './entry'

// 시연 초기화: 주소에 `?reset` 을 붙여 열면 이 기기에 저장된 시연 값 — 섬 꾸미기에서 산 가구(가짜 DB)와 온보딩 본 기록 — 을 지우고
// 주소에서 `?reset` 을 뗀다. 서버 데이터(감정 기록·고민·양털 등)와 로그인 세션은 그대로다(로그아웃은 설정의 "계정 바꾸기").
// main.tsx 가 라우터·화면보다 먼저 import 한다(라우터가 첫 주소를 읽기 전에 주소를 고쳐야 해서).
// 섬 꾸미기 API 가 생기면 resetMockIsland 와 함께 지운다.

clearLegacyEntry()

const url = new URL(window.location.href)
if (url.searchParams.has('reset')) {
  resetMockIsland()
  clearOnboardingSeen()
  url.searchParams.delete('reset')
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
}
