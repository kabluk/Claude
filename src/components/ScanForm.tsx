import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isValidScanUrl, submitScan, ScannerUnavailableError } from '@/lib/scanner'
import { paths } from '@/lib/data'

export type ScanFormState = { kind: 'idle' } | { kind: 'submitting' } | { kind: 'error'; message: string }

// Единственный источник логики отправки скана из UI (CN-HERO, D-063):
// валидация URL, сабмит в Worker API и переход на /report/:id живут здесь,
// а НЕ дублируются между главной и /scan/. Разметку каждая страница рисует
// свою (hero крупнее, /scan/ — с выбором юрисдикции и Turnstile), но ошибки,
// состояния и критерий валидности URL у них физически общие.
export function useScanForm() {
  const navigate = useNavigate()
  const [url, setUrl] = useState('')
  const [state, setState] = useState<ScanFormState>({ kind: 'idle' })

  async function submit(opts?: { turnstileToken?: string; countryCode?: string }) {
    const trimmed = url.trim()
    if (!isValidScanUrl(trimmed)) {
      setState({ kind: 'error', message: 'Enter a full URL starting with http:// or https://.' })
      return
    }
    setState({ kind: 'submitting' })
    try {
      const { scanId } = await submitScan(trimmed, {
        ...(opts?.turnstileToken ? { turnstileToken: opts.turnstileToken } : {}),
        ...(opts?.countryCode ? { countryCode: opts.countryCode } : {}),
      })
      navigate(paths.report(scanId))
    } catch (err) {
      if (err instanceof ScannerUnavailableError) {
        setState({ kind: 'error', message: 'The scanner is not available on this deployment yet.' })
      } else {
        setState({
          kind: 'error',
          message: err instanceof Error ? err.message : 'Could not start the scan. Try again.',
        })
      }
    }
  }

  return { url, setUrl, state, submit }
}
