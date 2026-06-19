class PhotoAnalyzer {
  // Analyze the original (non-pixelated) face canvas
  // Sample colors from different regions
  static analyze(originalCanvas) {
    const SIZE = 40;
    const tmp = document.createElement('canvas');
    tmp.width = SIZE; tmp.height = SIZE;
    const ctx = tmp.getContext('2d');
    ctx.drawImage(originalCanvas, 0, 0, SIZE, SIZE);
    const d = ctx.getImageData(0, 0, SIZE, SIZE).data;

    const hair  = this._region(d, SIZE, 0,  0,  SIZE, 10); // top 25%
    const skin  = this._region(d, SIZE, 12, 5,  16,  14); // center face area
    const shirt = this._region(d, SIZE, 5,  22, 30,  14); // lower-mid (shirt area in portrait)
    const pants = this._region(d, SIZE, 5,  34, 30,  6);  // bottom

    return {
      hair:  this._hex(hair),
      skin:  this._hex(skin),
      shirt: this._hex(shirt),
      pants: this._hex(pants),
    };
  }

  static _region(data, imgW, x, y, w, h) {
    let r=0,g=0,b=0,n=0;
    for (let py=y; py<y+h; py++) {
      for (let px=x; px<x+w; px++) {
        const i=(py*imgW+px)*4;
        r+=data[i]; g+=data[i+1]; b+=data[i+2]; n++;
      }
    }
    return n ? [r/n|0, g/n|0, b/n|0] : [128,128,128];
  }

  static _hex([r,g,b]) {
    return '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
  }

  // Parse text description for appearance traits
  static parseDescription(text) {
    if (!text) return {};
    const t = text.toLowerCase();
    const traits = {};

    // Shirt color keywords
    const colors = {
      'красн|red':     '#CC2200', 'синий|blue':    '#0044CC',
      'зелён|green':   '#006622', 'чёрн|black':    '#111111',
      'бел|white':     '#EEEEEE', 'жёлт|yellow':   '#BBAA00',
      'фиолет|purple': '#660099', 'оранж|orange':  '#CC5500',
      'розов|pink':    '#CC2266', 'серый|grey|gray': '#666666',
    };
    for (const [keys, hex] of Object.entries(colors)) {
      if (keys.split('|').some(k => t.includes(k))) { traits.shirtColor = hex; break; }
    }

    // Build / size
    if (/больш|огромн|толст|жирн|fat|big|huge/.test(t)) traits.scaleX = 1.22;
    if (/худ|тонк|slim|thin/.test(t))  traits.scaleX = 0.80;
    if (/высок|tall/.test(t))  traits.scaleY = 1.15;
    if (/низк|short|маленьк/.test(t)) traits.scaleY = 0.88;

    // Accessories
    if (/очки|glasses|specs/.test(t)) traits.glasses = true;
    if (/борода|beard/.test(t)) traits.beard = true;
    if (/лысый|bald/.test(t)) traits.bald = true;
    if (/шляп|hat/.test(t)) traits.hat = true;
    if (/усы|mustache|moustache/.test(t)) traits.mustache = true;

    return traits;
  }
}
