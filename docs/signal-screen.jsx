import { useState, useEffect, useRef, useCallback } from "react";

/* ------------------------------------------------------------------ *
 *  Detention Navigator — экран сигнала
 *  ISO 7010 semantics: red = action, yellow = warning, green = safe
 * ------------------------------------------------------------------ */

const C = {
  bg: "#14171A",
  panel: "#1C2126",
  bezel: "#2A3138",
  line: "#333B42",
  red: "#E4382B",
  redDeep: "#A8241A",
  yellow: "#F2C230",
  green: "#37A05A",
  ink: "#EDEFF1",
  dim: "#868F98",
};

const T = {
  ru: {
    eyebrow: "Готовность сигнала",
    idle: "УДЕРЖИВАЙТЕ",
    holding: "НЕ ОТПУСКАЙТЕ",
    sent: "СИГНАЛ ОТПРАВЛЕН",
    empty: "Уйдёт почти пустым",
    partial: "Уйдёт неполный пакет",
    full: "Уйдёт полный пакет",
    undo: "Отменить",
    checkin: "Отметка через",
    checkinNote: "Если отметки не будет — сигнал уйдёт сам",
    foot: "Передаётся только то, что вы заполнили сами.",
    items: [
      "Кому уходит сигнал",
      "Данные человека",
      "Документы",
      "Место и учреждение",
      "Текст сообщения",
      "Доверенные контакты",
    ],
  },
  es: {
    eyebrow: "Señal — estado",
    idle: "MANTENGA PULSADO",
    holding: "NO SUELTE",
    sent: "SEÑAL ENVIADA",
    empty: "Saldrá casi vacía",
    partial: "Saldrá incompleta",
    full: "Saldrá completa",
    undo: "Cancelar",
    checkin: "Próximo registro en",
    checkinNote: "Sin registro, la señal sale sola",
    foot: "Se envía solo lo que usted completó.",
    items: [
      "Quién recibe la señal",
      "Datos de la persona",
      "Documentos",
      "Lugar y centro",
      "Texto del mensaje",
      "Contactos de confianza",
    ],
  },
  en: {
    eyebrow: "Signal readiness",
    idle: "PRESS AND HOLD",
    holding: "KEEP HOLDING",
    sent: "SIGNAL SENT",
    empty: "Will go out nearly empty",
    partial: "Will go out incomplete",
    full: "Will go out complete",
    undo: "Undo",
    checkin: "Next check-in in",
    checkinNote: "No check-in, the signal sends itself",
    foot: "Only what you filled in yourself is sent.",
    items: [
      "Who receives the signal",
      "Person's details",
      "Documents",
      "Location and facility",
      "Message text",
      "Trusted contacts",
    ],
  },
};

const HOLD_MS = 1800;
const N = 6;
const R = 124;
const CIRC = 2 * Math.PI * R;
const SEG = CIRC / N;
const GAP = 11;
const R_IN = 101;
const CIRC_IN = 2 * Math.PI * R_IN;

export default function SignalScreen() {
  const [lang, setLang] = useState("ru");
  const [done, setDone] = useState([true, true, false, true, false, false]);
  const [holding, setHolding] = useState(false);
  const [prog, setProg] = useState(0);
  const [sent, setSent] = useState(false);
  const [undoLeft, setUndoLeft] = useState(0);
  const [left, setLeft] = useState(4 * 3600 + 12 * 60 + 37);

  const raf = useRef(null);
  const t0 = useRef(0);
  const t = T[lang];
  const count = done.filter(Boolean).length;
  const ready = count === N;

  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  /* countdown */
  useEffect(() => {
    const i = setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(i);
  }, []);

  /* undo window */
  useEffect(() => {
    if (undoLeft <= 0) return;
    const i = setTimeout(() => setUndoLeft((n) => n - 1), 1000);
    return () => clearTimeout(i);
  }, [undoLeft]);

  const stop = useCallback(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
    setHolding(false);
    setProg(0);
  }, []);

  const tick = useCallback(() => {
    const p = Math.min(1, (performance.now() - t0.current) / HOLD_MS);
    setProg(p);
    if (p >= 1) {
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = null;
      setHolding(false);
      setProg(0);
      setSent(true);
      setUndoLeft(10);
      if (navigator.vibrate) navigator.vibrate([40, 60, 120]);
      return;
    }
    raf.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(() => {
    if (sent || raf.current) return;
    t0.current = performance.now();
    setHolding(true);
    if (navigator.vibrate) navigator.vibrate(15);
    raf.current = requestAnimationFrame(tick);
  }, [sent, tick]);

  useEffect(() => () => raf.current && cancelAnimationFrame(raf.current), []);

  const toggle = (i) =>
    setDone((d) => d.map((v, j) => (j === i ? !v : v)));

  const hhmmss = (s) =>
    [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60]
      .map((n) => String(n).padStart(2, "0"))
      .join(":");

  const stateLabel = sent
    ? t.sent
    : holding
    ? t.holding
    : t.idle;

  const readinessLine = ready ? t.full : count === 0 ? t.empty : t.partial;
  const statusColor = ready ? C.green : count === 0 ? C.red : C.yellow;

  return (
    <div
      style={{
        minHeight: "100%",
        background: C.bg,
        color: C.ink,
        fontFamily: "Archivo, 'Helvetica Neue', Arial, sans-serif",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        .mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
        @keyframes breathe {
          0%,100% { transform: scale(1); opacity: .55; }
          50%     { transform: scale(1.09); opacity: 0; }
        }
        .halo { animation: breathe 3.6s ease-out infinite; }
        @media (prefers-reduced-motion: reduce) { .halo { animation: none; opacity: 0; } }
        .row:focus-visible, .estop:focus-visible, .lang:focus-visible {
          outline: 2px solid ${C.yellow}; outline-offset: 3px;
        }
      `}</style>

      <div style={{ width: "100%", maxWidth: 440, padding: "0 0 28px" }}>
        {/* ---------- header ---------- */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px 13px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.22em",
            }}
          >
            <span
              style={{ width: 3, height: 15, background: C.red, display: "block" }}
            />
            DETNAV
          </div>
          <div style={{ display: "flex", gap: 2 }}>
            {["EN", "ES", "RU"].map((L) => {
              const k = L.toLowerCase();
              const on = k === lang;
              return (
                <button
                  key={L}
                  className="lang mono"
                  onClick={() => setLang(k)}
                  style={{
                    background: on ? C.bezel : "transparent",
                    color: on ? C.ink : C.dim,
                    border: "none",
                    padding: "6px 10px",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    cursor: "pointer",
                  }}
                >
                  {L}
                </button>
              );
            })}
          </div>
        </header>

        {/* hazard rule — solid green once complete */}
        <div
          style={{
            height: 5,
            background: ready
              ? C.green
              : `repeating-linear-gradient(45deg, ${C.yellow} 0 9px, ${C.bg} 9px 18px)`,
            transition: "background .3s",
          }}
        />

        {/* ---------- ring + e-stop ---------- */}
        <div style={{ padding: "30px 20px 4px", textAlign: "center" }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: C.dim,
              fontWeight: 600,
            }}
          >
            {t.eyebrow}
          </div>

          <div
            style={{
              position: "relative",
              width: 300,
              height: 300,
              margin: "14px auto 0",
            }}
          >
            <svg
              viewBox="0 0 300 300"
              style={{ position: "absolute", inset: 0 }}
              aria-hidden="true"
            >
              <g transform="rotate(-90 150 150)">
                {done.map((v, i) => (
                  <circle
                    key={i}
                    cx="150"
                    cy="150"
                    r={R}
                    fill="none"
                    stroke={v ? C.green : C.bezel}
                    strokeWidth="7"
                    strokeDasharray={`${SEG - GAP} ${CIRC - SEG + GAP}`}
                    strokeDashoffset={-i * SEG}
                    style={{ transition: "stroke .28s" }}
                  />
                ))}
                {holding && (
                  <circle
                    cx="150"
                    cy="150"
                    r={R_IN}
                    fill="none"
                    stroke={C.red}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={CIRC_IN}
                    strokeDashoffset={CIRC_IN * (1 - prog)}
                  />
                )}
              </g>
            </svg>

            {/* breathing halo */}
            {!sent && !holding && (
              <div
                className="halo"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: 176,
                  height: 176,
                  marginTop: -88,
                  marginLeft: -88,
                  borderRadius: "50%",
                  border: `2px solid ${C.red}`,
                  pointerEvents: "none",
                }}
              />
            )}

            {/* E-stop */}
            <button
              className="estop"
              disabled={sent}
              onPointerDown={start}
              onPointerUp={stop}
              onPointerLeave={stop}
              onPointerCancel={stop}
              onKeyDown={(e) =>
                (e.key === " " || e.key === "Enter") && !e.repeat && start()
              }
              onKeyUp={stop}
              onContextMenu={(e) => e.preventDefault()}
              aria-label={stateLabel}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: 176,
                height: 176,
                marginTop: -88,
                marginLeft: -88,
                borderRadius: "50%",
                border: "none",
                cursor: sent ? "default" : "pointer",
                padding: 0,
                background: sent
                  ? C.panel
                  : `radial-gradient(circle at 50% 34%, ${C.red} 0%, ${C.red} 52%, ${C.redDeep} 100%)`,
                boxShadow: sent
                  ? `inset 0 0 0 2px ${C.green}`
                  : holding
                  ? `inset 0 5px 16px rgba(0,0,0,.5), 0 0 0 9px ${C.panel}`
                  : `0 9px 0 ${C.redDeep}, 0 0 0 9px ${C.panel}, 0 16px 34px rgba(228,56,43,.28)`,
                transform: holding && !reduce ? "translateY(7px)" : "none",
                transition: "box-shadow .12s, transform .12s, background .25s",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                color: sent ? C.green : "#fff",
              }}
            >
              <span
                style={{
                  fontSize: sent ? 12 : 13,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  lineHeight: 1.25,
                  maxWidth: 132,
                  textAlign: "center",
                }}
              >
                {stateLabel}
              </span>
              {!sent && (
                <span
                  className="mono"
                  style={{ fontSize: 10, opacity: 0.72, letterSpacing: "0.1em" }}
                >
                  1.8s
                </span>
              )}
            </button>
          </div>

          {/* readiness line */}
          <div
            style={{
              marginTop: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <span
              className="mono"
              style={{ fontSize: 13, fontWeight: 700, color: statusColor }}
            >
              {count}/{N}
            </span>
            <span style={{ fontSize: 13, color: C.dim }}>{readinessLine}</span>
          </div>

          {sent && undoLeft > 0 && (
            <button
              onClick={() => {
                setSent(false);
                setUndoLeft(0);
              }}
              style={{
                marginTop: 14,
                background: "transparent",
                border: `1px solid ${C.line}`,
                color: C.ink,
                padding: "9px 20px",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.06em",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {t.undo} <span className="mono">{undoLeft}</span>
            </button>
          )}
        </div>

        {/* ---------- checklist = ring segments ---------- */}
        <div style={{ marginTop: 22, borderTop: `1px solid ${C.line}` }}>
          {t.items.map((label, i) => (
            <button
              key={i}
              className="row"
              onClick={() => toggle(i)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "15px 20px",
                background: "transparent",
                border: "none",
                borderBottom: `1px solid ${C.line}`,
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "inherit",
              }}
            >
              <span
                className="mono"
                style={{ fontSize: 10, color: C.dim, width: 14 }}
              >
                {i + 1}
              </span>
              <span
                style={{
                  width: 20,
                  height: 20,
                  flexShrink: 0,
                  border: `2px solid ${done[i] ? C.green : C.bezel}`,
                  background: done[i] ? C.green : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all .2s",
                }}
              >
                {done[i] && (
                  <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                    <path
                      d="M1 4.6L4.1 7.6L10 1.4"
                      stroke={C.bg}
                      strokeWidth="2.2"
                      strokeLinecap="square"
                    />
                  </svg>
                )}
              </span>
              <span
                style={{
                  fontSize: 14.5,
                  fontWeight: 500,
                  color: done[i] ? C.ink : C.dim,
                  flex: 1,
                }}
              >
                {label}
              </span>
            </button>
          ))}
        </div>

        {/* ---------- check-in strip ---------- */}
        <div
          style={{
            margin: "20px 20px 0",
            background: C.panel,
            borderLeft: `3px solid ${C.yellow}`,
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: C.dim,
                fontWeight: 600,
              }}
            >
              {t.checkin}
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: C.dim,
                marginTop: 5,
                maxWidth: 210,
                lineHeight: 1.4,
              }}
            >
              {t.checkinNote}
            </div>
          </div>
          <div
            className="mono"
            style={{ fontSize: 21, fontWeight: 700, color: C.yellow }}
          >
            {hhmmss(left)}
          </div>
        </div>

        <p
          style={{
            margin: "18px 20px 0",
            fontSize: 11.5,
            lineHeight: 1.5,
            color: C.dim,
            textAlign: "center",
          }}
        >
          {t.foot}
        </p>
      </div>
    </div>
  );
}
