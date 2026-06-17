class Game {
  constructor(p1Data, p2Data, vsAI, arenaId) {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx    = this.canvas.getContext('2d');
    this.canvas.width  = CONFIG.CANVAS_WIDTH;
    this.canvas.height = CONFIG.CANVAS_HEIGHT;
    this.ctx.imageSmoothingEnabled = false;

    this.input = new InputManager();
    this.ui    = new UI(this.ctx);
    this.ui.arena = arenaId || 'street';
    this.vsAI  = vsAI;

    this.p1 = new Fighter(1, CONFIG.P1_START_X, p1Data.style, p1Data.face, p1Data.name, p1Data.photoColors, p1Data.traits, p1Data.phrases);
    this.p2 = new Fighter(2, CONFIG.P2_START_X, p2Data.style, p2Data.face, p2Data.name, p2Data.photoColors, p2Data.traits, p2Data.phrases);

    this.ai = vsAI ? new AIController(this.p2, this.p1) : null;

    this.round   = 1;
    this.wins    = [0, 0];
    this.timer   = CONFIG.ROUND_TIME;
    this._timerAcc = 0;
    this.frame   = 0;

    this._state  = 'announce';
    this._announceText  = '';
    this._announceAlpha = 1;
    this._announceQueue = [];
    this._shakeFrames   = 0;
    this._stopped       = false;
    this._rageArt       = null;

    this._loop = this._loop.bind(this);
    this._queueAnnounce(`ROUND ${this.round}`, 90, () => {
      this._queueAnnounce('FIGHT!', 55, () => { this._state = 'fight'; });
    });
    requestAnimationFrame(this._loop);
  }

  _loop() {
    this.frame++;
    if (this._state === 'fight') this._update();
    this._processAnnounceQueue();
    this._render();
    if (!this._stopped) requestAnimationFrame(this._loop);
  }

  _update() {
    // Rage Art slow-mo
    if (this._rageArt) {
      this._rageArt.timer--;
      if (this._rageArt.timer === 30) {
        const {attacker, defender} = this._rageArt;
        const atk = CONFIG.ATTACKS[STATES.SPECIAL];
        if (atk) {
          const dmg = Math.round(atk.damage * attacker.cfg.powerMult * 1.8);
          defender.receiveHit(dmg, atk.knockback * 1.5, attacker);
          this._shakeFrames = 8;
        }
      }
      if (this._rageArt.timer <= 0) {
        this._rageArt = null;
        if (this.p1.hp <= 0 || this.p2.hp <= 0 || this.timer <= 0) this._endRound();
      }
      // Slow-mo: only advance physics on every 5th frame before impact
      if (this._rageArt && this._rageArt.timer > 30 && this.frame % 5 !== 0) return;
      if (!this._rageArt) return;
    }

    this._timerAcc++;
    if (this._timerAcc >= 60) { this.timer=Math.max(0,this.timer-1); this._timerAcc=0; }
    if (this._shakeFrames > 0) this._shakeFrames--;

    const p1In = this._buildInput('p1');
    const p2In = this.vsAI ? this.ai.getInput(this.frame) : this._buildInput('p2');

    this.p1.update(p1In, this.frame, this.p2);
    this.p2.update(p2In, this.frame, this.p1);

    this._checkHits(this.p1, this.p2);
    this._checkHits(this.p2, this.p1);
    this._preventOverlap();

    this.input.endFrame();

    if (this.p1.hp <= 0 || this.p2.hp <= 0 || this.timer <= 0) this._endRound();
  }

  _buildInput(player) {
    const raw = this.input[player];
    return {
      ...raw,
      _justPunch:   this.input.justPressed(player,'punch'),
      _justKick:    this.input.justPressed(player,'kick'),
      _justSpecial: this.input.justPressed(player,'special'),
      _justUp:      this.input.justPressed(player,'up')
    };
  }

  _checkHits(attacker, defender) {
    if (attacker.hitRegistered) return;
    const hb = attacker.getAttackHitbox();
    if (!hb) return;
    const hurt = defender.hurtbox;
    if (hb.x<hurt.x+hurt.w && hb.x+hb.w>hurt.x && hb.y<hurt.y+hurt.h && hb.y+hb.h>hurt.y) {
      const atk = CONFIG.ATTACKS[attacker.state];
      if (!atk) return;
      // Rage Art trigger
      if (attacker.state===STATES.SPECIAL && !this._rageArt && attacker.hp/attacker.maxHp<=0.22) {
        this._rageArt = { attacker, defender, timer: 80 };
        attacker.hitRegistered = true;
        this._queueAnnounce('RAGE ART!', 55);
        return;
      }
      let dmg = Math.round(atk.damage * attacker.cfg.powerMult);
      if (attacker.blazeTimer > 0) dmg = Math.round(dmg * 1.5);
      if (defender.receiveHit(dmg, atk.knockback, attacker)) {
        attacker.hitRegistered = true;
        this._shakeFrames = 4;
        attacker.consecutiveHits++;
        if (attacker.consecutiveHits >= 3 && attacker.blazeTimer <= 0) {
          attacker.blazeTimer = 300;
          attacker.consecutiveHits = 0;
          this._queueAnnounce('BLAZE!', 45);
        }
      }
    }
  }

  _preventOverlap() {
    const d = this.p2.x - this.p1.x, min = 60;
    if (Math.abs(d) < min) {
      const push = (min-Math.abs(d))/2, dir = d<0?-1:1;
      this.p1.x -= push*dir; this.p2.x += push*dir;
    }
  }

  _endRound() {
    this._state = 'roundEnd';
    let winner = null;
    if (this.p1.hp<=0 && this.p2.hp<=0) winner=null;
    else if (this.p1.hp<=0) winner=1;
    else if (this.p2.hp<=0) winner=0;
    else winner = this.p1.hp>=this.p2.hp ? 0 : 1;

    if (winner!==null) {
      this.wins[winner]++;
      this.p1.state = winner===0 ? STATES.VICTORY : STATES.DEFEAT;
      this.p2.state = winner===1 ? STATES.VICTORY : STATES.DEFEAT;
    }

    const ko = this.p1.hp<=0||this.p2.hp<=0;
    const txt = winner===null?'DRAW!':(ko?'K.O.!':'TIME!');

    this._queueAnnounce(txt, 110, () => {
      const needed = Math.ceil(CONFIG.MAX_ROUNDS/2);
      if (this.wins[0]>=needed || this.wins[1]>=needed || this.round>=CONFIG.MAX_ROUNDS) {
        this._endMatch(winner);
      } else {
        this.round++;
        this.timer=CONFIG.ROUND_TIME; this._timerAcc=0;
        this.p1.hp=this.p1.maxHp; this.p2.hp=this.p2.maxHp;
        this.p1.sp=0; this.p2.sp=0;
        this.p1.reset(CONFIG.P1_START_X); this.p2.reset(CONFIG.P2_START_X);
        this._queueAnnounce(`ROUND ${this.round}`, 85, () => {
          this._queueAnnounce('FIGHT!', 55, () => { this._state='fight'; });
        });
      }
    });
  }

  _endMatch(winner) {
    this._stopped = true;
    this.input.destroy();
    setTimeout(()=>showVictoryScreen(
      winner!==null?(winner===0?this.p1:this.p2):null,
      this.wins,[this.p1,this.p2]
    ), 1800);
  }

  _queueAnnounce(text, frames, cb) {
    this._announceQueue.push({text,frames,cb,elapsed:0});
  }

  _processAnnounceQueue() {
    if (!this._announceQueue.length) { this._announceText=''; return; }
    const cur = this._announceQueue[0];
    cur.elapsed++;
    this._announceText  = cur.text;
    this._announceAlpha = Math.min(1,cur.elapsed/10)*Math.min(1,(cur.frames-cur.elapsed)/10);
    if (cur.elapsed >= cur.frames) {
      this._announceQueue.shift();
      this._announceText='';
      if (cur.cb) cur.cb();
    }
  }

  _render() {
    const ctx = this.ctx;
    ctx.save();
    if (this._shakeFrames>0) {
      ctx.translate((Math.random()-0.5)*this._shakeFrames*2,(Math.random()-0.5)*this._shakeFrames*1.5);
    }
    this.ui.drawArena(ctx, this.frame);
    this.p1.draw(ctx, this.frame);
    this.p2.draw(ctx, this.frame);
    if (this._state==='fight'||this._state==='roundEnd') {
      this.ui.drawHUD(this.p1,this.p2,this.round,this.wins,this.timer,CONFIG.MAX_ROUNDS);
    }
    if (this._announceText) {
      this.ui.drawAnnouncement(ctx, this._announceText, this._announceAlpha??1);
    }
    this._renderRageArtOverlay(ctx);
    this._drawControls(ctx);
    ctx.restore();
  }

  _renderRageArtOverlay(ctx) {
    if (!this._rageArt) return;
    const {attacker, defender, timer} = this._rageArt;
    const W = CONFIG.CANVAS_WIDTH, H = CONFIG.CANVAS_HEIGHT;
    const elapsed = 80 - timer;
    const vigAlpha = Math.min(0.85, elapsed / 20 * 0.85);
    ctx.fillStyle = `rgba(0,0,0,${vigAlpha.toFixed(2)})`;
    ctx.fillRect(0, 0, W, H);

    if (timer > 30) {
      const r = 78;
      // Attacker portrait (left)
      ctx.save();
      ctx.beginPath(); ctx.arc(W*0.25, H*0.44, r, 0, Math.PI*2);
      ctx.strokeStyle='#FF6600'; ctx.lineWidth=5; ctx.stroke(); ctx.clip();
      if (attacker.face) ctx.drawImage(attacker.face, W*0.25-r, H*0.44-r, r*2, r*2);
      else { ctx.fillStyle='#d4956a'; ctx.fillRect(W*0.25-r,H*0.44-r,r*2,r*2); }
      ctx.restore();
      ctx.fillStyle='#FF6600'; ctx.font='bold 12px Arial'; ctx.textAlign='center';
      ctx.fillText(attacker.name, W*0.25, H*0.44+r+16);

      // Defender portrait (right, shaking)
      const shk = timer < 45 ? (Math.random()-0.5)*(45-timer)*0.35 : 0;
      ctx.save();
      ctx.beginPath(); ctx.arc(W*0.75+shk, H*0.44, r, 0, Math.PI*2);
      ctx.strokeStyle='#FFCC00'; ctx.lineWidth=5; ctx.stroke(); ctx.clip();
      if (defender.face) ctx.drawImage(defender.face, W*0.75+shk-r, H*0.44-r, r*2, r*2);
      else { ctx.fillStyle='#d4956a'; ctx.fillRect(W*0.75+shk-r,H*0.44-r,r*2,r*2); }
      ctx.restore();
      ctx.fillStyle='#FFCC00'; ctx.font='bold 12px Arial'; ctx.textAlign='center';
      ctx.fillText(defender.name, W*0.75, H*0.44+r+16);

      // RAGE ART! text
      const ta = Math.min(1, elapsed/12);
      ctx.save(); ctx.globalAlpha=ta;
      ctx.font='bold 46px Arial Black,Arial'; ctx.textAlign='center';
      ctx.strokeStyle='#CC0000'; ctx.lineWidth=7;
      ctx.strokeText('RAGE ART!', W/2, H*0.80);
      ctx.fillStyle='#FF8800'; ctx.fillText('RAGE ART!', W/2, H*0.80);
      ctx.restore();
    } else {
      // Impact flash
      const f = (30 - timer) / 30;
      ctx.fillStyle = `rgba(255,200,50,${(f*0.72).toFixed(2)})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  _drawControls(ctx) {
    const isMobile = window.innerWidth <= 768;
    if (isMobile || this._state!=='fight' || this.frame>300) return;
    const a = Math.max(0, 1-this.frame/240);
    ctx.save(); ctx.globalAlpha=a*0.55;
    ctx.fillStyle='#AAA'; ctx.font='11px Arial'; ctx.textBaseline='middle';
    ctx.textAlign='left';
    ctx.fillText('P1: WASD движение  J удар  K нога  L спец  X блок', 10, CONFIG.CANVAS_HEIGHT-28);
    ctx.textAlign='right';
    const p2txt=this.vsAI?'P2: AI противник':'P2: ←→↑↓ движение  1 удар  2 нога  3 спец  0 блок';
    ctx.fillText(p2txt, CONFIG.CANVAS_WIDTH-10, CONFIG.CANVAS_HEIGHT-28);
    ctx.restore();
  }
}
