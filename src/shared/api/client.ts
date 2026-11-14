import type { ApiErrorBody, ApiResponse, TokenResponse } from '@/shared/types'
import { ApiError, NETWORK_ERROR_CODE } from './ApiError'
import { getAccessToken, notifyAuthLost, setAccessToken } from './token'

// 공통 접두사 /api/v1. VITE_API_URL이 비어 있으면 같은 출처의 /api/v1을 호출한다.
const API_ORIGIN = ((import.meta.env.VITE_API_URL as string | undefined) ?? '').replace(/\/+$/, '')
const BASE_URL = `${API_ORIGIN}/api/v1`

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
type QueryValue = string | number | boolean | null | undefined

export interface RequestOptions {
  /** 쿼리 파라미터. null·undefined는 보내지 않는다. */
  query?: Record<string, QueryValue>
  headers?: Record<string, string>
  signal?: AbortSignal
  /** false면 Access Token을 붙이지 않고 만료 재발급도 하지 않는다. (회원가입·로그인 등) 기본 true */
  auth?: boolean
  /**
   * `Idempotency-Key` 헤더. true면 새 UUID를 만들고, 문자열이면 그 값을 쓴다.
   * 같은 동작을 재시도할 때는 직전에 쓴 키를 그대로 넘긴다. (고민 작성, 돌봄 완료·취소, 휴식 시작)
   */
  idempotencyKey?: boolean | string
}

export function newIdempotencyKey() {
  return crypto.randomUUID()
}

function buildUrl(path: string, query?: RequestOptions['query']) {
  const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
  if (!query) return url

  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== null && value !== undefined) params.set(key, String(value))
  }
  const queryString = params.toString()
  return queryString ? `${url}?${queryString}` : url
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return undefined
  }
}

/** 한 번 호출한다. 성공하면 `data`를 꺼내 돌려주고(204는 undefined), 실패하면 ApiError를 던진다. */
async function send<T>(method: Method, path: string, body: unknown, options: RequestOptions): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json', ...options.headers }

  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const token = options.auth === false ? null : getAccessToken()
  if (token) headers.Authorization = `Bearer ${token}`

  if (options.idempotencyKey) {
    headers['Idempotency-Key'] =
      options.idempotencyKey === true ? newIdempotencyKey() : options.idempotencyKey
  }

  let response: Response
  try {
    response = await fetch(buildUrl(path, options.query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      // Refresh Token 쿠키가 오가려면 필요하다. 서버 CORS도 자격 증명을 허용해야 한다.
      credentials: 'include',
      signal: options.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(0, { code: NETWORK_ERROR_CODE, message: '네트워크 연결을 확인해 주세요.' })
  }

  if (response.status === 204) return undefined as T

  const json = await readJson(response)

  if (!response.ok) throw new ApiError(response.status, (json ?? {}) as Partial<ApiErrorBody>)

  return (json as ApiResponse<T>).data
}

// ── 토큰 재발급 ────────────────────────────────────────────────────────────────

let refreshing: Promise<void> | null = null

/**
 * 쿠키의 Refresh Token으로 Access Token을 다시 받는다.
 * 동시에 여러 요청이 만료를 만나도 재발급은 한 번만 실행하고 결과를 함께 쓴다.
 * (같은 Refresh Token으로 두 번 호출하면 두 번째가 REUSED로 세션이 끊길 수 있다.)
 */
export function refreshAccessToken(): Promise<void> {
  refreshing ??= send<TokenResponse>('POST', '/auth/refresh', undefined, { auth: false })
    .then((tokens) => {
      setAccessToken(tokens.accessToken)
    })
    .catch((error: unknown) => {
      notifyAuthLost()
      throw error
    })
    .finally(() => {
      refreshing = null
    })

  return refreshing
}

/**
 * 앱을 처음 열 때(새로고침 포함) 한 번 호출해 로그인 상태를 복원한다.
 * Access Token은 메모리에만 있어서 새로고침하면 사라지므로 쿠키로 다시 받는다.
 * 성공하면 true, 로그인 상태가 아니면 false.
 */
export async function restoreSession(): Promise<boolean> {
  try {
    await refreshAccessToken()
    return true
  } catch {
    return false
  }
}

// ── 공개 호출 ──────────────────────────────────────────────────────────────────

async function request<T>(method: Method, path: string, body: unknown, options: RequestOptions = {}): Promise<T> {
  try {
    return await send<T>(method, path, body, options)
  } catch (error) {
    // Access Token 만료일 때만 재발급한다. 모든 401을 재발급 대상으로 취급하지 않는다.
    const expired =
      options.auth !== false &&
      error instanceof ApiError &&
      error.status === 401 &&
      error.code === 'AUTH_ACCESS_TOKEN_EXPIRED'

    if (!expired) throw error

    await refreshAccessToken()
    // 원래 요청은 최대 한 번만 다시 보낸다.
    return send<T>(method, path, body, options)
  }
}

/**
 * API 인스턴스. 성공하면 응답의 `data`를 돌려주고, 실패하면 `ApiError`를 던진다.
 *
 * ```ts
 * const emotions = await api.get<EmotionsResponse>('/emotions')
 * await api.post<CreateConcernResponse>('/concerns', body, { idempotencyKey: true })
 * await api.delete('/emotion-records/101') // 204 → undefined
 * ```
 */
export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('POST', path, body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PUT', path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PATCH', path, body, options),
  delete: <T = void>(path: string, options?: RequestOptions) => request<T>('DELETE', path, undefined, options),
}
