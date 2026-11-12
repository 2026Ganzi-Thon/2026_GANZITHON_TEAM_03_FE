import type { CSSProperties, ComponentPropsWithoutRef } from 'react'
import { cx } from '@/shared/lib/cx'
import alertCircle from '@/assets/icons/alert-circle.svg'
import arrowLeft from '@/assets/icons/arrow-left.svg'
import arrowRightCircle from '@/assets/icons/arrow-right-circle.svg'
import cave from '@/assets/icons/tab-cave.svg'
import check from '@/assets/icons/check.svg'
import cheese from '@/assets/icons/tab-cheese.svg'
import chevronDown from '@/assets/icons/chevron-down.svg'
import chevronRight from '@/assets/icons/chevron-right.svg'
import cloud from '@/assets/icons/tab-cloud.svg'
import home from '@/assets/icons/tab-home.svg'
import island from '@/assets/icons/island.svg'
import library from '@/assets/icons/library.svg'
import settings from '@/assets/icons/settings.svg'
import sheep from '@/assets/icons/tab-sheep.svg'
import styles from './Icon.module.css'

/**
 * 단색 아이콘 모음. SVG 를 mask 로 쓰기 때문에 색은 `color`(currentColor)를 따른다.
 * 새 아이콘은 `src/assets/icons/` 에 SVG 를 넣고 여기에 한 줄 추가한다.
 */
const ICONS = {
  'alert-circle': alertCircle,
  'arrow-left': arrowLeft,
  'arrow-right-circle': arrowRightCircle,
  cave,
  check,
  cheese,
  'chevron-down': chevronDown,
  'chevron-right': chevronRight,
  cloud,
  home,
  island,
  library,
  settings,
  sheep,
} as const

export type IconName = keyof typeof ICONS

export interface IconProps extends Omit<ComponentPropsWithoutRef<'span'>, 'children'> {
  name: IconName
  /** 한 변 길이(px). 기본 24 */
  size?: number
  /** 의미가 있는 아이콘이면 읽어줄 이름. 없으면 장식으로 보고 스크린리더에서 숨긴다 */
  label?: string
}

export function Icon({ name, size = 24, label, className, style, ...rest }: IconProps) {
  const mask = `url("${ICONS[name]}")`
  const iconStyle: CSSProperties = {
    width: size,
    height: size,
    maskImage: mask,
    WebkitMaskImage: mask,
    ...style,
  }

  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cx(styles.icon, className)}
      style={iconStyle}
      {...rest}
    />
  )
}
