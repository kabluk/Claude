// Память опроса на время открытой вкладки. Живёт на уровне модуля:
// переходы по сайту (SPA) её не сбрасывают, поэтому «Назад» со страницы
// подробной инструкции возвращает к готовому списку, а не к первому
// вопросу. Никакого storage: закрыли или перезагрузили вкладку —
// ничего не осталось, ровно как обещает страница «Ваши данные».
import type { Ans } from './intake'

interface IntakeSnapshot {
  ans: Ans
  i: number
  fin: boolean
}

let snapshot: IntakeSnapshot | null = null

export function getIntakeSnapshot(): IntakeSnapshot | null {
  return snapshot
}

export function saveIntakeSnapshot(s: IntakeSnapshot): void {
  snapshot = s
}

export function clearIntakeSnapshot(): void {
  snapshot = null
}
