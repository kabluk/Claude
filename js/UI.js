class UI {
  constructor(ctx) {
    this.ctx = ctx;
  }

  drawHUD(p1, p2, round, wins, timer, maxRounds) {
    const ctx = this.ctx;
    const W = CONFIG.CANVAS_WIDTH;

    // Gradient background strip
    const bg = ctx.createLinearGradient(0, 0, 0, 68);
    bg.addColorStop(0, 'rgba(0,0,0,0.85)');
    bg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, 68);

    // P1 health bar
    this._drawHPBar(ctx, 14, 14, 270, 22, p1.hp / p1.maxHp,
                    p1.cfg.accentColor, p1.name, p1.face, true);

    // P2 health bar
    this._drawHPBar(ctx, W - 284, 14, 270, 22, p2.hp / p2.maxHp,
                    p2.cfg.accentColor, p2.name, p2.face, false);

    // SP bars
    this._drawSPBar(ctx, 14, 40, 180, p1.sp / p1.maxSp, '#0088FF', p1.sp >= p1.maxSp);
    this._drawSPBar(ctx, W - 194, 40, 180, p2.sp / p2.maxSp, '#0088FF', p2.sp >= p2.maxSp);

    // Timer
    this._drawTimer(ctx, timer, W);

    // Win dots
    this._drawWinDots(ctx, wins, round, maxRounds, W);
  }

  _drawHPBar(ctx, x, y, w, h, fill, color, name, face, leftAlign) {
    const barX = leftAlign ? x + 36 : x;
    const barW = w - 36;

    // Bar background
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath(); ctx.roundRect(barX, y, barW, h, 4); ctx.fill();

    // Danger flash
    const dangerColor = fill < 0.25 ? this._pulse(color, '#FF0000', Date.now()) : color;
    const grad = ctx.createLinearGradient(barX, y, barX + barW * fill, y + h);
    grad.addColorStop(0, dangerColor);
    grad.addColorStop(1, this._lighten(dangerColor, 40));

    ctx.fillStyle = grad;
    if (fill > 0) {
      ctx.beginPath();
      if (leftAlign) {
        ctx.roundRect(barX, y, barW * fill, h, 4);
      } else {
        ctx.roundRect(barX + barW * (1 - fill), y, barW * fill, h, 4);
      }
      ctx.fill();
    }

    // Bar border
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(barX, y, barW, h, 4); ctx.stroke();

    // Face portrait
    const faceSize = 32;
    const fx = leftAlign ? x : x + w - faceSize;
    const fy = y - 4;
    if (face) {
      ctx.save();
      ctx.beginPath(); ctx.arc(fx + faceSize/2, fy + faceSize/2, faceSize/2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(face, fx, fy, faceSize, faceSize);
      ctx.restore();
    }
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(fx + faceSize/2, fy + faceSize/2, faceSize/2, 0, Math.PI * 2);
    ctx.stroke();

    // Name
    ctx.fillStyle = '#EEE';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = leftAlign ? 'left' : 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(name, leftAlign ? barX + 4 : barX + barW - 4, y - 13);
  }

  _drawSPBar(ctx, x, y, w, fill, color, full) {
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(x, y, w, 7);

    if (fill > 0) {
      const c = full ? '#FFD700' : color;
      ctx.fillStyle = c;
      ctx.fillRect(x, y, w * fill, 7);
      if (full) {
        ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 8;
        ctx.fillRect(x, y, w, 7);
        ctx.shadowBlur = 0;
      }
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, 7);

    if (fill >= 1) {
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 7px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('SP READY', x + w / 2, y + 3.5);
    }
  }

  _drawTimer(ctx, timer, W) {
    const urgent = timer <= 10;
    const size   = urgent ? 32 : 26;
    const color  = urgent ? '#FF4444' : '#FFFFFF';

    if (urgent && timer % 2 === 0) {
      ctx.shadowColor = '#FF0000'; ctx.shadowBlur = 15;
    }

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.roundRect(W/2 - 28, 6, 56, 36, 6);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.font = `bold ${size}px 'Arial Black', Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(timer).padStart(2, '0'), W / 2, 26);
    ctx.shadowBlur = 0;
  }

  _drawWinDots(ctx, wins, round, maxRounds, W) {
    const dotR = 7;
    const rounds = maxRounds;

    for (let i = 0; i < Math.ceil(rounds / 2); i++) {
      // P1 dots
      const p1x = 14 + 70 + i * 20;
      ctx.fillStyle = i < wins[0] ? '#FFD700' : 'rgba(255,255,255,0.15)';
      ctx.beginPath(); ctx.arc(p1x, 56, dotR, 0, Math.PI * 2); ctx.fill();
      if (i < wins[0]) { ctx.strokeStyle = '#FFA500'; ctx.lineWidth = 1.5; ctx.stroke(); }

      // P2 dots
      const p2x = W - 14 - 70 - i * 20;
      ctx.fillStyle = i < wins[1] ? '#FFD700' : 'rgba(255,255,255,0.15)';
      ctx.beginPath(); ctx.arc(p2x, 56, dotR, 0, Math.PI * 2); ctx.fill();
      if (i < wins[1]) { ctx.strokeStyle = '#FFA500'; ctx.lineWidth = 1.5; ctx.stroke(); }
    }

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '10px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`ROUND ${round}`, W / 2, 56);
  }

  drawAnnouncement(ctx, text, alpha) {
    const W = CONFIG.CANVAS_WIDTH, H = CONFIG.CANVAS_HEIGHT;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, H/2 - 45, W, 90);

    const size = text.length <= 4 ? 64 : text.length <= 8 ? 48 : 36;
    ctx.font = `bold ${size}px 'Arial Black', Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.strokeStyle = '#000'; ctx.lineWidth = 6;
    ctx.strokeText(text, W / 2, H / 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(text, W / 2, H / 2);

    ctx.restore();
  }

  drawArena(ctx, frame) {
    const W = CONFIG.CANVAS_WIDTH, H = CONFIG.CANVAS_HEIGHT, G = CONFIG.GROUND_Y;

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0d0620');
    bg.addColorStop(0.55, '#150a30');
    bg.addColorStop(1, '#0a0518');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Background grid (perspective lines)
    ctx.strokeStyle = 'rgba(80,40,160,0.07)';
    ctx.lineWidth = 1;
    const vp = { x: W/2, y: G };
    for (let i = 0; i <= 12; i++) {
      const x = (i / 12) * W;
      ctx.beginPath(); ctx.moveTo(x, G); ctx.lineTo(vp.x, G - 200); ctx.stroke();
    }
    for (let d = 0; d < 5; d++) {
      const t = d / 5;
      const y = G - t * 180;
      const hw = (W/2) * (1 - t * 0.55);
      ctx.beginPath(); ctx.moveTo(vp.x - hw, y); ctx.lineTo(vp.x + hw, y); ctx.stroke();
    }

    // Floor gradient
    const floor = ctx.createLinearGradient(0, G, 0, H);
    floor.addColorStop(0, '#180830');
    floor.addColorStop(1, '#0a0420');
    ctx.fillStyle = floor;
    ctx.fillRect(0, G, W, H - G);

    // Glowing floor line
    ctx.shadowColor = '#9955DD'; ctx.shadowBlur = 18;
    ctx.strokeStyle = '#8844CC'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, G); ctx.lineTo(W, G); ctx.stroke();
    ctx.shadowBlur = 0;

    // Center split line
    ctx.setLineDash([8, 12]);
    ctx.strokeStyle = 'rgba(120,60,220,0.2)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W/2, G); ctx.lineTo(W/2, H); ctx.stroke();
    ctx.setLineDash([]);

    // Crowd silhouettes
    this._drawCrowd(ctx, frame);
  }

  _drawCrowd(ctx, frame) {
    const W = CONFIG.CANVAS_WIDTH, G = CONFIG.GROUND_Y;
    ctx.fillStyle = 'rgba(30,10,60,0.7)';
    for (let i = 0; i < 22; i++) {
      const x = (i / 22) * W + ((i % 2) * 18);
      const h = 28 + (i * 13 % 20);
      const bob = Math.sin(frame * 0.04 + i * 0.8) * 2;
      ctx.beginPath();
      ctx.arc(x, G - 58 + bob, 9, Math.PI, 0);
      ctx.rect(x - 9, G - 58 + bob, 18, h);
      ctx.fill();
    }
  }

  // --- helpers ---

  _pulse(colorA, colorB, t) {
    return Math.floor(t / 300) % 2 === 0 ? colorA : colorB;
  }

  _lighten(hex, amount) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + amount);
    const g = Math.min(255, ((num >> 8) & 0xFF) + amount);
    const b = Math.min(255, (num & 0xFF) + amount);
    return `rgb(${r},${g},${b})`;
  }
}
