import { Button, Toggle } from '@/shared/ui'
import { cx } from '@/shared/lib/cx'
import { useMarketingConsent } from './useMarketingConsent'
import type { ConsentItem, ConsentType } from './types'
import styles from './MarketingConsent.module.css'

// 임의 결정(확인 필요): 마케팅 수신 동의 토글·동의 내역은 시안(290:891)에 없어 "알림 설정"의 야간 알림 아래에 같은 줄 모양으로 둠.
// 저장하기 버튼과 따로 누르는 즉시 저장한다(낙관적 갱신 + 실패 시 되돌림) — 수신 동의는 이력으로 남는 별도 API 라서.

const CONSENT_LABELS: Record<ConsentType, string> = {
  TERMS: '서비스 이용약관 (필수)',
  PRIVACY: '개인정보 처리방침 (필수)',
  MARKETING: '마케팅 정보 수신 (선택)',
}

const ORDER: ConsentType[] = ['TERMS', 'PRIVACY', 'MARKETING']

const seoulDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' })

/** 기록 시각을 서울 날짜 `YYYY.MM.DD` 로 */
function formatRecordedAt(iso: string) {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '' : seoulDate.format(date).replaceAll('-', '.')
}

function describe(item: ConsentItem | undefined) {
  if (!item) return '기록 없음'
  return `${item.termsVersion} · ${formatRecordedAt(item.recordedAt)} ${item.agreed ? '동의' : '철회'}`
}

/** 설정의 마케팅 정보 수신 토글 + 약관별 최근 동의 내역(버전·일시). 처음 받는 동안 같은 크기의 자리를 먼저 그린다. */
export function MarketingConsent() {
  const { state, save, retry, setMarketing } = useMarketingConsent()
  const items = state.status === 'success' ? state.items : []
  const marketing = items.find((item) => item.consentType === 'MARKETING')
  const saving = save.status === 'saving'

  const statusText =
    save.status === 'saving'
      ? '저장하는 중...'
      : save.status === 'saved'
        ? save.agreed
          ? '마케팅 정보 수신에 동의했어요.'
          : '마케팅 정보 수신 동의를 철회했어요.'
        : save.status === 'failed'
          ? save.message
          : ''

  return (
    <div className={styles.root} aria-busy={state.status === 'loading' || saving}>
      <Toggle
        className={styles.toggle}
        name="marketingConsent"
        // 저장 중에는 누른 값을 바로 보여준다(캐시 낙관 갱신은 진행 중 조회 취소를 기다린 뒤라 한 박자 늦다)
        checked={save.status === 'saving' ? save.agreed : (marketing?.agreed ?? false)}
        disabled={state.status !== 'success' || saving}
        onChange={(event) => setMarketing(event.currentTarget.checked)}
      >
        마케팅 정보 수신 (선택)
      </Toggle>
      {/* 저장 결과 한 줄 — 비어 있어도 자리를 차지해 아래가 밀리지 않는다 */}
      <p className={cx(styles.status, save.status === 'failed' && styles.statusError)} role="status">
        {statusText}
      </p>

      <section className={styles.history} aria-labelledby="settings-consents">
        <h3 id="settings-consents" className={styles.historyTitle}>
          약관 동의 내역
        </h3>
        {state.status === 'error' ? (
          // 임의 결정(확인 필요): 불러오기 실패 — 시안 없음, 내 정보 실패 안내와 같은 수준. 목록과 같은 높이
          <div className={styles.historyError} role="alert">
            <p>동의 내역을 불러오지 못했어요.</p>
            <Button type="button" variant="outline" size="sm" onClick={retry}>
              다시 시도
            </Button>
          </div>
        ) : (
          <dl className={styles.list}>
            {ORDER.map((type) => (
              <div key={type} className={styles.row}>
                <dt>{CONSENT_LABELS[type]}</dt>
                <dd>
                  {state.status === 'loading' ? (
                    <span className={styles.skeleton} aria-hidden="true" />
                  ) : (
                    describe(items.find((item) => item.consentType === type))
                  )}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </section>
    </div>
  )
}
