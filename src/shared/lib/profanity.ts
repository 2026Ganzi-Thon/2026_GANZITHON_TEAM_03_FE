/**
 * 비속어 검사(프론트 1차). 라이브러리 호출은 이 파일에서만 한다 — 교체하거나 서버 검열과 합칠 때 여기만 고친다.
 *
 * - 라이브러리: korcen(`check`). 띄어쓰기 제거·특수문자/숫자 치환(시1발, ㅅㅂ, 시 발)을 해 준다.
 * - 초기 번들에 넣지 않으려고 제출할 때 `import()`로 불러온다(전체 index 대신 `checkBadLang` 하나만, gzip 약 9KB).
 * - 프론트 검사는 우회할 수 있다. 막는 것은 결국 서버 검열이어야 한다.
 */

/** korcen이 놓치는 흔한 표현 — 공백·기호를 지운 글에서 찾는다("졸라"는 "엄마를 졸라서" 오탐이라 뺌) */
const EXTRA_PATTERNS = ['존나', '존내', 'ㅈㄴ', '씨이발', '시이발']

/**
 * korcen이 띄어쓰기를 지우고 찾아서 생기는 오탐. 검사 전에 지운다.
 * "새끼 고양이"처럼 짐승 새끼를 뜻하는 말만 — 앞에 "개"가 붙으면(개새끼) 지우지 않는다.
 */
const ALLOWED_PHRASE = /(?<!개\s*)새끼\s*(고양이|강아지|오리|돼지|곰|새|양|손가락|발가락)/g

type Check = (text: string) => boolean
let checkPromise: Promise<Check> | undefined

function loadCheck(): Promise<Check> {
  checkPromise ??= import('korcen/dist/checkBadLang').then((module) => module.check)
  return checkPromise
}

/** 비속어가 있으면 true. 빈 글은 false. */
export async function containsProfanity(text: string): Promise<boolean> {
  const cleaned = text.replace(ALLOWED_PHRASE, ' ')
  const compact = cleaned.toLowerCase().replace(/[^\p{L}]/gu, '')
  if (compact === '') return false
  if (EXTRA_PATTERNS.some((pattern) => compact.includes(pattern))) return true

  const check = await loadCheck()
  // korcen은 공백뿐인 글에 예외를 던진다
  return cleaned.trim() === '' ? false : check(cleaned)
}
