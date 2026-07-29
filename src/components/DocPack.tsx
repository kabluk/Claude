import { useEffect, useRef, useState } from 'react'
import type { UIStrings } from '@/lib/types'
import {
  type DocPhoto,
  type PacketMeta,
  listPhotos,
  putPhoto,
  deletePhoto,
  clearPhotos,
  compressImage,
  getLastPacket,
  setLastPacket,
} from '@/lib/docdb'
import { buildPdfParts, type PdfPart } from '@/lib/docpdf'

// Сборщик пакета документов (DOCS-AND-FIXES часть 1). Фото сжимаются
// при добавлении, живут в IndexedDB этого браузера и собираются в PDF
// с титульным листом. Сервер не участвует ни на одном шаге.

// Порядок разделов = группировка по факторам досье, не по типам файлов
export const SECTIONS = ['home', 'years', 'family', 'work', 'courts', 'court', 'med', 'other'] as const

function today(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function DocPack({ ui }: { ui: UIStrings }) {
  const d = ui.docPack
  const [photos, setPhotos] = useState<DocPhoto[]>([])
  const [adding, setAdding] = useState<string | null>(null)
  const [building, setBuilding] = useState(false)
  const [anum, setAnum] = useState('')
  const [parts, setParts] = useState<(PdfPart & { url: string })[] | null>(null)
  const [confirmDel, setConfirmDel] = useState(false)
  const urls = useRef(new Map<string, string>())
  const canShare = typeof navigator !== 'undefined' && !!navigator.share

  useEffect(() => {
    listPhotos().then((ps) => setPhotos(ps.sort((a, b) => a.ts - b.ts))).catch(() => {})
    const u = urls.current
    return () => {
      u.forEach((v) => URL.revokeObjectURL(v))
      u.clear()
    }
  }, [])

  const thumb = (p: DocPhoto) => {
    let u = urls.current.get(p.id)
    if (!u) {
      u = URL.createObjectURL(p.blob)
      urls.current.set(p.id, u)
    }
    return u
  }

  async function addFiles(sec: string, files: FileList | null) {
    if (!files?.length) return
    setAdding(sec)
    try {
      // по одному файлу за раз: пачка изображений кладёт вкладку на слабом телефоне
      for (const f of Array.from(files)) {
        const blob = await compressImage(f)
        const p: DocPhoto = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          sec,
          label: '',
          blob,
          ts: Date.now(),
        }
        await putPhoto(p)
        setPhotos((prev) => [...prev, p])
      }
    } finally {
      setAdding(null)
    }
  }

  async function remove(id: string) {
    await deletePhoto(id)
    const u = urls.current.get(id)
    if (u) {
      URL.revokeObjectURL(u)
      urls.current.delete(id)
    }
    setPhotos((prev) => prev.filter((p) => p.id !== id))
  }

  async function setLabel(id: string, label: string) {
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, label } : p)))
    const p = photos.find((x) => x.id === id)
    if (p) await putPhoto({ ...p, label })
  }

  async function build() {
    setBuilding(true)
    setParts(null)
    try {
      const prev = await getLastPacket().catch(() => undefined)
      const packetN = (prev?.n ?? 0) + 1
      const date = today()
      const digits = anum.replace(/\D/g, '')
      const res = await buildPdfParts({
        photos,
        order: [...SECTIONS],
        d,
        anum: digits.length === 8 ? '0' + digits : digits,
        packetN,
        prev: prev as PacketMeta | undefined,
        date,
      })
      await setLastPacket({ n: packetN, date }).catch(() => {})
      setParts(res.map((p) => ({ ...p, url: URL.createObjectURL(p.blob) })))
    } finally {
      setBuilding(false)
    }
  }

  async function share(p: PdfPart) {
    const file = new File([p.blob], p.name, { type: 'application/pdf' })
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file] }).catch(() => {})
    }
  }

  async function wipe() {
    if (!confirmDel) {
      setConfirmDel(true)
      return
    }
    await clearPhotos()
    urls.current.forEach((v) => URL.revokeObjectURL(v))
    urls.current.clear()
    setPhotos([])
    setParts(null)
    setConfirmDel(false)
  }

  return (
    <div className="toolbox docpack">
      {SECTIONS.map((sec) => {
        const list = photos.filter((p) => p.sec === sec)
        return (
          <div key={sec} className="dp-sec">
            <div className="dp-head">
              <span className="dp-name">{d.sections[sec]}</span>
              <span className="dp-count">{list.length ? `${list.length} ${d.cover.pagesWord}` : d.empty}</span>
              <label className="dp-add">
                {adding === sec ? d.processing : d.addPhoto}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={adding !== null}
                  onChange={(e) => {
                    void addFiles(sec, e.target.files)
                    e.target.value = ''
                  }}
                />
              </label>
            </div>
            {list.length > 0 && (
              <div className="dp-grid">
                {list.map((p) => (
                  <div key={p.id} className="dp-item">
                    <img src={thumb(p)} alt="" loading="lazy" />
                    <input
                      type="text"
                      value={p.label}
                      placeholder={d.labelPlaceholder}
                      onChange={(e) => void setLabel(p.id, e.target.value)}
                    />
                    <button type="button" className="dp-x" onClick={() => void remove(p.id)}>
                      {d.remove}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      <div className="dp-make">
        <label htmlFor="dp-anum">{d.anumLabel}</label>
        <input
          id="dp-anum"
          type="text"
          inputMode="numeric"
          value={anum}
          placeholder={d.anumHint}
          onChange={(e) => setAnum(e.target.value)}
          autoComplete="off"
        />
        <button
          type="button"
          className="cta"
          disabled={!photos.length || building || adding !== null}
          onClick={() => void build()}
        >
          {building ? d.making : d.makePdf}
        </button>
        <p className="hint">{d.storageNote}</p>
      </div>

      {parts && (
        <div className="dp-out">
          <h3>{d.readyTitle}</h3>
          <p className="hint">{d.readyHint}</p>
          {parts.map((p, i) => (
            <div key={p.name} className="dp-file">
              <span className="dp-fname">
                {parts.length > 1 ? `${d.partLabel} ${i + 1}/${parts.length} · ` : ''}
                {p.name}
              </span>
              <span className="dp-actions">
                {canShare && (
                  <button type="button" className="btn" onClick={() => void share(p)}>
                    {d.share}
                  </button>
                )}
                <a className="btn" href={p.url} download={p.name}>
                  {d.download}
                </a>
                <a className="btn ghostbtn" href={p.url} target="_blank" rel="noopener noreferrer">
                  {d.print}
                </a>
              </span>
            </div>
          ))}
          {!canShare && <p className="hint">{d.shareUnavailable}</p>}
          <button type="button" className="btn ghostbtn dp-wipe" onClick={() => void wipe()}>
            {confirmDel ? d.deleteAllConfirm : d.deleteAll}
          </button>
        </div>
      )}
    </div>
  )
}
