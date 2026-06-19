class InputManager {
  constructor() {
    this._keys = {};
    this._prev = {};
    this._touch = {};  // touch virtual buttons state

    this.p1 = this._blank();
    this.p2 = this._blank();

    this._onDown = (e) => {
      if (!this._keys[e.code]) { this._keys[e.code] = true; this._update(); }
      const block = ['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
      if (block.includes(e.code)) e.preventDefault();
    };
    this._onUp = (e) => { this._keys[e.code] = false; this._update(); };

    window.addEventListener('keydown', this._onDown);
    window.addEventListener('keyup',   this._onUp);

    this._setupTouch();
  }

  _blank() {
    return { left:false, right:false, up:false, down:false,
             punch:false, kick:false, special:false, block:false };
  }

  _update() {
    const k = this._keys;
    const t = this._touch;

    this.p1.left    = !!k['KeyA']  || !!t['left'];
    this.p1.right   = !!k['KeyD']  || !!t['right'];
    this.p1.up      = !!k['KeyW']  || !!t['up'];
    this.p1.down    = !!k['KeyS']  || !!t['down'];
    this.p1.punch   = !!k['KeyJ']  || !!t['punch'];
    this.p1.kick    = !!k['KeyK']  || !!t['kick'];
    this.p1.special = !!k['KeyL']  || !!t['special'];
    this.p1.block   = !!k['KeyX']  || !!t['block'];

    this.p2.left    = !!k['ArrowLeft'];
    this.p2.right   = !!k['ArrowRight'];
    this.p2.up      = !!k['ArrowUp'];
    this.p2.down    = !!k['ArrowDown'];
    this.p2.punch   = !!k['Numpad1'] || !!k['Digit1'];
    this.p2.kick    = !!k['Numpad2'] || !!k['Digit2'];
    this.p2.special = !!k['Numpad3'] || !!k['Digit3'];
    this.p2.block   = !!k['Numpad0'] || !!k['Digit0'];
  }

  _setupTouch() {
    // Virtual buttons send events via setTouchAction()
    // Called from HTML touch buttons
  }

  setTouchAction(action, active) {
    this._touch[action] = active;
    this._update();
  }

  justPressed(player, action) {
    return this[player][action] && !this._prev[player + '_' + action];
  }

  endFrame() {
    for (const p of ['p1', 'p2']) {
      for (const a of Object.keys(this[p])) {
        this._prev[p + '_' + a] = this[p][a];
      }
    }
  }

  destroy() {
    window.removeEventListener('keydown', this._onDown);
    window.removeEventListener('keyup',   this._onUp);
  }
}
