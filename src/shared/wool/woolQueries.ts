import { queryOptions, useQuery } from '@tanstack/react-query'
import { fetchWoolWallet } from './woolApi'

// 양털은 여러 기능(양 먹이주기·우유와 치즈·섬 꾸미기·돌봄)이 같이 쓰는 숫자라 shared 에 둔다(CLAUDE.md 규칙 2-2).

export const woolKeys = {
  all: ['wool'] as const,
  wallet: () => [...woolKeys.all, 'wallet'] as const,
}

/**
 * 내 양털 잔액. 앱 시작 때 미리 받아 두고(`app/App.tsx`), 화면에 들어올 때마다 뒤에서 새로 받는다(staleTime 0).
 * 다시 받는 동안에는 직전 값을 그대로 보여준다.
 */
export const woolBalanceQueryOptions = () =>
  queryOptions({
    queryKey: woolKeys.wallet(),
    queryFn: fetchWoolWallet,
  })

/** 양털 잔액. 아직 한 번도 받지 못했으면 `undefined`(숫자 자리에 막대를 보여준다). */
export function useWoolBalance(): number | undefined {
  return useQuery({ ...woolBalanceQueryOptions(), select: (wallet) => wallet.balance }).data
}
