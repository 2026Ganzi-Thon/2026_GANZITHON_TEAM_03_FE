/**
 * 비속어 검사(프론트 1차). 라이브러리 호출은 이 파일에서만 한다 — 교체하거나 서버 검열과 합칠 때 여기만 고친다.
 *
 * 방침: **애매하면 통과.** 욕이 아닌 글을 막는 것이 욕 하나를 놓치는 것보다 나쁘다(뒤에 서버 검열이 있어야 한다).
 *
 * - 라이브러리: korcen(`check`). 특수문자·숫자 치환(시1발, ㅅㅂ)을 해 준다.
 * - korcen은 띄어쓰기를 모두 지우고 찾아서 "다시 발견"→"시발", "개발 남아"→"개발남아"처럼 단어 경계를 넘는 오탐이 난다.
 *   그래서 **어절마다** 따로 검사하고, 한 글자 어절이 이어질 때만("시 발", "ㅅ ㅂ") 붙여서 검사한다.
 * - 초기 번들에 넣지 않으려고 제출할 때 `import()`로 불러온다(전체 index 대신 `checkBadLang` 하나만, gzip 약 8KB).
 */

/**
 * 욕이 아닌 뜻이 분명한 말. korcen에 넘기기 전에 `∅`로 바꿔 지운다(∅는 어떤 패턴에도 없어서 글자 이어짐도 끊는다).
 * 문장이 아니라 원인 단어 단위로 둔다.
 */
const NEUTRAL_WORDS: RegExp[] = [
  // "새끼"는 혼자서는 욕으로 보지 않는다(새끼를 낳다, 새끼 강아지, 내 새끼). 욕 조합은 SAEKKI_INSULT가 따로 잡는다
  /새끼/g,
  /세끼(?!야|들아)/g, // 하루 세끼
  /새까(?=맣|만|매|많)/g, // 새까맣다
  // 간지·한자어·지명·인명
  /병신년/g, // 丙申年
  /시바(?=견|이누)/g,
  /치발기/g,
  /시방/g, // 방언 "지금"
  /(?<=[\d일이삼사오육칠팔구십몇]\s*)개년/g, // 3개년
  /게놈/g,
  /애널리/g, // 애널리스트
  /자위(?=대|권|적)/g,
  /박정희|길라임/g,
  /운지(?=법)/g,
  // 일상 동사·표현
  /(?<=[보자])지(?=도|는|만|않|못|말|마|맙|요|\s*(?:않|못|말|마|맙)|\s*$|[?.!,~])/g, // 보지 마, 자지 못했다 — "지"만 지워 보/자를 남긴다
  /자지러/g,
  /꺼져(?=서|있|버|도|가|갔|간|갈|요)/g, // 불이 꺼져서
  /닥쳐(?=오|온|올|와|왔)/g, // 시련이 닥쳐와도
  /뒤져(?=서|도|봐|보|봤|본|볼|요)/g, // 가방을 뒤져서
  /뒤질세라/g,
  /[좇쫒]/g, // 꿈을 좇다, 쫒기다
  /조까지/g, // 1조까지
  /씨\s*발라(?=\s*(?:먹|내|서|줘|주|놓|낸))/g, // 씨 발라 먹다(요리)
  /깔보/g,
  /손꼽/g,
  /젖(?=나|만)/g, // 옷이 젖나요
  /텐가/g, // 어쩔 텐가
  /개(?=쉽|쎄)/g, // 개쉽다·개쎄다 — 강조 접두사 "개"는 욕으로 보지 않는다
  /개족보/g,
  /(?:엄마|아빠|어머니|아버지)(?=\s*없)/g, // 엄마 없는 집 — "애미없"은 그대로 잡힌다
]

/** "새끼"가 욕인 조합만 — 앞에 욕이 붙었거나, 사람을 부르는 "이 새끼야" 꼴 */
const SAEKKI_INSULT =
  /(?:개|씹|십|쌍|썅|좆|씨발|시발|병신|미친|느그|니미)새끼|(?:씹|십|쌍|썅|좆|씨발|시발|병신|미친)\s+새끼|개\s+새끼\s*(?:야|들아)|(?:^|\s)(?:이|저|그|요|이런|저런|그런)\s*새끼\s*(?:야|들아)/

/** korcen이 놓치는 흔한 표현 — 어절 안에서 기호를 지우고 찾는다("졸라"는 "엄마를 졸라서" 오탐이라 뺌) */
const EXTRA_PATTERNS = ['존나', '존내', 'ㅈㄴ', '씨이발', '시이발']

const letterCount = (word: string) => word.match(/[\p{L}\p{N}]/gu)?.length ?? 0

/** 어절 목록 + 한 글자 어절이 2개 이상 이어진 부분을 붙인 것("시 발" → "시발") */
function toSegments(text: string): string[] {
  const words = text.split(/\s+/).filter((word) => letterCount(word) > 0)
  const segments = [...words]
  let run: string[] = []
  for (const word of [...words, '']) {
    if (letterCount(word) === 1) {
      run.push(word)
      continue
    }
    if (run.length > 1) segments.push(run.join(''))
    run = []
  }
  return segments
}

type Check = (text: string) => boolean
let checkPromise: Promise<Check> | undefined

function loadCheck(): Promise<Check> {
  checkPromise ??= import('korcen/dist/checkBadLang').then((module) => module.check)
  return checkPromise
}

/** 비속어가 있으면 true. 빈 글은 false. */
export async function containsProfanity(text: string): Promise<boolean> {
  const lower = text.toLowerCase()
  if (SAEKKI_INSULT.test(lower)) return true

  const neutral = NEUTRAL_WORDS.reduce((acc, pattern) => acc.replace(pattern, '∅'), lower)
  const segments = toSegments(neutral)
  if (segments.length === 0) return false

  const compact = segments.map((segment) => segment.replace(/[^\p{L}]/gu, ''))
  if (compact.some((segment) => EXTRA_PATTERNS.some((pattern) => segment.includes(pattern)))) return true

  const check = await loadCheck()
  return segments.some((segment) => check(segment))
}
