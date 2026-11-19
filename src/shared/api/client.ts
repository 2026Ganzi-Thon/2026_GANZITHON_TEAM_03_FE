import axios from 'axios'
import type { AxiosError, AxiosRequestConfig } from 'axios'
import type { ApiErrorBody, ApiResponse, TokenResponse } from '@/shared/types'
import { ApiError, NETWORK_ERROR_CODE, TIMEOUT_ERROR_CODE } from './ApiError'
import { getAccessToken, notifyAuthLost, setAccessToken } from './token'

declare module 'axios' {
  // 이 인스턴스가 쓰는 요청별 옵션. 서버로 보내는 값이 아니다.
  // 선언 병합이라 원래 타입의 제네릭 매개변수(D)를 그대로 맞춰야 한다.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  interface AxiosRequestConfig<D = any> {
    /** true면 Access Token을 붙이지 않고 만료 재발급도 하지 않는다. */
    skipAuth?: boolean
    /** 만료 재발급 뒤 다시 보낸 요청인지. 한 번만 재시도하기 위한 표시 */
    retried?: boolean
  }
}

// 공통 접두사 /api/v1. VITE_API_URL이 비어 있으면 같은 출처의 /api/v1을 호출한다.
const API_ORIGIN = ((import.meta.env.VITE_API_URL as string | undefined) ?? '').replace(/\/+$/, '')

/** 서버가 응답하지 않을 때 기다리는 최대 시간 */
const TIMEOUT_MS = 10_000

type QueryValue = string | number | boolean | null | undefined

export interface RequestOptions {
  /** 쿼리 파라미터. null·undefined는 보내지 않는다. */
  query?: Record<string, QueryValue>
  headers?: Record<string, string>
  signal?: AbortSignal
  /** false면 Access Token을 붙이지 않고 만료 재발급도 하지 않는다. (회원가입·로그인 등) 기본 true */
  auth?: boolean
  /** 특정 흐름에서 쿠키(예: Google 로그인 challenge)를 명시적으로 주고받는다. */
  withCredentials?: boolean
  /**
   * `Idempotency-Key` 헤더. true면 새 UUID를 만들고, 문자열이면 그 값을 쓴다.
   * 같은 동작을 재시도할 때는 직전에 쓴 키를 그대로 넘긴다. (고민 작성, 돌봄 완료·취소, 휴식 시작)
   */
  idempotencyKey?: boolean | string
}

export function newIdempotencyKey() {
  return crypto.randomUUID()
}

/**
 * axios 인스턴스. 보통은 아래 `api`를 쓰고, 업로드 진행률처럼 axios 기능이 직접 필요할 때만 쓴다.
 * 쿠키(Refresh Token)가 오가도록 `withCredentials`를 켰다. 서버 CORS도 자격 증명을 허용해야 한다.
 */
export const http = axios.create({
  baseURL: `${API_ORIGIN}/api/v1`,
  withCredentials: true,
  timeout: TIMEOUT_MS,
  headers: { Accept: 'application/json' },
})

/** axios 오류를 ApiError로 바꾼다. 서버가 응답했으면 그 본문을, 아니면 네트워크·시간 초과 오류를 만든다. */
function toApiError(error: AxiosError): ApiError {
  if (error.response) {
    return new ApiError(error.response.status, (error.response.data ?? {}) as Partial<ApiErrorBody>)
  }
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return new ApiError(0, { code: TIMEOUT_ERROR_CODE, message: '응답이 늦어지고 있어요. 잠시 후 다시 시도해 주세요.' })
  }
  return new ApiError(0, { code: NETWORK_ERROR_CODE, message: '네트워크 연결을 확인해 주세요.' })
}

// 요청마다 최신 Access Token을 붙인다. 재발급 뒤 다시 보내는 요청도 여기서 새 토큰으로 바뀐다.
http.interceptors.request.use((config) => {
  const token = config.skipAuth ? null : getAccessToken()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

http.interceptors.response.use(undefined, async (error: unknown) => {
  // 직접 취소한 요청과 axios 밖의 오류는 그대로 던진다.
  if (!axios.isAxiosError(error) || axios.isCancel(error)) throw error

  const apiError = toApiError(error)
  const config = error.config

  // Access Token 만료일 때만 재발급한다. 모든 401을 재발급 대상으로 취급하지 않는다.
  const expired =
    config !== undefined &&
    !config.skipAuth &&
    !config.retried &&
    apiError.status === 401 &&
    apiError.code === 'AUTH_ACCESS_TOKEN_EXPIRED'

  if (!expired) throw apiError

  await refreshAccessToken()
  config.retried = true // 원래 요청은 최대 한 번만 다시 보낸다.
  return http.request(config)
})

// ── 토큰 재발급 ────────────────────────────────────────────────────────────────

let refreshing: Promise<void> | null = null

/**
 * 쿠키의 Refresh Token으로 Access Token을 다시 받는다.
 * 동시에 여러 요청이 만료를 만나도 재발급은 한 번만 실행하고 결과를 함께 쓴다.
 * (같은 Refresh Token으로 두 번 호출하면 두 번째가 REUSED로 세션이 끊길 수 있다.)
 */
export function refreshAccessToken(): Promise<void> {
  refreshing ??= http
    .post<ApiResponse<TokenResponse>>('/auth/refresh', undefined, { skipAuth: true })
    .then((response) => {
      setAccessToken(response.data.data.accessToken)
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

/** 성공하면 응답의 `data`를 꺼내 돌려주고(204는 undefined), 실패하면 ApiError를 던진다. */
async function request<T>(config: AxiosRequestConfig, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { ...options.headers }

  // 키는 한 번만 만든다. 만료 재발급 뒤 다시 보내는 요청도 같은 키를 쓰게 하기 위해서다.
  if (options.idempotencyKey) {
    headers['Idempotency-Key'] =
      options.idempotencyKey === true ? newIdempotencyKey() : options.idempotencyKey
  }

  const response = await http.request<ApiResponse<T>>({
    ...config,
    headers,
    params: options.query,
    signal: options.signal,
    skipAuth: options.auth === false,
    ...(options.withCredentials !== undefined && { withCredentials: options.withCredentials }),
  })

  if (response.status === 204) return undefined as T
  return response.data.data
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
  get: <T>(url: string, options?: RequestOptions) => request<T>({ method: 'GET', url }, options),
  post: <T>(url: string, data?: unknown, options?: RequestOptions) =>
    request<T>({ method: 'POST', url, data }, options),
  put: <T>(url: string, data?: unknown, options?: RequestOptions) =>
    request<T>({ method: 'PUT', url, data }, options),
  patch: <T>(url: string, data?: unknown, options?: RequestOptions) =>
    request<T>({ method: 'PATCH', url, data }, options),
  delete: <T = void>(url: string, options?: RequestOptions) =>
    request<T>({ method: 'DELETE', url }, options),
}
