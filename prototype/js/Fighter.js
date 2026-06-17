class Fighter {
  constructor(id, x, style, faceCanvas, name, photoColors, traits) {
    this.id     = id;
    this.style  = style;
    this.cfg    = Object.assign({}, CONFIG.STYLES[style]);
    this.face   = faceCanvas;
    this.name   = name || this.cfg.name;
    this.maxHp  = Math.round(100 * this.cfg.hpMult);
    this.maxSp  = 100;
    this._idlePhase = Math.random() * Math.PI * 2;

    // Apply photo colors
    this.photoColors = photoColors || null;
    this.traits = traits || {};

    if (photoColors && photoColors.shirt) {
      this.cfg.torsoColor = photoColors.shirt;
      this.cfg.armsColor  = photoColors.shirt;
    }
    if (photoColors && photoColors.pants) {
      this.cfg.legsColor = photoColors.pants;
    }

    // Body scale from traits
    this._scaleX = (traits && traits.scaleX) ? traits.scaleX : 1.0;
    this._scaleY = (traits && traits.scaleY) ? traits.scaleY : 1.0;

    this.resetForMatch(x);
  }

  resetForMatch(x) { this.hp=this.maxHp; this.sp=0; this.wins=0; this.reset(x); }

  reset(x) {
    this.x=x; this.y=CONFIG.GROUND_Y; this.vx=0; this.vy=0;
    this.onGround=true; this.facingRight=(this.id===1);
    this.state=STATES.IDLE; this.stateFrame=0;
    this.invFrames=80; this.flashFrames=0; this.flashColor='#fff';
    this.hitEffect=null; this.hitRegistered=false;
    this.dmgDealt=0; this.dmgTaken=0; this.knockdowns=0; this.comboHits=0;
  }

  get hurtbox() { return {x:this.x-28,y:this.y-148,w:56,h:148}; }

  getAttackHitbox() {
    const atk=CONFIG.ATTACKS[this.state];
    if (!atk) return null;
    const f=this.stateFrame;
    if (f<atk.startup||f>=atk.startup+atk.active) return null;
    const dir=this.facingRight?1:-1;
    const bx=this.x+dir*28;
    if (this.state===STATES.KICK)   return {x:bx,y:this.y-75,w:56,h:30};
    if (this.state===STATES.SPECIAL) {
      if (this.style==='ninja') return {x:this.x-38,y:this.y-155,w:76,h:155};
      return {x:bx-5,y:this.y-110,w:65,h:90};
    }
    return {x:bx,y:this.y-110,w:52,h:28};
  }

  receiveHit(damage,knockback,attacker) {
    if (this.invFrames>0) return false;
    if (this.state===STATES.KNOCKDOWN||this.state===STATES.GETUP) return false;
    const dir=attacker.x<this.x?1:-1;
    const towardAtk=this.facingRight===(attacker.x>this.x);
    const blocking=this.state===STATES.BLOCK&&towardAtk;
    const mult=blocking?0.08:1;
    const dmg=Math.max(1,Math.round(damage*mult));
    this.hp=Math.max(0,this.hp-dmg);
    attacker.dmgDealt+=dmg; this.dmgTaken+=dmg;
    attacker.sp=Math.min(attacker.maxSp,attacker.sp+(CONFIG.ATTACKS[attacker.state]?.spGain??10));
    this.sp=Math.min(this.maxSp,this.sp+4);
    this.vx=dir*(blocking?knockback*0.25:knockback);
    if (!blocking&&(this.hp<=0||damage>=24)) {
      this.state=STATES.KNOCKDOWN; this.stateFrame=0; this.vy=-5;
      this.flashColor='#FF2200'; this.flashFrames=22; attacker.knockdowns++;
    } else if (!blocking) {
      this.state=STATES.HURT; this.stateFrame=0;
      this.flashColor='#FFFFFF'; this.flashFrames=8;
    } else {
      this.flashColor='#4488FF'; this.flashFrames=4;
    }
    const txt=blocking?'BLOCK':(damage>=20?'STRONG!':String(dmg));
    const col=blocking?'#4488FF':(damage>=20?'#FF8800':'#FFFFFF');
    this.hitEffect={dx:(Math.random()-0.5)*50,dy:-120,txt,col,t:35};
    return true;
  }

  update(input,frameCount,opponent) {
    this.stateFrame++;
    if (this.flashFrames>0) this.flashFrames--;
    if (this.invFrames>0)   this.invFrames--;
    this.hitRegistered=false;
    this.facingRight=opponent.x>this.x;

    switch(this.state) {
      case STATES.IDLE:
      case STATES.WALK:   this._handleMovement(input,frameCount); break;
      case STATES.JUMP:   this._handleJump(input); break;
      case STATES.CROUCH: if(!input.down) this._setState(STATES.IDLE); break;
      case STATES.PUNCH_L:
      case STATES.PUNCH_H:
      case STATES.KICK: {
        const atk=CONFIG.ATTACKS[this.state];
        if (this.stateFrame>=atk.startup+atk.active+atk.recovery) this._setState(STATES.IDLE);
        break;
      }
      case STATES.SPECIAL: {
        const atk=CONFIG.ATTACKS[STATES.SPECIAL];
        if (this.stateFrame>=atk.startup+atk.active+atk.recovery) this._setState(STATES.IDLE);
        this._specialPhysics();
        break;
      }
      case STATES.BLOCK:     if(!input.block) this._setState(STATES.IDLE); break;
      case STATES.HURT:      if(this.stateFrame>=18) this._setState(STATES.IDLE); break;
      case STATES.KNOCKDOWN:
        if(this.stateFrame>=80&&this.hp>0) { this._setState(STATES.GETUP); this.invFrames=60; }
        break;
      case STATES.GETUP: if(this.stateFrame>=40) this._setState(STATES.IDLE); break;
    }

    if (!this.onGround) this.vy+=CONFIG.GRAVITY;
    this.x+=this.vx; this.y+=this.vy;
    if (this.y>=CONFIG.GROUND_Y) {
      this.y=CONFIG.GROUND_Y; this.vy=0;
      if (!this.onGround) {
        this.onGround=true;
        if (this.state===STATES.JUMP) this._setState(STATES.IDLE);
      }
    }
    const friction=[STATES.IDLE,STATES.BLOCK,STATES.HURT,STATES.KNOCKDOWN,
                    STATES.GETUP,STATES.VICTORY,STATES.DEFEAT];
    if (friction.includes(this.state)&&this.onGround) {
      this.vx*=0.72; if(Math.abs(this.vx)<0.15) this.vx=0;
    }
    this.x=Math.max(52,Math.min(CONFIG.CANVAS_WIDTH-52,this.x));
  }

  _setState(s){this.state=s;this.stateFrame=0;}

  _handleMovement(input,frameCount) {
    if (input._justPunch) { this._setState(input.down?STATES.PUNCH_H:STATES.PUNCH_L); this.vx=0; return; }
    if (input._justKick)  { this._setState(STATES.KICK); this.vx=0; return; }
    if (input._justSpecial&&this.sp>=this.maxSp) { this._setState(STATES.SPECIAL); this.sp=0; return; }
    if (input.block) { this._setState(STATES.BLOCK); this.vx=0; return; }
    if (input._justUp&&this.onGround) { this.vy=CONFIG.JUMP_FORCE; this.onGround=false; this._setState(STATES.JUMP); return; }
    if (input.down&&this.onGround) { this._setState(STATES.CROUCH); this.vx=0; return; }
    const spd=CONFIG.WALK_SPEED*this.cfg.speedMult;
    if (input.left)       { this.vx=-spd; this._setState(STATES.WALK); }
    else if (input.right) { this.vx= spd; this._setState(STATES.WALK); }
    else                  { this.vx=0;    this._setState(STATES.IDLE); }
  }

  _handleJump(input) {
    const spd=CONFIG.WALK_SPEED*this.cfg.speedMult*0.75;
    if (input.left)  this.vx=-spd;
    else if (input.right) this.vx=spd;
    if (input._justPunch) this._setState(STATES.PUNCH_L);
    if (input._justKick)  this._setState(STATES.KICK);
  }

  _specialPhysics() {
    if (this.style==='ninja'&&this.stateFrame>=6&&this.stateFrame<=16)
      this.vx=(this.facingRight?1:-1)*9;
    if (this.style==='karate'&&this.stateFrame>=10&&this.stateFrame<=20) {
      this.vx=(this.facingRight?1:-1)*7;
      if (this.onGround){this.vy=-9;this.onGround=false;}
    }
    if (this.style==='wrestler'&&this.stateFrame>=5&&this.stateFrame<=12)
      this.vx=(this.facingRight?1:-1)*5;
  }

  // ================ IDLE POSE ================

  _getIdlePose(frame) {
    const t = frame * 0.048 + this._idlePhase;
    // Weight shift (slow, left-right)
    const weight = Math.sin(t * 0.38) * 2.2;
    // Knee bounce (in sync with weight shift, faster)
    const kneeAmp = (Math.cos(t * 0.76) * 0.5 + 0.5) * 3.5;
    // Chest breath
    const breath = Math.sin(t * 0.9) * 1.4;
    // Guard hands sway
    const guardSway = Math.sin(t * 1.1) * 0.5;
    // Head subtle movement
    const headX = Math.sin(t * 0.5) * 1.2;
    const headY = Math.sin(t * 0.9) * 0.8;
    return { weight, kneeAmp, breath, guardSway, headX, headY };
  }

  // ================ DRAWING ================

  draw(ctx,frameCount) {
    const dir=this.facingRight?1:-1;
    const flash=this.flashFrames>0&&Math.floor(this.flashFrames/2)%2===0;

    ctx.save();
    ctx.translate(Math.round(this.x),Math.round(this.y));

    // Apply body scale from traits
    if (this._scaleX !== 1.0 || this._scaleY !== 1.0) {
      ctx.scale(this._scaleX, this._scaleY);
    }

    if (this.state===STATES.KNOCKDOWN||this.state===STATES.DEFEAT) {
      const prog=Math.min(this.stateFrame/16,1);
      ctx.rotate(dir*prog*Math.PI*0.45);
      ctx.translate(0,prog*50);
    }

    this._drawShadow(ctx);
    this._drawCharacter(ctx,dir,frameCount,flash);
    ctx.restore();

    if (this.hitEffect) {
      this.hitEffect.t--;
      if (this.hitEffect.t>0) this._drawHitFx(ctx);
      else this.hitEffect=null;
    }
  }

  _drawShadow(ctx) {
    ctx.fillStyle='rgba(0,0,0,0.22)';
    ctx.beginPath(); ctx.ellipse(0,2,32,8,0,0,Math.PI*2); ctx.fill();
  }

  _drawCharacter(ctx,dir,frame,flash) {
    const {state,stateFrame,style,cfg}=this;

    // Idle pose system
    let idlePose = null;
    if (state===STATES.IDLE) {
      idlePose = this._getIdlePose(frame);
      ctx.translate(idlePose.weight, idlePose.breath);
    }

    // Pose adjustments
    let crouchY=0,leanX=0,leanAngle=0;
    if (state===STATES.CROUCH) crouchY=18;
    if (state===STATES.WALK)   leanAngle=dir*0.06;
    if (state===STATES.HURT)   leanX=dir*-4;
    if (state===STATES.VICTORY) ctx.translate(0,Math.sin(frame*0.1)*4-4);

    ctx.translate(leanX,0);
    if (leanAngle) ctx.rotate(leanAngle);
    ctx.translate(0,crouchY);

    // Draw layers back-to-front
    this._drawLegs(ctx,dir,frame,flash,crouchY>0,idlePose);
    this._drawTorso(ctx,dir,flash,crouchY>0);
    this._drawArms(ctx,dir,frame,flash,idlePose);
    this._drawNeck(ctx,dir,flash);
    this._drawHead(ctx,dir,flash,frame,idlePose);
  }

  // ---- LEGS (filled shapes) ----
  _drawLegs(ctx,dir,frame,flash,crouching,idlePose) {
    const {state,stateFrame,cfg}=this;
    const col=flash?this.flashColor:cfg.torsoColor;
    const dark=this._darken(cfg.torsoColor,40);

    // Leg geometry
    let lThighAngle=0,rThighAngle=0,lShinAngle=0,rShinAngle=0;
    const thighLen=42,shinLen=40;

    if (state===STATES.IDLE && idlePose) {
      // Slight outward stance + knee bounce from idlePose
      const kBend = idlePose.kneeAmp * 0.015;
      lThighAngle = 0.15; rThighAngle = -0.15;
      lShinAngle = kBend; rShinAngle = kBend;
    }
    if (state===STATES.WALK) {
      const p=frame*0.22;
      lThighAngle=Math.sin(p)*0.45; rThighAngle=Math.sin(p+Math.PI)*0.45;
      lShinAngle=Math.max(0,Math.sin(p+0.4))*0.3; rShinAngle=Math.max(0,Math.sin(p+Math.PI+0.4))*0.3;
      // Foot stomp: slight body dip when foot hits ground
      const stomp = Math.max(0, Math.sin(p * 2)) * 1.5;
      ctx.translate(0, stomp);
    }
    if (state===STATES.JUMP||!this.onGround) {lThighAngle=-0.3;rThighAngle=0.3;lShinAngle=0.3;rShinAngle=0.3;}
    if (crouching) {lThighAngle=0.6;rThighAngle=-0.6;lShinAngle=0.6;rShinAngle=0.6;}
    if (state===STATES.KICK) {
      if (stateFrame<7) rThighAngle=dir*stateFrame*0.07;
      else if (stateFrame<13){rThighAngle=dir*0.9;rShinAngle=-dir*0.5;}
      else {const t=(stateFrame-13)/7;rThighAngle=dir*0.9*(1-t);}
    }

    // Draw both legs
    this._drawLeg(ctx,-10,-68,lThighAngle,thighLen,lShinAngle,shinLen,cfg.legsColor,dark,dir);
    this._drawLeg(ctx, 10,-68,rThighAngle,thighLen,rShinAngle,shinLen,cfg.legsColor,dark,dir);
  }

  _drawLeg(ctx,ox,oy,thighA,thighL,shinA,shinL,color,dark,dir) {
    // Thigh
    const kx=ox+Math.sin(thighA)*thighL;
    const ky=oy+Math.cos(Math.abs(thighA))*thighL;
    ctx.strokeStyle=color; ctx.lineWidth=18; ctx.lineCap='round'; ctx.lineJoin='round';
    ctx.beginPath(); ctx.moveTo(ox,oy); ctx.lineTo(kx,ky); ctx.stroke();

    // Shin
    const fx=kx+Math.sin(thighA+shinA)*shinL;
    const fy=ky+Math.cos(Math.abs(thighA+shinA))*shinL;
    ctx.strokeStyle=dark; ctx.lineWidth=15;
    ctx.beginPath(); ctx.moveTo(kx,ky); ctx.lineTo(fx,fy); ctx.stroke();

    // Shoe
    ctx.fillStyle='#1a1a1a';
    ctx.beginPath();
    const fwd=dir>0?1:-1;
    ctx.ellipse(fx+(fwd*7),fy,14,7,thighA*0.3,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#444'; ctx.lineWidth=1; ctx.stroke();
  }

  // ---- TORSO (filled body) ----
  _drawTorso(ctx,dir,flash,crouching) {
    const {style,cfg}=this;
    const col=flash?this.flashColor:cfg.torsoColor;
    const dark=this._darken(cfg.torsoColor,30);
    const oy=crouching?6:0;

    // Hips
    ctx.fillStyle=dark;
    ctx.beginPath(); ctx.roundRect(-22,-68+oy,44,22,4); ctx.fill();

    // Main torso (trapezoid shape - wider at shoulders)
    ctx.fillStyle=col;
    ctx.beginPath();
    ctx.moveTo(-24,-68+oy); // hip left
    ctx.lineTo(-28,-115+oy); // shoulder left
    ctx.lineTo( 28,-115+oy); // shoulder right
    ctx.lineTo( 24,-68+oy); // hip right
    ctx.closePath(); ctx.fill();

    // Style costume details
    this._drawCostume(ctx,dir,col,dark,oy);

    // Chest highlight
    ctx.fillStyle='rgba(255,255,255,0.08)';
    ctx.beginPath(); ctx.moveTo(-14,-68+oy); ctx.lineTo(-18,-115+oy);
    ctx.lineTo(0,-115+oy); ctx.lineTo(2,-68+oy); ctx.closePath(); ctx.fill();
  }

  _drawCostume(ctx,dir,col,dark,oy) {
    const {style}=this;
    if (style==='boxer') {
      // Shorts
      ctx.fillStyle='#AA0000'; ctx.beginPath(); ctx.roundRect(-22,-68+oy,44,20,3); ctx.fill();
      // Gold trim
      ctx.fillStyle='#FFD700'; ctx.fillRect(-24,-70+oy,48,5);
      // Muscle lines
      ctx.strokeStyle='rgba(0,0,0,0.2)'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(0,-115+oy); ctx.lineTo(0,-70+oy); ctx.stroke();
    } else if (style==='ninja') {
      // Dark vest
      ctx.fillStyle='rgba(0,0,0,0.4)';
      ctx.beginPath(); ctx.moveTo(-8,-115+oy); ctx.lineTo(-8,-68+oy); ctx.lineTo(8,-68+oy); ctx.lineTo(8,-115+oy); ctx.fill();
      // Red sash
      ctx.fillStyle='#CC0033'; ctx.fillRect(-24,-76+oy,48,7);
    } else if (style==='karate') {
      // Gi lapels
      ctx.fillStyle='rgba(255,255,255,0.6)';
      ctx.beginPath(); ctx.moveTo(-8,-115+oy); ctx.lineTo(-8,-70+oy); ctx.lineTo(-24,-70+oy); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo( 8,-115+oy); ctx.lineTo( 8,-70+oy); ctx.lineTo( 24,-70+oy); ctx.closePath(); ctx.fill();
      // Black belt
      ctx.fillStyle='#111'; ctx.fillRect(-24,-76+oy,48,8);
    } else if (style==='wrestler') {
      // Singlet straps
      ctx.fillStyle=this._darken(this.cfg.torsoColor,20);
      ctx.fillRect(-10,-115+oy,20,48);
      // Gold star
      ctx.fillStyle='#FFD700';
      this._drawStar(ctx,0,-95+oy,8);
    } else if (style==='street') {
      // Torn hoodie
      ctx.fillStyle='rgba(0,0,0,0.35)'; ctx.fillRect(-28,-115+oy,12,47);
      ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(-8,-110+oy); ctx.lineTo(4,-75+oy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(10,-105+oy); ctx.lineTo(-2,-72+oy); ctx.stroke();
    }
  }

  // ---- ARMS (chunky) ----
  _drawArms(ctx,dir,frame,flash,idlePose) {
    const {state,stateFrame,style,cfg}=this;
    const col=flash?this.flashColor:cfg.armsColor;
    const SY=-110;

    // Arm animation
    let fAngle=0.3*dir,bAngle=-0.2*dir,fForeAngle=0.15,bForeAngle=0.1,fExt=0;

    if (state===STATES.BLOCK) { fAngle=-0.7;bAngle=-0.5;fForeAngle=-0.3;bForeAngle=-0.4; }
    if (state===STATES.WALK) {
      const p=frame*0.22;
      fAngle=Math.sin(p+Math.PI)*0.42*dir; bAngle=Math.sin(p)*0.42*dir;
    }
    if (state===STATES.IDLE && idlePose) {
      // Low guard position: arms bent up around chest, hands in front
      const gs = idlePose.guardSway;
      fAngle = (-0.35 + gs) * dir;
      bAngle = (-0.25 - gs) * dir;
      fForeAngle = -0.55;
      bForeAngle = -0.45;
    }
    if (state===STATES.PUNCH_L||state===STATES.PUNCH_H) {
      const atk=CONFIG.ATTACKS[state];
      const maxExt=state===STATES.PUNCH_H?42:30;
      if (stateFrame<atk.startup) {fAngle=-0.25*dir;bAngle=0.4*dir;}
      else if (stateFrame<atk.startup+atk.active) {fExt=maxExt;fAngle=0.05*dir;fForeAngle=0;}
      else {const t=(stateFrame-atk.startup-atk.active)/atk.recovery;fExt=maxExt*(1-t);}
    }
    if (state===STATES.KICK) {fAngle=-0.3*dir;bAngle=0.3*dir;}
    if (state===STATES.SPECIAL) {
      if (style==='boxer'){const p=stateFrame*0.85;fAngle=Math.sin(p)*0.2*dir;fExt=Math.max(0,Math.sin(p)*36);}
      else if (style==='ninja'){fAngle=-0.6*dir;bAngle=-0.38*dir;}
      else if (style==='karate'){fAngle=-0.55*dir;bAngle=-0.4*dir;}
      else if (style==='wrestler'){const p=Math.min(stateFrame/12,1);fExt=p*34;fAngle=0.05*dir;}
    }
    if (state===STATES.VICTORY){fAngle=-1.1*dir;bAngle=0.2*dir;}
    if (state===STATES.CROUCH){fAngle=0.4*dir;bAngle=-0.3*dir;}

    // back arm first
    this._drawArm(ctx,-dir*16,SY,bAngle,bForeAngle,0,col,style,false);
    // front arm
    this._drawArm(ctx, dir*17,SY,fAngle,fForeAngle,fExt,col,style,true);
  }

  _drawArm(ctx,ox,oy,upperAngle,foreAngle,ext,color,style,isFront) {
    const upperLen=26,foreLen=24;
    const ex=ox+Math.sin(upperAngle)*upperLen;
    const ey=oy+Math.cos(Math.abs(upperAngle))*upperLen+8;
    const fx=ex+Math.sin(upperAngle+foreAngle)*(foreLen+ext);
    const fy=ey+Math.cos(Math.abs(upperAngle+foreAngle))*(foreLen+ext)*0.5;

    // Upper arm
    ctx.strokeStyle=color; ctx.lineWidth=isFront?17:14; ctx.lineCap='round'; ctx.lineJoin='round';
    ctx.beginPath(); ctx.moveTo(ox,oy); ctx.lineTo(ex,ey); ctx.stroke();

    // Forearm
    ctx.strokeStyle=this._darken(color,25); ctx.lineWidth=isFront?14:12;
    ctx.beginPath(); ctx.moveTo(ex,ey); ctx.lineTo(fx,fy); ctx.stroke();

    // Fist / glove
    const fistR=isFront?11:9;
    const fistCol=style==='boxer'?(isFront?'#DD0000':'#CC0000')
                 :style==='karate'?'rgba(255,255,255,0.9)':color;
    ctx.fillStyle=fistCol;
    ctx.beginPath(); ctx.arc(fx,fy,fistR,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.4)'; ctx.lineWidth=2; ctx.stroke();

    // Boxer glove detail
    if (style==='boxer') {
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.arc(fx,fy,fistR*0.6,Math.PI*1.1,Math.PI*1.9); ctx.stroke();
    }
  }

  // ---- NECK ----
  _drawNeck(ctx,dir,flash) {
    ctx.fillStyle=flash?this.flashColor:'#d4956a';
    ctx.fillRect(-6,-124,12,14);
  }

  // ---- HEAD (with face photo) ----
  _drawHead(ctx,dir,flash,frame,idlePose) {
    const hx=0,hy=-148,hr=27;
    const traits = this.traits || {};

    // Apply head movement from idle pose
    let headOffX = 0, headOffY = 0;
    if (idlePose) {
      headOffX = idlePose.headX;
      headOffY = idlePose.headY;
    }

    ctx.save();
    ctx.translate(headOffX, headOffY);

    // Bald cap (drawn behind face clip)
    if (traits.bald) {
      ctx.fillStyle = '#d4956a';
      ctx.beginPath(); ctx.arc(hx, hy, hr+2, 0, Math.PI*2); ctx.fill();
    }

    // Clip face to circle
    ctx.save();
    ctx.beginPath(); ctx.arc(hx,hy,hr,0,Math.PI*2); ctx.clip();
    if (this.face) ctx.drawImage(this.face,hx-hr,hy-hr,hr*2,hr*2);
    else {
      ctx.fillStyle='#d4956a'; ctx.fillRect(hx-hr,hy-hr,hr*2,hr*2);
    }
    if (flash) { ctx.fillStyle=this.flashColor+'70'; ctx.fillRect(hx-hr,hy-hr,hr*2,hr*2); }
    ctx.restore();

    // Head outline
    ctx.strokeStyle=flash?this.flashColor:'#111'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.arc(hx,hy,hr,0,Math.PI*2); ctx.stroke();

    // Style headgear
    this._drawHeadGear(ctx,dir,hx,hy,hr,flash,frame);

    // Draw traits accessories
    this._drawTraitAccessories(ctx, hx, hy, hr, traits, flash);

    ctx.restore();

    // Block guard
    if (this.state===STATES.BLOCK) {
      ctx.strokeStyle=this.cfg.armsColor; ctx.lineWidth=13; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(-30,hy+8); ctx.lineTo(30,hy-10); ctx.stroke();
    }
  }

  _drawTraitAccessories(ctx, hx, hy, hr, traits, flash) {
    if (!traits) return;

    // Beard
    if (traits.beard) {
      ctx.fillStyle = this.photoColors && this.photoColors.hair ? this.photoColors.hair : '#553300';
      ctx.beginPath();
      ctx.ellipse(hx, hy + hr * 0.55, hr * 0.72, hr * 0.45, 0, 0, Math.PI);
      ctx.fill();
      // Beard texture lines
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(hx + i * 8, hy + hr * 0.28);
        ctx.lineTo(hx + i * 10, hy + hr * 0.85);
        ctx.stroke();
      }
    }

    // Mustache
    if (traits.mustache) {
      const mCol = this.photoColors && this.photoColors.hair ? this.photoColors.hair : '#553300';
      ctx.fillStyle = mCol;
      ctx.beginPath();
      ctx.ellipse(hx - 6, hy + 5, 8, 4, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(hx + 6, hy + 5, 8, 4, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Glasses
    if (traits.glasses) {
      ctx.strokeStyle = '#222'; ctx.lineWidth = 2;
      // Left lens
      ctx.beginPath(); ctx.arc(hx - 10, hy - 4, 8, 0, Math.PI * 2); ctx.stroke();
      // Right lens
      ctx.beginPath(); ctx.arc(hx + 10, hy - 4, 8, 0, Math.PI * 2); ctx.stroke();
      // Bridge
      ctx.beginPath(); ctx.moveTo(hx - 2, hy - 4); ctx.lineTo(hx + 2, hy - 4); ctx.stroke();
      // Temple arms
      ctx.beginPath(); ctx.moveTo(hx - 18, hy - 4); ctx.lineTo(hx - hr + 2, hy - 4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(hx + 18, hy - 4); ctx.lineTo(hx + hr - 2, hy - 4); ctx.stroke();
      // Tint
      ctx.fillStyle = 'rgba(0,80,160,0.15)';
      ctx.beginPath(); ctx.arc(hx - 10, hy - 4, 8, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(hx + 10, hy - 4, 8, 0, Math.PI * 2); ctx.fill();
    }

    // Hat (drawn last, on top)
    if (traits.hat) {
      ctx.fillStyle = '#1a1a1a';
      // Brim
      ctx.beginPath(); ctx.ellipse(hx, hy - hr + 4, hr + 6, 5, 0, 0, Math.PI * 2); ctx.fill();
      // Crown
      ctx.fillRect(hx - hr * 0.65, hy - hr - 20, hr * 1.3, 24);
      // Hat band
      ctx.fillStyle = '#8B0000';
      ctx.fillRect(hx - hr * 0.65, hy - hr + 2, hr * 1.3, 5);
    }
  }

  _drawHeadGear(ctx,dir,hx,hy,hr,flash,frame) {
    const {style,cfg}=this;
    if (style==='ninja') {
      // Headband
      ctx.fillStyle='#CC0033';
      ctx.fillRect(hx-hr-2,hy-6,(hr+2)*2,10);
      // Mask (lower face)
      ctx.fillStyle='rgba(8,8,20,0.88)';
      ctx.beginPath(); ctx.arc(hx,hy,hr,0.1,Math.PI-0.1); ctx.fill();
      // Mask line
      ctx.strokeStyle='#333'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(hx-hr+2,hy+2); ctx.lineTo(hx+hr-2,hy+2); ctx.stroke();
    } else if (style==='boxer') {
      // Headguard
      ctx.strokeStyle='#CC0000'; ctx.lineWidth=6;
      ctx.beginPath(); ctx.arc(hx,hy,hr+5,Math.PI*0.75,Math.PI*0.25,true); ctx.stroke();
      ctx.strokeStyle='rgba(200,0,0,0.4)'; ctx.lineWidth=3;
      ctx.beginPath(); ctx.arc(hx,hy,hr+8,Math.PI*0.8,Math.PI*0.2,true); ctx.stroke();
    } else if (style==='karate') {
      // Headband
      ctx.fillStyle='#CC0000'; ctx.fillRect(hx-hr,hy-hr+2,hr*2,9);
      // Knot on right side
      ctx.fillStyle='#AA0000'; ctx.beginPath(); ctx.arc(hx+hr-4,hy-hr+6,5,0,Math.PI*2); ctx.fill();
    } else if (style==='wrestler') {
      // Lucha mask
      ctx.strokeStyle='#FFD700'; ctx.lineWidth=4;
      ctx.beginPath(); ctx.arc(hx,hy,hr+4,0,Math.PI*2); ctx.stroke();
      ctx.strokeStyle=cfg.accentColor; ctx.lineWidth=2;
      // Mask design
      ctx.beginPath(); ctx.moveTo(hx-12,hy-10); ctx.lineTo(hx,hy-3); ctx.lineTo(hx+12,hy-10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(hx-10,hy+5); ctx.lineTo(hx,hy+12); ctx.lineTo(hx+10,hy+5); ctx.stroke();
    } else if (style==='street') {
      // Backwards cap
      ctx.fillStyle='#222'; ctx.fillRect(hx-hr+2,hy-hr,hr*2-4,12);
      ctx.fillStyle='#333'; ctx.fillRect(hx-hr-4,hy-hr+8,10,5);
      // Scar
      ctx.strokeStyle='rgba(180,60,60,0.6)'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(hx-6,hy-5); ctx.lineTo(hx-2,hy+4); ctx.stroke();
    }
  }

  _drawHitFx(ctx) {
    const fx=this.hitEffect;
    const floatY=(35-fx.t)*0.7, alpha=Math.min(1,fx.t/14);
    ctx.save(); ctx.globalAlpha=alpha;
    ctx.font=`bold ${fx.txt.length>3?14:19}px 'Arial Black',Arial`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.strokeStyle='#000'; ctx.lineWidth=4;
    ctx.strokeText(fx.txt,this.x+fx.dx,this.y+fx.dy-floatY);
    ctx.fillStyle=fx.col;
    ctx.fillText(fx.txt,this.x+fx.dx,this.y+fx.dy-floatY);
    ctx.restore();
  }

  // ---- helpers ----
  _darken(hex,amount) {
    const n=parseInt(hex.replace('#',''),16);
    const r=Math.max(0,(n>>16)-amount);
    const g=Math.max(0,((n>>8)&0xFF)-amount);
    const b=Math.max(0,(n&0xFF)-amount);
    return `rgb(${r},${g},${b})`;
  }

  _drawStar(ctx,cx,cy,r) {
    ctx.beginPath();
    for (let i=0;i<5;i++) {
      const a=Math.PI/2+i*Math.PI*2/5;
      const ia=a+Math.PI/5;
      i===0?ctx.moveTo(cx+Math.cos(a)*r,cy-Math.sin(a)*r):ctx.lineTo(cx+Math.cos(a)*r,cy-Math.sin(a)*r);
      ctx.lineTo(cx+Math.cos(ia)*r*0.4,cy-Math.sin(ia)*r*0.4);
    }
    ctx.closePath(); ctx.fill();
  }
}
