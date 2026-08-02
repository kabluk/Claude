// Типы справочников (BUILD-SPEC §5). Публичные данные, ничего чувствительного.
// Поля name и address легальны только здесь — lint-minimize не сканирует data/.
import type { Lang } from '../src/lib/types'

export interface StateRec {
  code: string
  name: Record<Lang, string>
  circuit: number
  funded_representation: boolean
  notes: Record<Lang, string>
}

export interface CourtRec {
  slug: string
  name: string
  address: string
  state_code: string
}

// Полная директория из данных ICE (собраны Deportation Data Project).
// Только официальные факты: имя, адрес, округ, штат, федеральный округ.
// Часы и телефоны свиданий сюда НЕ входят — они волатильны, их берут
// со страницы ICE или звонком.
export interface DirectoryFacility {
  code: string
  name: string
  address: string
  city: string
  county: string
  state: string
  zip: string
  circuit: string
  field_office: string
}

export interface FacilityRec {
  slug: string
  code?: string
  name: string
  address: string
  phone: string
  hours: string
  phone_provider: string
  state_code: string
  court_slug: string
  notes: Record<Lang, string>
  visit?: Record<Lang, string[]>
}
