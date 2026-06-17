class AIController {
  constructor(aiFighter, opponent) {
    this.ai  = aiFighter;
    this.opp = opponent;
    this._tickInterval = 8; // recalculate decision every N frames
    this._tick = 0;
    this._decision = null;
    this._reactionDelay = 6;
    this._reactionTimer = 0;
  }

  getInput(frameCount) {
    this._tick++;
    if (this._tick % this._tickInterval === 0) {
      this._decide();
    }
    return this._applyDecision();
  }

  _decide() {
    const ai  = this.ai;
    const opp = this.opp;
    const dist = Math.abs(ai.x - opp.x);
    const oppHP = opp.hp / opp.maxHp;
    const myHP  = ai.hp / ai.maxHp;

    const canAct = [STATES.IDLE, STATES.WALK].includes(ai.state);
    if (!canAct) { this._decision = null; return; }

    // Aggressive when opponent is weak
    const aggression = 0.5 + (1 - oppHP) * 0.4 - (1 - myHP) * 0.2;

    let d = { left:false, right:false, up:false, down:false,
              punch:false, kick:false, special:false, block:false,
              _justPunch:false, _justKick:false, _justSpecial:false, _justUp:false };

    const moveDir = opp.x > ai.x ? 'right' : 'left';

    if (ai.sp >= ai.maxSp && dist < 80 && Math.random() < 0.8) {
      d._justSpecial = true; d.special = true;
    } else if (dist < 55) {
      // Close: attack
      if (Math.random() < aggression * 0.7) {
        if (Math.random() < 0.55) d._justPunch = true;
        else d._justKick = true;
      } else if (myHP < 0.35 && Math.random() < 0.5) {
        d.block = true; // low HP → block more
      }
    } else if (dist < 130) {
      // Medium: approach or kick
      d[moveDir] = true;
      if (Math.random() < aggression * 0.4) d._justKick = true;
    } else {
      // Far: approach
      d[moveDir] = true;
      if (Math.random() < 0.04) { d._justUp = true; d.up = true; }
    }

    // Occasional jump over far distance
    if (dist > 200 && Math.random() < 0.03) { d._justUp = true; d.up = true; }

    // Block opponent attacks
    if (opp.state === STATES.PUNCH_L || opp.state === STATES.PUNCH_H || opp.state === STATES.KICK) {
      if (dist < 80 && Math.random() < 0.45) {
        d = { ...d, left:false, right:false, block:true,
              _justPunch:false, _justKick:false, _justSpecial:false };
      }
    }

    this._decision = d;
  }

  _applyDecision() {
    if (!this._decision) {
      return { left:false, right:false, up:false, down:false,
               punch:false, kick:false, special:false, block:false,
               _justPunch:false, _justKick:false, _justSpecial:false, _justUp:false };
    }
    return { ...this._decision };
  }
}
