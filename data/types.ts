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

// Статистика длительности содержания по учреждению (агрегат из detention
// stays, Deportation Data Project). Только числа, никаких персональных данных.
export interface StayStat {
  med: number
  p25: number
  p75: number
  n: number
}
export interface StaysData {
  meta: {
    source: string
    period: string
    nationalMedian: number
    n: number
    minN: number
    leave: [string, number][]
  }
  byCode: Record<string, StayStat>
}

// Офисы ICE (поля/суб-офисы) — куда обращаться и где отмечаться.
export interface OfficeRec {
  name: string
  type: string
  aor: string
  address: string
  city: string
  state: string
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
