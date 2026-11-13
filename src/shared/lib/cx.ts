/** 클래스 이름을 합친다. falsy 값은 버린다. */
export function cx(...names: Array<string | false | null | undefined>) {
  return names.filter(Boolean).join(' ')
}
