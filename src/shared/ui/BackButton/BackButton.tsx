import { forwardRef } from 'react'
import { IconButton } from '@/shared/ui/IconButton'
import type { IconButtonProps } from '@/shared/ui/IconButton'

export interface BackButtonProps extends Omit<IconButtonProps, 'icon' | 'aria-label'> {
  'aria-label'?: string
}

/** 화면 왼쪽 위 뒤로가기 화살표 */
export const BackButton = forwardRef<HTMLButtonElement, BackButtonProps>(function BackButton(
  { 'aria-label': ariaLabel = '뒤로 가기', iconSize = 28, ...rest },
  ref,
) {
  return <IconButton ref={ref} icon="arrow-left" iconSize={iconSize} aria-label={ariaLabel} {...rest} />
})
