// Типы справочников (BUILD-SPEC §5). Публичные данные, ничего чувствительного.
// Поля name и address легальны только здесь — lint-minimize не сканирует data/.
import type { Lang } from '../src/lib/types'

export interface StateRec {
  code: string
  name: Record<Lang, string>
  circuit: number
  funded_representation: boolean
  bond_funds: { label: string; url: string }[]
  notes: Record<Lang, string>
}

export interface CourtRec {
  slug: string
  name: string
  address: string
  state_code: string
}

export interface FacilityRec {
  slug: string
  name: string
  address: string
  phone: string
  hours: string
  phone_provider: string
  state_code: string
  court_slug: string
  notes: Record<Lang, string>
}
