class SlapGame {
  constructor(p1Data, p2Data, vsAI) {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.vsAI = vsAI;

    this.p1 = {
      face: p1Data.face, name: p1Data.name || 'P1', style: p1Data.style || 'street',
      hp: 100, maxHp: 100, dmgDealt: 0, dmgTaken: 0, knockdowns: 0
    };
    this.p2 = {
      face: p2Data.face, name: p2Data.name || (vsAI ? 'AI' : 'P2'), style: p2Data.style || 'street',
      hp: 100, maxHp: 100, dmgDealt: 0, dmgTaken: 0, knockdowns: 0
    };

    this.chargeP1 = 0;
    this.chargeP2 = 0;
    this.chargingP1 = false;
    this.chargingP2 = false;
    this.phase = 'p1_charge';
    this.hitText = '';
    this.hitTextTimer = 0;
    this.resultTimer = 0;
    this.aiDelayTimer = 0;
    this._aiTargetCharge = 0.5;
    this._lastSlapper = -1;
    this.frame = 0;
    this._stopped = false;

    this._bindInput();
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  _bindInput() {
    this._onKeyDown = (e) => {
      if ((e.key === ' ' || e.key === 'j' || e.key === 'J') && this.phase === 'p1_charge') {
        this.chargingP1 = true;
      }
      if ((e.key === 'Enter' || e.key === '1') && this.phase === 'p2_charge') {
        this.chargingP2 = true;
      }
    };
    this._onKeyUp = (e) => {
      if ((e.key === ' ' || e.key === 'j' || e.key === 'J') && this.phase === 'p1_charge' && this.chargingP1) {
        this.chargingP1 = false;
        this._executeSlap(0);
      }
      if ((e.key === 'Enter' || e.key === '1') && this.phase === 'p2_charge' && this.chargingP2) {
        this.chargingP2 = false;
        this._executeSlap(1);
      }
    };
    this._onTouchStart = (e) => {
      if (this.phase === 'p1_charge') { this.chargingP1 = true; e.preventDefault(); }
    };
    this._onTouchEnd = (e) => {
      if (this.phase === 'p1_charge' && this.chargingP1) {
        this.chargingP1 = false;
        this._executeSlap(0);
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    this.canvas.addEventListener('touchstart', this._onTouchStart, {passive: false});
    this.canvas.addEventListener('touchend', this._onTouchEnd, {passive: false});
  }

  _destroy() {
    this._stopped = true;
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    this.canvas.removeEventListener('touchstart', this._onTouchStart);
    this.canvas.removeEventListener('touchend', this._onTouchEnd);
  }

  _executeSlap(slapperIdx) {
    const slapper = slapperIdx === 0 ? this.p1 : this.p2;
    const target  = slapperIdx === 0 ? this.p2 : this.p1;
    const charge  = slapperIdx === 0 ? this.chargeP1 : this.chargeP2;
    if (slapperIdx === 0) this.chargeP1 = 0; else this.chargeP2 = 0;
    this._lastSlapper = slapperIdx;

    const dmg = Math.max(5, Math.round(charge * 42 + 5));
    target.hp = Math.max(0, target.hp - dmg);
    slapper.dmgDealt += dmg;
    target.dmgTaken  += dmg;

    const msgs = ['ПОЩЁЧИНА!', 'ШЛЁП!', 'ВЛУПИЛ!', 'ХЛЯСТЬ!', 'БАМ!'];
    this.hitText = msgs[Math.floor(Math.random() * msgs.length)] + ' −' + dmg;
    this.hitTextTimer = 70;
    this.phase = 'result';
    this.resultTimer = 55;
  }

  _loop() {
    this.frame++;
    this._update();
    this._render();
    if (!this._stopped) requestAnimationFrame(this._loop);
  }

  _update() {
    if (this.hitTextTimer > 0) this.hitTextTimer--;

    if (this.phase === 'p1_charge' && this.chargingP1)
      this.chargeP1 = Math.min(1, this.chargeP1 + 0.016);
    if (this.phase === 'p2_charge' && this.chargingP2)
      this.chargeP2 = Math.min(1, this.chargeP2 + 0.016);
    if (this.phase === 'ai_charge')
      this.chargeP2 = Math.min(this._aiTargetCharge, this.chargeP2 + 0.022);

    if (this.phase === 'ai_delay') {
      this.aiDelayTimer--;
      if (this.aiDelayTimer <= 0) {
        this.phase = 'ai_charge';
        this.chargeP2 = 0;
        this._aiTargetCharge = 0.3 + Math.random() * 0.7;
      }
    }

    if (this.phase === 'ai_charge' && this.chargeP2 >= this._aiTargetCharge) {
      this._executeSlap(1);
    }

    if (this.phase === 'result') {
      this.resultTimer--;
      if (this.resultTimer <= 0) {
        if (this.p1.hp <= 0 || this.p2.hp <= 0) {
          const winner = this.p1.hp > 0 ? this.p1 : (this.p2.hp > 0 ? this.p2 : null);
          this.phase = 'gameover';
          setTimeout(() => {
            this._destroy();
            showVictoryScreen(winner, [this.p1.hp > 0 ? 1 : 0, this.p2.hp > 0 ? 1 : 0], [this.p1, this.p2]);
          }, 1200);
          return;
        }
        if (this._lastSlapper === 0) {
          this.phase = this.vsAI ? 'ai_delay' : 'p2_charge';
          if (this.vsAI) this.aiDelayTimer = 55 + Math.floor(Math.random() * 80);
        } else {
          this.phase = 'p1_charge';
        }
      }
    }
  }

  _render() {
    const ctx = this.ctx;
    const W = CONFIG.CANVAS_WIDTH, H = CONFIG.CANVAS_HEIGHT;

    ctx.fillStyle = '#14080a';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#2a1008';
    ctx.fillRect(0, H - 72, W, 72);
    ctx.fillStyle = '#3a1800';
    ctx.fillRect(0, H - 76, W, 5);

    ctx.fillStyle = '#FF8800';
    ctx.font = 'bold 20px Arial Black, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('РЕЖИМ ПОЩЁЧИН', W / 2, 36);

    const r = 86;
    const cy = Math.round(H * 0.47);

    // P1 face
    const p1x = Math.round(W * 0.26);
    this._drawPortrait(ctx, p1x, cy, r, this.p1, '#FF8800', this.hitTextTimer > 40 && this._lastSlapper === 1);
    this._drawHPBar(ctx, p1x - 78, cy + r + 14, 156, this.p1.hp, this.p1.maxHp);
    ctx.fillStyle = '#eee'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center';
    ctx.fillText(this.p1.name, p1x, cy + r + 40);

    // P2 face
    const p2x = Math.round(W * 0.74);
    const p2shk = (this.hitTextTimer > 40 && this._lastSlapper === 0) ? (Math.random() - 0.5) * 9 : 0;
    this._drawPortrait(ctx, p2x + p2shk, cy, r, this.p2, '#FF8800', this.hitTextTimer > 40 && this._lastSlapper === 0);
    this._drawHPBar(ctx, p2x - 78, cy + r + 14, 156, this.p2.hp, this.p2.maxHp);
    ctx.fillStyle = '#eee'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center';
    ctx.fillText(this.p2.name, p2x, cy + r + 40);

    // VS
    ctx.fillStyle = 'rgba(255,120,0,0.9)';
    ctx.font = 'bold 24px Arial Black, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('VS', W / 2, cy + 8);

    // Charge bar
    const isP1Turn = this.phase === 'p1_charge';
    const isP2Turn = this.phase === 'p2_charge' || this.phase === 'ai_charge';
    if (isP1Turn || isP2Turn) {
      const bx = isP1Turn ? p1x - 78 : p2x - 78;
      const by = cy - r - 32;
      const charge = isP1Turn ? this.chargeP1 : this.chargeP2;
      const barCol = charge > 0.7 ? '#ff3300' : charge > 0.4 ? '#ffaa00' : '#44ff88';
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(bx, by, 156, 18);
      ctx.fillStyle = barCol; ctx.fillRect(bx, by, 156 * charge, 18);
      ctx.strokeStyle = '#666'; ctx.lineWidth = 1.5; ctx.strokeRect(bx, by, 156, 18);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center';
      ctx.fillText('ЗАРЯД', bx + 78, by + 10);
    }

    // Instructions
    ctx.fillStyle = 'rgba(255,255,255,0.50)';
    ctx.font = '12px Arial'; ctx.textAlign = 'center';
    if (this.phase === 'p1_charge') {
      ctx.fillText('Зажми и отпусти Пробел / J / тап чтобы дать пощёчину!', W / 2, H - 18);
    } else if (this.phase === 'p2_charge') {
      ctx.fillText('P2: Зажми и отпусти Enter / 1 чтобы ответить!', W / 2, H - 18);
    } else if (this.phase === 'ai_delay' || this.phase === 'ai_charge') {
      ctx.fillStyle = '#FF8800'; ctx.font = 'bold 12px Arial';
      ctx.fillText('AI готовится...', W / 2, H - 18);
    }

    // Hit text
    if (this.hitTextTimer > 0 && this.hitText) {
      const alpha = Math.min(1, this.hitTextTimer / 14);
      const scale = 1 + Math.max(0, 1 - this.hitTextTimer / 50) * 0.4;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(W / 2, Math.round(H * 0.22));
      ctx.scale(scale, scale);
      ctx.font = 'bold 36px Arial Black, Arial'; ctx.textAlign = 'center';
      ctx.strokeStyle = '#000'; ctx.lineWidth = 6; ctx.strokeText(this.hitText, 0, 0);
      ctx.fillStyle = '#FF4400'; ctx.fillText(this.hitText, 0, 0);
      ctx.restore();
    }

    if (this.phase === 'gameover') {
      ctx.fillStyle = 'rgba(0,0,0,0.62)'; ctx.fillRect(0, 0, W, H);
      ctx.font = 'bold 40px Arial Black, Arial'; ctx.textAlign = 'center';
      ctx.strokeStyle = '#000'; ctx.lineWidth = 8;
      ctx.strokeText('ПОБЕДА!', W / 2, H / 2 - 10);
      ctx.fillStyle = '#FFD700'; ctx.fillText('ПОБЕДА!', W / 2, H / 2 - 10);
    }
  }

  _drawPortrait(ctx, x, y, r, fighter, ringCol, shaking) {
    const ox = shaking ? (Math.random() - 0.5) * 7 : 0;
    ctx.save();
    ctx.beginPath(); ctx.arc(x + ox, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = ringCol; ctx.lineWidth = 5; ctx.stroke();
    ctx.clip();
    if (fighter.face) ctx.drawImage(fighter.face, x + ox - r, y - r, r * 2, r * 2);
    else { ctx.fillStyle = '#d4956a'; ctx.fillRect(x + ox - r, y - r, r * 2, r * 2); }
    ctx.restore();
  }

  _drawHPBar(ctx, x, y, w, hp, maxHp) {
    const pct = Math.max(0, hp / maxHp);
    const col = pct > 0.5 ? '#22bb44' : pct > 0.25 ? '#ffaa00' : '#ff2200';
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(x, y, w, 14);
    ctx.fillStyle = col; ctx.fillRect(x, y, w * pct, 14);
    ctx.strokeStyle = '#666'; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, w, 14);
    ctx.fillStyle = '#fff'; ctx.font = '10px Arial'; ctx.textAlign = 'center';
    ctx.fillText(Math.ceil(hp), x + w / 2, y + 10);
  }
}
