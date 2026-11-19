import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CareActionCategory } from './careActions'
import { completeCareAction, fetchCareActions, fetchTodayCareCompletions } from './careApi'

export const careKeys = {
  all: ['care'] as const,
  actions: (category: CareActionCategory) => [...careKeys.all, 'actions', category] as const,
  today: () => [...careKeys.all, 'today'] as const,
}

export const careActionsQueryOptions = (category: CareActionCategory) =>
  queryOptions({
    queryKey: careKeys.actions(category),
    queryFn: () => fetchCareActions(category),
  })

export const todayCareCompletionsQueryOptions = () =>
  queryOptions({
    queryKey: careKeys.today(),
    queryFn: fetchTodayCareCompletions,
  })

export function useCareActions(category: CareActionCategory) {
  return useQuery(careActionsQueryOptions(category))
}

export function useTodayCareCompletions() {
  return useQuery(todayCareCompletionsQueryOptions())
}

export function useCompleteCareAction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: completeCareAction,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: careKeys.today() }),
  })
}
