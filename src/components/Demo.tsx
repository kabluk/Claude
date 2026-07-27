import { useEffect, useRef, useState } from 'react'
import type { HomeContent } from '@/lib/types'

// Живая демонстрация на главной: вопрос → подсвечивается ответ → вырастает
// задача со строкой «почему в списке». Весит килобайты, объясняет продукт
// без чтения. Уважает prefers-reduced-motion: цикл останавливается,
// показывается один завершённый сценарий.
export function Demo({ c }: { c: HomeContent }) {
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState<'q' | 'pick' | 'task'>('q')
  const [reduced, setReduced] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    if (reduced) {
      setPhase('task')
      return
    }
    setPhase('q')
    timers.current.push(setTimeout(() => setPhase('pick'), 1100))
    timers.current.push(setTimeout(() => setPhase('task'), 2100))
    timers.current.push(
      setTimeout(() => setIdx((i) => (i + 1) % c.scenarios.length), 5200),
    )
    return () => timers.current.forEach(clearTimeout)
  }, [idx, reduced, c.scenarios.length])

  const s = c.scenarios[idx]

  return (
    <div className="demo">
      <div className="dtop">
        <div className="dots">
          <i />
          <i />
          <i />
        </div>
        <div className="lbl">{c.demoLabel}</div>
      </div>
      <div className="dstage" aria-live="polite">
        {phase !== 'task' ? (
          <>
            <div className="dq">{s.q}</div>
            <div className="dh">{s.h}</div>
            {s.a.map((x, k) => (
              <div key={k} className={`da ${phase === 'pick' && k === s.pick ? 'pick' : ''}`}>
                {x}
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="dq">{c.demoTaskLabel}</div>
            <div className="dtask in">
              <b>{s.t[0]}</b>
              <p>{s.t[1]}</p>
              <div className="why">
                {c.demoWhy}: {s.t[2]}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
