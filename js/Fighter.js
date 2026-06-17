class Fighter {
  constructor(id, x, style, faceCanvas, name) {
    this.id     = id;
    this.style  = style;
    this.cfg    = CONFIG.STYLES[style];
    this.face   = faceCanvas;
    this.name   = name || this.cfg.name;

    this.maxHp = Math.round(100 * this.cfg.hpMult);
    this.maxSp = 100;

    this._idlePhase = Math.random() * Math.PI * 2;
    this.resetForMatch(x);
  }

  resetForMatch(x) {
    this.hp     = this.maxHp;
    this.sp     = 0;
    this.wins   = 0;
    this.reset(x);
  }

  reset(x) {
    this.x  = x;
    this.y  = CONFIG.GROUND_Y;
    this.vx = 0;
    this.vy = 0;
    this.onGround   = true;
    this.facingRight = this.id === 1;

    this.state      = STATES.IDLE;
    this.stateFrame = 0;

    this.invFrames  = 80;
    this.flashFrames = 0;
    this.flashColor  = '#fff';
    this.hitEffect  = null;
    this.hitRegistered = false;

    this.dmgDealt   = 0;
    this.dmgTaken   = 0;
    this.knockdowns = 0;
    this.comboHits  = 0;
  }

  // ---------- combat ----------

  get hurtbox() {
    return { x: this.x - 26, y: this.y - 135, w: 52, h: 135 };
  }

  getAttackHitbox() {
    const atk = CONFIG.ATTACKS[this.state];
    if (!atk) return null;
    const f = this.stateFrame;
    if (f < atk.startup || f >= atk.startup + atk.active) return null;

    const dir = this.facingRight ? 1 : -1;
    const bx  = this.x + dir * 26;
    if (this.state === STATES.KICK) {
      return { x: bx, y: this.y - 70, w: 52, h: 28 };
    }
    if (this.state === STATES.SPECIAL) {
      if (this.style === 'ninja') {
        return { x: this.x - 35, y: this.y - 140, w: 70, h: 140 };
      }
      return { x: bx - 5, y: this.y - 100, w: 60, h: 80 };
    }
    return { x: bx, y: this.y - 100, w: 48, h: 26 };
  }

  receiveHit(damage, knockback, attacker) {
    if (this.invFrames > 0) return false;
    if (this.state === STATES.KNOCKDOWN || this.state === STATES.GETUP) return false;

    const dir = attacker.x < this.x ? 1 : -1;

    // Blocking
    const towardAtk = this.facingRight === (attacker.x > this.x);
    const blocking  = this.state === STATES.BLOCK && towardAtk;
    const mult      = blocking ? 0.08 : 1;
    const dmg       = Math.max(1, Math.round(damage * mult));
    const kb        = blocking ? knockback * 0.25 : knockback;

    this.hp = Math.max(0, this.hp - dmg);
    attacker.dmgDealt += dmg;
    this.dmgTaken     += dmg;
    attacker.sp = Math.min(attacker.maxSp, attacker.sp + CONFIG.ATTACKS[attacker.state]?.spGain ?? 10);
    this.sp     = Math.min(this.maxSp, this.sp + 4);

    this.vx = dir * kb;

    if (!blocking && (this.hp <= 0 || damage >= 24)) {
      this.state      = STATES.KNOCKDOWN;
      this.stateFrame = 0;
      this.vy         = -5;
      this.flashColor = '#FF2200';
      this.flashFrames = 22;
      attacker.knockdowns++;
      this.knockdowns++;
    } else if (!blocking) {
      this.state      = STATES.HURT;
      this.stateFrame = 0;
      this.flashColor = '#FFFFFF';
      this.flashFrames = 8;
    } else {
      this.flashColor = '#4488FF';
      this.flashFrames = 4;
    }

    const txt = blocking ? 'BLOCK' : (damage >= 20 ? 'STRONG!' : String(dmg));
    const col = blocking ? '#4488FF' : (damage >= 20 ? '#FF8800' : '#FFFFFF');
    this.hitEffect = { dx: (Math.random() - 0.5) * 40, dy: -110, txt, col, t: 35 };

    return true;
  }

  // ---------- update ----------

  update(input, frameCount, opponent) {
    this.stateFrame++;
    if (this.flashFrames > 0) this.flashFrames--;
    if (this.invFrames   > 0) this.invFrames--;

    this.hitRegistered = false;

    this.facingRight = opponent.x > this.x;

    switch (this.state) {
      case STATES.IDLE:
      case STATES.WALK:   this._handleMovement(input, frameCount); break;
      case STATES.JUMP:   this._handleJump(input); break;
      case STATES.CROUCH: if (!input.down) this._setState(STATES.IDLE); break;

      case STATES.PUNCH_L:
      case STATES.PUNCH_H:
      case STATES.KICK: {
        const atk = CONFIG.ATTACKS[this.state];
        const total = atk.startup + atk.active + atk.recovery;
        if (this.stateFrame >= total) this._setState(STATES.IDLE);
        break;
      }
      case STATES.SPECIAL: {
        const atk = CONFIG.ATTACKS[STATES.SPECIAL];
        const total = atk.startup + atk.active + atk.recovery;
        if (this.stateFrame >= total) this._setState(STATES.IDLE);
        this._specialPhysics();
        break;
      }
      case STATES.BLOCK:
        if (!input.block) this._setState(STATES.IDLE);
        break;

      case STATES.HURT:
        if (this.stateFrame >= 18) this._setState(STATES.IDLE);
        break;

      case STATES.KNOCKDOWN:
        if (this.stateFrame >= 80 && this.hp > 0) {
          this._setState(STATES.GETUP);
          this.invFrames = 60;
        }
        break;

      case STATES.GETUP:
        if (this.stateFrame >= 40) this._setState(STATES.IDLE);
        break;
    }

    // Physics
    if (!this.onGround) this.vy += CONFIG.GRAVITY;
    this.x += this.vx;
    this.y += this.vy;

    if (this.y >= CONFIG.GROUND_Y) {
      this.y = CONFIG.GROUND_Y;
      this.vy = 0;
      if (!this.onGround) {
        this.onGround = true;
        if (this.state === STATES.JUMP) this._setState(STATES.IDLE);
      }
    }

    const friction = [STATES.IDLE, STATES.BLOCK, STATES.HURT, STATES.KNOCKDOWN,
                      STATES.GETUP, STATES.VICTORY, STATES.DEFEAT];
    if (friction.includes(this.state) && this.onGround) {
      this.vx *= 0.72;
      if (Math.abs(this.vx) < 0.15) this.vx = 0;
    }

    this.x = Math.max(50, Math.min(CONFIG.CANVAS_WIDTH - 50, this.x));
  }

  _setState(s) { this.state = s; this.stateFrame = 0; }

  _handleMovement(input, frameCount) {
    // Attacks (edge = just pressed - tracked externally via InputManager.justPressed)
    if (input._justPunch) {
      this._setState(input.down ? STATES.PUNCH_H : STATES.PUNCH_L);
      this.vx = 0; return;
    }
    if (input._justKick) {
      this._setState(STATES.KICK);
      this.vx = 0; return;
    }
    if (input._justSpecial && this.sp >= this.maxSp) {
      this._setState(STATES.SPECIAL);
      this.sp = 0; return;
    }
    if (input.block) { this._setState(STATES.BLOCK); this.vx = 0; return; }
    if (input._justUp && this.onGround) {
      this.vy = CONFIG.JUMP_FORCE;
      this.onGround = false;
      this._setState(STATES.JUMP); return;
    }
    if (input.down && this.onGround) { this._setState(STATES.CROUCH); this.vx = 0; return; }

    const spd = CONFIG.WALK_SPEED * this.cfg.speedMult;
    if (input.left)       { this.vx = -spd; this._setState(STATES.WALK); }
    else if (input.right) { this.vx =  spd; this._setState(STATES.WALK); }
    else                  { this.vx = 0;    this._setState(STATES.IDLE); }
  }

  _handleJump(input) {
    const spd = CONFIG.WALK_SPEED * this.cfg.speedMult * 0.75;
    if (input.left)  this.vx = -spd;
    else if (input.right) this.vx = spd;
    if (input._justPunch) this._setState(STATES.PUNCH_L);
    if (input._justKick)  this._setState(STATES.KICK);
  }

  _specialPhysics() {
    if (this.style === 'ninja' && this.stateFrame >= 6 && this.stateFrame <= 16) {
      this.vx = (this.facingRight ? 1 : -1) * 8;
    }
    if (this.style === 'karate' && this.stateFrame >= 10 && this.stateFrame <= 20) {
      this.vx = (this.facingRight ? 1 : -1) * 6;
      if (this.onGround) { this.vy = -8; this.onGround = false; }
    }
    if (this.style === 'wrestler' && this.stateFrame >= 5 && this.stateFrame <= 12) {
      this.vx = (this.facingRight ? 1 : -1) * 5;
    }
  }

  // ---------- draw ----------

  draw(ctx, frameCount) {
    const dir   = this.facingRight ? 1 : -1;
    const flash = this.flashFrames > 0 && Math.floor(this.flashFrames / 2) % 2 === 0;

    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y));

    // Knockdown rotation
    if (this.state === STATES.KNOCKDOWN || this.state === STATES.DEFEAT) {
      const prog = Math.min(this.stateFrame / 18, 1);
      ctx.rotate(dir * prog * Math.PI * 0.48);
      ctx.translate(0, prog * 45);
    }

    this._drawShadow(ctx);
    this._drawLegs(ctx, dir, frameCount, flash);
    this._drawTorso(ctx, dir, flash);
    this._drawArms(ctx, dir, frameCount, flash);
    this._drawHead(ctx, dir, flash);

    ctx.restore();

    // Hit effect (in world coords)
    if (this.hitEffect) {
      this.hitEffect.t--;
      if (this.hitEffect.t > 0) {
        this._drawHitFx(ctx);
      } else {
        this.hitEffect = null;
      }
    }
  }

  _drawShadow(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 28, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawLegs(ctx, dir, frame, flash) {
    const { state, stateFrame, cfg } = this;
    const col = flash ? this.flashColor : cfg.legsColor;
    ctx.strokeStyle = col;
    ctx.lineWidth = 11;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    let lA = 0, rA = 0, rExt = 0, crouchY = 0;

    if (state === STATES.WALK) {
      const p = frame * 0.22;
      lA = Math.sin(p) * 0.42;
      rA = Math.sin(p + Math.PI) * 0.42;
    }
    if (state === STATES.JUMP || !this.onGround) { lA = -0.28; rA = 0.28; }
    if (state === STATES.CROUCH) { lA = 0.5; rA = -0.5; crouchY = 14; }
    if (state === STATES.KICK) {
      if (stateFrame < 7)  rA = dir * stateFrame * 0.055;
      else if (stateFrame < 13) { rA = dir * 0.95; rExt = 18; }
      else rA = dir * Math.max(0, 0.95 - (stateFrame - 13) * 0.11);
    }
    if (state === STATES.SPECIAL && this.style === 'karate') {
      const p = Math.min(stateFrame / 14, 1);
      lA = -0.5; rA = dir * p * 1.1; rExt = p * 20;
    }

    ctx.translate(0, crouchY);
    this._drawLimb(ctx, -8, -42, lA, 26, 26, 0);
    this._drawLimb(ctx,  8, -42, rA, 26, 26, rExt);

    // Shoes
    ctx.fillStyle = '#111';
    const ls = this._limbEnd(-8, -42, lA, 26, 26, 0);
    const rs = this._limbEnd( 8, -42, rA, 26, 26, rExt);
    ctx.beginPath(); ctx.ellipse(ls.x, ls.y, 11, 6, lA * 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(rs.x, rs.y, 11, 6, rA * 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.translate(0, -crouchY);
  }

  _drawLimb(ctx, sx, sy, angle, seg1, seg2, ext) {
    const mx = sx + Math.sin(angle) * seg1;
    const my = sy + Math.cos(Math.abs(angle)) * seg1;
    const ex = mx + Math.sin(angle * 0.45) * (seg2 + ext);
    const ey = my + Math.cos(Math.abs(angle * 0.45)) * (seg2 + ext) * 0.6;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(mx, my);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }

  _limbEnd(sx, sy, angle, seg1, seg2, ext) {
    const mx = sx + Math.sin(angle) * seg1;
    const my = sy + Math.cos(Math.abs(angle)) * seg1;
    return {
      x: mx + Math.sin(angle * 0.45) * (seg2 + ext),
      y: my + Math.cos(Math.abs(angle * 0.45)) * (seg2 + ext) * 0.6
    };
  }

  _drawTorso(ctx, dir, flash) {
    const { style, state, stateFrame, cfg } = this;
    const col = flash ? this.flashColor : cfg.torsoColor;

    let ty = -92, th = 52;
    if (state === STATES.BLOCK || state === STATES.CROUCH) { ty += 6; th -= 6; }

    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.roundRect(-20, ty, 40, th, 6);
    ctx.fill();

    // Style details
    if (style === 'boxer') {
      ctx.fillStyle = '#AA0000';
      ctx.fillRect(-18, -52, 36, 16);
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(-20, -58, 40, 6);
    } else if (style === 'ninja') {
      ctx.fillStyle = '#FF0033';
      ctx.fillRect(-20, ty - 1, 40, 7);
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(-20, ty, 40, 14);
    } else if (style === 'karate') {
      ctx.fillStyle = '#111';
      ctx.fillRect(-20, -65, 40, 5);
      ctx.fillStyle = '#DDD';
      ctx.beginPath(); ctx.moveTo(-6,-92); ctx.lineTo(-6,-52); ctx.lineTo(-19,-52); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo( 6,-92); ctx.lineTo( 6,-52); ctx.lineTo( 19,-52); ctx.closePath(); ctx.fill();
    } else if (style === 'wrestler') {
      ctx.fillStyle = cfg.torsoColor;
      ctx.fillRect(-9, -94, 18, 18);
      ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2;
      ctx.strokeRect(-20, ty, 40, th);
    } else if (style === 'street') {
      ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-8,-88); ctx.lineTo(4,-60); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(10,-80); ctx.lineTo(-2,-55); ctx.stroke();
    }
  }

  _drawArms(ctx, dir, frame, flash) {
    const { style, state, stateFrame, cfg } = this;
    const col = flash ? this.flashColor : cfg.armsColor;
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';

    let fAngle = 0.28 * dir, bAngle = -0.18 * dir, fExt = 0;

    if (state === STATES.BLOCK) { fAngle = -0.75; bAngle = -0.5; }
    if (state === STATES.WALK) {
      const p = frame * 0.22;
      fAngle = Math.sin(p + Math.PI) * 0.38 * dir;
      bAngle = Math.sin(p) * 0.38 * dir;
    }
    if (state === STATES.IDLE) {
      const sway = Math.sin(frame * 0.05 + this._idlePhase) * 0.08;
      fAngle += sway; bAngle -= sway;
    }
    if (state === STATES.PUNCH_L || state === STATES.PUNCH_H) {
      const atk = CONFIG.ATTACKS[state];
      const maxExt = state === STATES.PUNCH_H ? 38 : 26;
      if (stateFrame < atk.startup) {
        fAngle = -0.22 * dir; bAngle = 0.35 * dir;
      } else if (stateFrame < atk.startup + atk.active) {
        fExt = maxExt; fAngle = 0.04 * dir;
      } else {
        const t = (stateFrame - atk.startup - atk.active) / atk.recovery;
        fExt = maxExt * (1 - t);
      }
    }
    if (state === STATES.SPECIAL) {
      if (style === 'boxer') {
        const p = stateFrame * 0.9;
        fAngle = Math.sin(p) * 0.18 * dir;
        fExt   = Math.max(0, Math.sin(p) * 32);
      } else if (style === 'ninja') {
        fAngle = -0.55 * dir; bAngle = -0.35 * dir;
      } else if (style === 'karate') {
        fAngle = -0.55 * dir; bAngle = -0.38 * dir;
      } else if (style === 'wrestler') {
        const p = Math.min(stateFrame / 12, 1);
        fExt = p * 30; fAngle = 0.05 * dir;
      }
    }

    const SY = -82;
    this._drawLimb(ctx, dir * 17, SY, fAngle, 18, 18, fExt);
    this._drawLimb(ctx, -dir * 15, SY, bAngle, 18, 18, 0);

    // Fists
    const fstColor = style === 'boxer' ? '#CC0000'
                   : style === 'karate' ? '#FFFFFF' : col;
    const fe = this._limbEnd(dir * 17, SY, fAngle, 18, 18, fExt);
    const be = this._limbEnd(-dir * 15, SY, bAngle, 18, 18, 0);

    ctx.fillStyle = fstColor;
    ctx.beginPath(); ctx.arc(fe.x, fe.y, 9, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#222'; ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(be.x, be.y, 8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#222'; ctx.stroke();
    ctx.lineWidth = 10;
  }

  _drawHead(ctx, dir, flash) {
    const hx = 0, hy = -116, hr = 23;

    ctx.save();
    ctx.beginPath();
    ctx.arc(hx, hy, hr, 0, Math.PI * 2);
    ctx.clip();

    if (this.face) {
      ctx.drawImage(this.face, hx - hr, hy - hr, hr * 2, hr * 2);
    } else {
      ctx.fillStyle = '#FFB347';
      ctx.fillRect(hx - hr, hy - hr, hr * 2, hr * 2);
    }

    if (flash) {
      ctx.fillStyle = this.flashColor + '70';
      ctx.fillRect(hx - hr, hy - hr, hr * 2, hr * 2);
    }

    ctx.restore();

    ctx.strokeStyle = flash ? this.flashColor : '#1a1a1a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(hx, hy, hr, 0, Math.PI * 2);
    ctx.stroke();

    this._drawHeadGear(ctx, dir, hx, hy, hr, flash);

    if (this.state === STATES.BLOCK) {
      ctx.strokeStyle = this.cfg.armsColor;
      ctx.lineWidth = 11; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-27, hy + 6);
      ctx.lineTo( 27, hy - 8);
      ctx.stroke();
    }
  }

  _drawHeadGear(ctx, dir, hx, hy, hr, flash) {
    const { style, cfg } = this;
    if (style === 'ninja') {
      ctx.fillStyle = '#CC0033';
      ctx.fillRect(hx - hr - 2, hy - 6, (hr + 2) * 2, 9);
      ctx.fillStyle = 'rgba(10,10,20,0.88)';
      ctx.beginPath();
      ctx.arc(hx, hy, hr, 0.15, Math.PI - 0.15);
      ctx.fill();
    } else if (style === 'boxer') {
      ctx.strokeStyle = '#AA0000'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(hx, hy, hr + 4, Math.PI * 0.8, Math.PI * 0.2, true); ctx.stroke();
    } else if (style === 'karate') {
      ctx.fillStyle = '#CC0000';
      ctx.fillRect(hx - hr, hy - hr, hr * 2, 8);
    } else if (style === 'wrestler') {
      ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(hx, hy, hr + 3, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#006622'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(hx - 9, hy - 9); ctx.lineTo(hx + 9, hy + 9); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(hx + 9, hy - 9); ctx.lineTo(hx - 9, hy + 9); ctx.stroke();
    } else if (style === 'street') {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.arc(hx, hy - hr + 5, hr * 0.9, Math.PI + 0.3, Math.PI * 2 - 0.3);
      ctx.fill();
    }
  }

  _drawHitFx(ctx) {
    const fx = this.hitEffect;
    if (!fx) return;
    const floatY = (35 - fx.t) * 0.6;
    const alpha  = Math.min(1, fx.t / 14);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `bold ${fx.txt.length > 3 ? 13 : 17}px 'Arial Black', Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    const wx = this.x + fx.dx;
    const wy = this.y + fx.dy - floatY;
    ctx.strokeText(fx.txt, wx, wy);
    ctx.fillStyle = fx.col;
    ctx.fillText(fx.txt, wx, wy);
    ctx.restore();
  }
}
