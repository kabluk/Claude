// Сборка PDF-пакета в браузере (DOCS-AND-FIXES §3–8).
// Каждая страница — canvas → JPEG: текст рисует браузер, поэтому
// кириллица и диакритика работают без встраивания шрифтов в PDF.

import type { DocPhoto, PacketMeta } from './docdb'
import type { UIStrings } from './types'

const PW = 1240
const PH = 1754 // A4 при 150 dpi
const M = 90 // поле
const PART_LIMIT = 18 * 1024 * 1024 // почтовый предел 25 МБ, с запасом

type DP = UIStrings['docPack']

export interface PdfPart {
  // min-ok: имя файла PDF (A-Number + дата), а не имя человека
  name: string
  blob: Blob
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w
    if (ctx.measureText(t).width > maxW && cur) {
      lines.push(cur)
      cur = w
    } else cur = t
  }
  if (cur) lines.push(cur)
  return lines
}

function fmt(tpl: string, vars: Record<string, string | number>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''))
}

interface CoverInput {
  d: DP
  date: string
  packetN: number
  prev?: PacketMeta
  anum: string
  groups: { label: string; count: number }[]
  missing: string[]
  part?: { i: number; n: number }
}

function renderCover(c: CoverInput): HTMLCanvasElement {
  const cv = document.createElement('canvas')
  cv.width = PW
  cv.height = PH
  const x = cv.getContext('2d')!
  x.fillStyle = '#ffffff'
  x.fillRect(0, 0, PW, PH)
  x.fillStyle = '#0f172a'
  let y = M + 30

  x.font = '700 30px system-ui, sans-serif'
  x.fillText('DETNAV', M, y)
  y += 72
  x.font = '700 54px system-ui, sans-serif'
  for (const l of wrap(x, c.d.cover.title, PW - 2 * M)) {
    x.fillText(l, M, y)
    y += 62
  }
  if (c.part && c.part.n > 1) {
    x.font = '400 34px system-ui, sans-serif'
    x.fillStyle = '#475569'
    x.fillText(fmt(c.d.cover.part, { i: c.part.i, n: c.part.n }), M, y)
    y += 46
  }
  y += 14
  x.font = '400 32px system-ui, sans-serif'
  x.fillStyle = '#0f172a'
  x.fillText(`${c.d.cover.date}: ${c.date}`, M, y)
  y += 44
  x.fillText(`${c.d.cover.packet} ${c.packetN}`, M, y)
  y += 44
  if (c.prev) {
    x.fillStyle = '#475569'
    x.fillText(fmt(c.d.cover.supplements, { n: c.prev.n, date: c.prev.date }), M, y)
    y += 44
    x.fillStyle = '#0f172a'
  }
  x.fillText(c.anum ? `A-Number: ${c.anum}` : c.d.cover.noAnum, M, y)
  y += 70

  x.strokeStyle = '#e2e8f0'
  x.lineWidth = 2
  x.beginPath()
  x.moveTo(M, y)
  x.lineTo(PW - M, y)
  x.stroke()
  y += 60

  x.font = '700 36px system-ui, sans-serif'
  x.fillText(c.d.cover.toc, M, y)
  y += 52
  x.font = '400 30px system-ui, sans-serif'
  for (const g of c.groups) {
    x.fillText(`${g.label} — ${g.count} ${c.d.cover.pagesWord}`, M + 20, y)
    y += 42
  }
  y += 40

  if (c.missing.length) {
    x.font = '700 36px system-ui, sans-serif'
    x.fillText(c.d.cover.missing, M, y)
    y += 52
    x.font = '400 30px system-ui, sans-serif'
    x.fillStyle = '#9a3412'
    for (const m of c.missing) {
      x.fillText(`— ${m}`, M + 20, y)
      y += 42
    }
    y += 10
    x.font = '400 26px system-ui, sans-serif'
    x.fillStyle = '#475569'
    for (const l of wrap(x, c.d.cover.missingNote, PW - 2 * M)) {
      x.fillText(l, M, y)
      y += 34
    }
  }

  x.font = '400 26px system-ui, sans-serif'
  x.fillStyle = '#475569'
  const foot = wrap(x, c.d.cover.footer, PW - 2 * M)
  let fy = PH - M - (foot.length - 1) * 34
  for (const l of foot) {
    x.fillText(l, M, fy)
    fy += 34
  }
  return cv
}

async function renderPhotoPage(
  p: DocPhoto,
  secLabel: string,
  pageNo: number,
  total: number,
): Promise<HTMLCanvasElement> {
  const cv = document.createElement('canvas')
  cv.width = PW
  cv.height = PH
  const x = cv.getContext('2d')!
  x.fillStyle = '#ffffff'
  x.fillRect(0, 0, PW, PH)

  x.fillStyle = '#0f172a'
  x.font = '700 30px system-ui, sans-serif'
  x.fillText(secLabel, M, 90)
  x.fillStyle = '#475569'
  x.font = '400 26px system-ui, sans-serif'
  x.fillText(`${pageNo} / ${total}`, PW - M - x.measureText(`${pageNo} / ${total}`).width, 90)
  let top = 120
  if (p.label) {
    for (const l of wrap(x, p.label, PW - 2 * M).slice(0, 2)) {
      x.fillText(l, M, top)
      top += 34
    }
  }
  top += 20

  const url = URL.createObjectURL(p.blob)
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image()
      i.onload = () => res(i)
      i.onerror = () => rej(new Error('bad image'))
      i.src = url
    })
    const availW = PW - 2 * M
    const availH = PH - top - M
    const k = Math.min(availW / img.naturalWidth, availH / img.naturalHeight)
    const w = img.naturalWidth * k
    const h = img.naturalHeight * k
    x.drawImage(img, M + (availW - w) / 2, top + (availH - h) / 2, w, h)
  } finally {
    URL.revokeObjectURL(url)
  }
  return cv
}

export async function buildPdfParts(opts: {
  photos: DocPhoto[]
  order: string[]
  d: DP
  anum: string
  packetN: number
  prev?: PacketMeta
  date: string
}): Promise<PdfPart[]> {
  const { photos, order, d, anum, packetN, prev, date } = opts
  const { jsPDF } = await import('jspdf')

  const bySec = new Map<string, DocPhoto[]>()
  for (const s of order) bySec.set(s, [])
  for (const p of photos) (bySec.get(p.sec) ?? bySec.get('other'))!.push(p)
  const ordered = order.flatMap((s) => bySec.get(s)!)

  // Разбивка: части не больше ~18 МБ (DOCS-AND-FIXES §6)
  const parts: DocPhoto[][] = []
  let cur: DocPhoto[] = []
  let size = 0
  for (const p of ordered) {
    if (cur.length && size + p.blob.size > PART_LIMIT) {
      parts.push(cur)
      cur = []
      size = 0
    }
    cur.push(p)
    size += p.blob.size
  }
  if (cur.length) parts.push(cur)

  const groups = order
    .map((s) => ({ label: d.sections[s], count: bySec.get(s)!.length }))
    .filter((g) => g.count > 0)
  const missing = order.filter((s) => s !== 'other' && bySec.get(s)!.length === 0).map((s) => d.sections[s])

  const out: PdfPart[] = []
  const A4W = 595.28
  const A4H = 841.89
  for (let pi = 0; pi < parts.length; pi++) {
    const pdf = new jsPDF({ unit: 'pt', format: 'a4', compress: false })
    const cover = renderCover({
      d,
      date,
      packetN,
      prev,
      anum,
      groups,
      missing,
      part: { i: pi + 1, n: parts.length },
    })
    pdf.addImage(cover.toDataURL('image/jpeg', 0.85), 'JPEG', 0, 0, A4W, A4H)
    const total = parts[pi].length
    for (let i = 0; i < total; i++) {
      const p = parts[pi][i]
      const page = await renderPhotoPage(p, d.sections[p.sec] ?? d.sections.other, i + 1, total)
      pdf.addPage()
      pdf.addImage(page.toDataURL('image/jpeg', 0.82), 'JPEG', 0, 0, A4W, A4H)
    }
    const id = anum ? `A${anum}` : 'docs'
    const suffix = parts.length > 1 ? `-p${pi + 1}` : ''
    // min-ok: имя файла PDF (A-Number + дата), а не имя человека
    out.push({ name: `detnav-${id}-${date}${suffix}.pdf`, blob: pdf.output('blob') })
  }
  return out
}
