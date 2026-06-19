const ARENAS = ['street', 'castle', 'temple', 'rooftop'];

class UI {
  constructor(ctx) {
    this.ctx = ctx;
    this.arena = 'street';
  }

  drawArena(ctx, frame) {
    switch (this.arena) {
      case 'castle':  this._drawCastle(ctx, frame);  break;
      case 'temple':  this._drawTemple(ctx, frame);  break;
      case 'rooftop': this._drawRooftop(ctx, frame); break;
      default:        this._drawStreet(ctx, frame);  break;
    }
  }

  // ============ STREET ============
  _drawStreet(ctx, frame) {
    const W = CONFIG.CANVAS_WIDTH, H = CONFIG.CANVAS_HEIGHT, G = CONFIG.GROUND_Y;

    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, G);
    sky.addColorStop(0, '#0a0210');
    sky.addColorStop(1, '#1a0535');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, G);

    // Buildings background
    const blds = [[0,180,120,190],[130,160,90,210],[230,140,70,230],[310,170,100,200],
                  [420,150,80,220],[510,165,110,205],[630,145,90,225],[730,175,100,195]];
    blds.forEach(([x,y,w,h]) => {
      ctx.fillStyle = '#0d0420';
      ctx.fillRect(x, y, w, h);
      // Windows
      ctx.fillStyle = 'rgba(255,220,50,0.6)';
      for (let wx = x+8; wx < x+w-10; wx+=18) {
        for (let wy = y+10; wy < y+h-10; wy+=22) {
          if (Math.sin(wx*0.3+wy*0.5) > -0.2)
            ctx.fillRect(wx, wy, 10, 14);
        }
      }
    });

    // Neon signs
    this._neon(ctx, 80, 185, 'DOJO', '#FF0066', frame);
    this._neon(ctx, 320, 175, 'FIGHT', '#00FFCC', frame);
    this._neon(ctx, 580, 168, 'BAR', '#FF8800', frame);

    // Street lamp left
    ctx.strokeStyle='#555'; ctx.lineWidth=4;
    ctx.beginPath(); ctx.moveTo(60,G); ctx.lineTo(60,G-140); ctx.lineTo(90,G-140); ctx.stroke();
    ctx.fillStyle='rgba(255,240,150,0.8)';
    ctx.beginPath(); ctx.arc(90,G-140,12,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,240,150,0.15)';
    ctx.beginPath(); ctx.arc(90,G-140,40,0,Math.PI*2); ctx.fill();

    // Street lamp right
    ctx.strokeStyle='#555'; ctx.lineWidth=4;
    ctx.beginPath(); ctx.moveTo(W-60,G); ctx.lineTo(W-60,G-140); ctx.lineTo(W-90,G-140); ctx.stroke();
    ctx.fillStyle='rgba(255,240,150,0.8)';
    ctx.beginPath(); ctx.arc(W-90,G-140,12,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,240,150,0.15)';
    ctx.beginPath(); ctx.arc(W-90,G-140,40,0,Math.PI*2); ctx.fill();

    // Floor
    const floor = ctx.createLinearGradient(0,G,0,H);
    floor.addColorStop(0,'#1a0835'); floor.addColorStop(1,'#0a0420');
    ctx.fillStyle=floor; ctx.fillRect(0,G,W,H-G);

    // Floor tiles
    ctx.strokeStyle='rgba(100,50,180,0.25)'; ctx.lineWidth=1;
    for (let x=0;x<W;x+=60) { ctx.beginPath(); ctx.moveTo(x,G); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y=G;y<H;y+=30) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    // Glow floor line
    ctx.shadowColor='#AA44FF'; ctx.shadowBlur=20;
    ctx.strokeStyle='#9933EE'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(0,G); ctx.lineTo(W,G); ctx.stroke();
    ctx.shadowBlur=0;

    this._drawCrowd(ctx, frame);
  }

  _neon(ctx, x, y, text, color, frame) {
    const flicker = Math.sin(frame*0.07+x) > -0.85;
    if (!flicker) return;
    ctx.save();
    ctx.shadowColor=color; ctx.shadowBlur=14;
    ctx.strokeStyle=color; ctx.lineWidth=2;
    ctx.font='bold 14px Arial'; ctx.textAlign='left'; ctx.textBaseline='top';
    ctx.strokeText(text,x,y);
    ctx.fillStyle=color+'CC'; ctx.fillText(text,x,y);
    ctx.restore();
  }

  // ============ CASTLE ============
  _drawCastle(ctx, frame) {
    const W = CONFIG.CANVAS_WIDTH, H = CONFIG.CANVAS_HEIGHT, G = CONFIG.GROUND_Y;

    // Sky - night
    const sky = ctx.createLinearGradient(0,0,0,G);
    sky.addColorStop(0,'#05080F'); sky.addColorStop(1,'#0A1525');
    ctx.fillStyle=sky; ctx.fillRect(0,0,W,G);

    // Moon
    ctx.fillStyle='rgba(255,250,230,0.9)';
    ctx.beginPath(); ctx.arc(680,60,35,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,250,230,0.12)';
    ctx.beginPath(); ctx.arc(680,60,55,0,Math.PI*2); ctx.fill();

    // Stars
    ctx.fillStyle='rgba(255,255,255,0.8)';
    const stars=[[50,40],[120,25],[200,55],[280,30],[380,45],[450,20],[520,60],
                 [580,35],[650,50],[720,25],[760,45],[100,80],[340,70],[500,85]];
    stars.forEach(([sx,sy]) => {
      const twinkle = Math.sin(frame*0.04+sx)*0.5+0.5;
      ctx.globalAlpha=0.4+twinkle*0.6;
      ctx.beginPath(); ctx.arc(sx,sy,1.5,0,Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha=1;

    // Castle wall background
    ctx.fillStyle='#1a1f2a';
    ctx.fillRect(0, 80, W, G-80);

    // Battlements
    ctx.fillStyle='#232a38';
    for (let x=0;x<W;x+=50) {
      ctx.fillRect(x, 80, 30, 35);
    }

    // Castle towers
    this._castleTower(ctx, -20, 60, 80, G-60);
    this._castleTower(ctx, W-60, 60, 80, G-60);
    this._castleTower(ctx, 180, 90, 60, G-90);
    this._castleTower(ctx, W-240, 90, 60, G-90);

    // Torches (animated)
    this._torch(ctx, 140, G-80, frame);
    this._torch(ctx, W-140, G-80, frame);
    this._torch(ctx, 300, G-80, frame);
    this._torch(ctx, W-300, G-80, frame);

    // Stone floor
    const floor = ctx.createLinearGradient(0,G,0,H);
    floor.addColorStop(0,'#2a2f3a'); floor.addColorStop(1,'#1a1f28');
    ctx.fillStyle=floor; ctx.fillRect(0,G,W,H-G);

    // Stone tiles
    ctx.strokeStyle='rgba(80,90,110,0.4)'; ctx.lineWidth=2;
    for (let x=0;x<W;x+=70) { ctx.beginPath(); ctx.moveTo(x,G); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y=G;y<H;y+=35) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    // Floor glow
    ctx.shadowColor='#FF8800'; ctx.shadowBlur=15;
    ctx.strokeStyle='#CC6600'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(0,G); ctx.lineTo(W,G); ctx.stroke();
    ctx.shadowBlur=0;
  }

  _castleTower(ctx, x, y, w, h) {
    ctx.fillStyle='#1e2430';
    ctx.fillRect(x, y, w, h);
    // Battlements on tower
    for (let bx=x;bx<x+w;bx+=16) {
      ctx.fillStyle='#252d3e';
      ctx.fillRect(bx, y, 10, 20);
    }
    // Arrow slits
    ctx.fillStyle='rgba(0,0,0,0.6)';
    ctx.fillRect(x+w/2-4, y+30, 8, 20);
    ctx.fillRect(x+w/2-4, y+60, 8, 20);
  }

  _torch(ctx, x, y, frame) {
    // Handle
    ctx.fillStyle='#553311';
    ctx.fillRect(x-3, y, 6, 20);
    // Fire
    const flicker = Math.sin(frame*0.2+x)*3;
    const grad = ctx.createRadialGradient(x,y-5+flicker,0,x,y,18);
    grad.addColorStop(0,'rgba(255,240,100,0.9)');
    grad.addColorStop(0.4,'rgba(255,140,0,0.7)');
    grad.addColorStop(1,'rgba(255,60,0,0)');
    ctx.fillStyle=grad;
    ctx.beginPath(); ctx.ellipse(x,y-8+flicker,8,14,0,0,Math.PI*2); ctx.fill();
    // Light glow
    const glow = ctx.createRadialGradient(x,y,0,x,y,50);
    glow.addColorStop(0,'rgba(255,140,0,0.15)');
    glow.addColorStop(1,'rgba(255,140,0,0)');
    ctx.fillStyle=glow;
    ctx.beginPath(); ctx.arc(x,y,50,0,Math.PI*2); ctx.fill();
  }

  // ============ TEMPLE ============
  _drawTemple(ctx, frame) {
    const W = CONFIG.CANVAS_WIDTH, H = CONFIG.CANVAS_HEIGHT, G = CONFIG.GROUND_Y;

    // Dawn sky
    const sky = ctx.createLinearGradient(0,0,0,G);
    sky.addColorStop(0,'#1a0a2e'); sky.addColorStop(0.4,'#5c1a4a');
    sky.addColorStop(0.7,'#c44b2b'); sky.addColorStop(1,'#f4882a');
    ctx.fillStyle=sky; ctx.fillRect(0,0,W,G);

    // Sun
    const sunGrad = ctx.createRadialGradient(W/2,G+20,0,W/2,G+20,80);
    sunGrad.addColorStop(0,'rgba(255,240,100,0.9)');
    sunGrad.addColorStop(0.5,'rgba(255,160,20,0.4)');
    sunGrad.addColorStop(1,'rgba(255,100,0,0)');
    ctx.fillStyle=sunGrad;
    ctx.beginPath(); ctx.arc(W/2,G+20,80,0,Math.PI*2); ctx.fill();

    // Mountains
    ctx.fillStyle='rgba(80,30,60,0.7)';
    this._mountain(ctx, 0, G, 200, 160);
    this._mountain(ctx, 150, G, 180, 130);
    this._mountain(ctx, 400, G, 220, 150);
    this._mountain(ctx, 580, G, 200, 170);
    this._mountain(ctx, 700, G, 160, 140);
    ctx.fillStyle='rgba(60,20,45,0.5)';
    this._mountain(ctx, 250, G, 160, 110);
    this._mountain(ctx, 500, G, 150, 120);

    // Pagoda
    this._pagoda(ctx, W/2-40, G-120, 80);

    // Cherry blossom trees
    this._sakuraTree(ctx, 100, G, frame);
    this._sakuraTree(ctx, W-130, G, frame);

    // Petals
    for (let i=0;i<8;i++) {
      const px = (frame*0.8 + i*95) % W;
      const py = G - 60 - Math.sin(frame*0.03+i)*40 + i*8;
      if (py < G) {
        ctx.fillStyle='rgba(255,180,200,0.7)';
        ctx.beginPath(); ctx.ellipse(px,py,4,2,frame*0.05+i,0,Math.PI*2); ctx.fill();
      }
    }

    // Floor
    const floor = ctx.createLinearGradient(0,G,0,H);
    floor.addColorStop(0,'#5a3020'); floor.addColorStop(1,'#3a1c10');
    ctx.fillStyle=floor; ctx.fillRect(0,G,W,H-G);

    // Wooden planks
    ctx.strokeStyle='rgba(100,60,30,0.5)'; ctx.lineWidth=2;
    for (let x=0;x<W;x+=50) { ctx.beginPath(); ctx.moveTo(x,G); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y=G;y<H;y+=25) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    ctx.shadowColor='#FF6622'; ctx.shadowBlur=18;
    ctx.strokeStyle='#FF5511'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(0,G); ctx.lineTo(W,G); ctx.stroke();
    ctx.shadowBlur=0;
  }

  _mountain(ctx, x, baseY, w, h) {
    ctx.beginPath(); ctx.moveTo(x,baseY); ctx.lineTo(x+w/2,baseY-h); ctx.lineTo(x+w,baseY); ctx.closePath(); ctx.fill();
  }

  _pagoda(ctx, x, y, w) {
    ctx.fillStyle='rgba(80,20,10,0.85)';
    // 3 tiers
    for (let i=0;i<3;i++) {
      const tw=w*(1-i*0.22), th=20, ty=y+i*22;
      ctx.fillRect(x+(w-tw)/2, ty, tw, th);
      // Roof curve
      ctx.fillStyle='rgba(120,30,10,0.9)';
      ctx.beginPath(); ctx.moveTo(x+(w-tw)/2-8,ty); ctx.lineTo(x+w/2,ty-14); ctx.lineTo(x+(w+tw)/2+8,ty); ctx.fill();
      ctx.fillStyle='rgba(80,20,10,0.85)';
    }
    // Spire
    ctx.fillStyle='rgba(180,120,20,0.9)';
    ctx.fillRect(x+w/2-2, y-20, 4, 22);
  }

  _sakuraTree(ctx, x, baseY, frame) {
    ctx.fillStyle='#5a3020';
    ctx.fillRect(x-5, baseY-80, 10, 80);
    // Branches
    ctx.strokeStyle='#5a3020'; ctx.lineWidth=5; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(x,baseY-70); ctx.lineTo(x-25,baseY-100); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x,baseY-60); ctx.lineTo(x+20,baseY-90); ctx.stroke();
    // Blossoms
    const bpink = 'rgba(255,160,190,0.7)';
    ctx.fillStyle=bpink;
    [[0,-90,30],[-25,-105,22],[20,-95,20],[-10,-115,18],[10,-80,15]].forEach(([bx,by,r]) => {
      ctx.beginPath(); ctx.arc(x+bx,baseY+by+Math.sin(frame*0.02)*2,r,0,Math.PI*2); ctx.fill();
    });
  }

  // ============ ROOFTOP ============
  _drawRooftop(ctx, frame) {
    const W = CONFIG.CANVAS_WIDTH, H = CONFIG.CANVAS_HEIGHT, G = CONFIG.GROUND_Y;

    // Sunset sky
    const sky = ctx.createLinearGradient(0,0,0,G);
    sky.addColorStop(0,'#0a0520'); sky.addColorStop(0.3,'#2a0a40');
    sky.addColorStop(0.6,'#8a2020'); sky.addColorStop(1,'#d44010');
    ctx.fillStyle=sky; ctx.fillRect(0,0,W,G);

    // Sun
    ctx.fillStyle='rgba(255,180,30,0.6)';
    ctx.beginPath(); ctx.arc(W*0.7, G-20, 55, Math.PI, 0); ctx.fill();
    const sunGlow = ctx.createRadialGradient(W*0.7,G-20,0,W*0.7,G-20,120);
    sunGlow.addColorStop(0,'rgba(255,180,30,0.3)');
    sunGlow.addColorStop(1,'rgba(255,100,0,0)');
    ctx.fillStyle=sunGlow; ctx.beginPath(); ctx.arc(W*0.7,G-20,120,0,Math.PI*2); ctx.fill();

    // City skyline silhouettes
    ctx.fillStyle='rgba(15,8,25,0.95)';
    const skyline = [
      [0,G-80,60,80],[70,G-120,50,120],[130,G-90,45,90],[185,G-150,55,150],
      [250,G-100,40,100],[300,G-130,65,130],[375,G-80,50,80],[435,G-160,45,160],
      [490,G-110,60,110],[560,G-140,50,140],[620,G-90,55,90],[685,G-120,60,120],
      [755,G-100,55,100]
    ];
    skyline.forEach(([x,y,w,h]) => {
      ctx.fillRect(x,y,w,h);
      // Windows
      ctx.fillStyle='rgba(255,220,100,0.5)';
      for (let wx=x+6;wx<x+w-8;wx+=12) {
        for (let wy=y+8;wy<y+h-6;wy+=16) {
          if (Math.random()>0.35)
            ctx.fillRect(wx,wy,7,10);
        }
      }
      ctx.fillStyle='rgba(15,8,25,0.95)';
    });

    // Rooftop surface
    const roof = ctx.createLinearGradient(0,G,0,H);
    roof.addColorStop(0,'#2a2535'); roof.addColorStop(1,'#151220');
    ctx.fillStyle=roof; ctx.fillRect(0,G,W,H-G);

    // Roof details: AC units
    ctx.fillStyle='#3a3545';
    [[80,G-18,40,18],[160,G-14,30,14],[600,G-18,40,18],[680,G-14,30,14]].forEach(([x,y,w,h]) => {
      ctx.fillRect(x,y,w,h);
      ctx.strokeStyle='#4a4555'; ctx.lineWidth=1;
      ctx.strokeRect(x,y,w,h);
    });

    // Water tower
    ctx.fillStyle='#5a4020';
    ctx.fillRect(700,G-70,40,15);
    ctx.beginPath(); ctx.ellipse(720,G-70,22,6,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#7a5828';
    ctx.beginPath(); ctx.arc(720,G-80,18,Math.PI,0); ctx.fill();
    ctx.fillRect(702,G-80,36,12);

    // Ventilation pipe
    ctx.fillStyle='#333';
    ctx.fillRect(130,G-25,20,25); ctx.fillRect(120,G-28,40,6);

    // Roof glow (edge lighting)
    ctx.shadowColor='#FF5522'; ctx.shadowBlur=20;
    ctx.strokeStyle='#EE4411'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(0,G); ctx.lineTo(W,G); ctx.stroke();
    ctx.shadowBlur=0;

    // Roof tiles
    ctx.strokeStyle='rgba(80,70,100,0.3)'; ctx.lineWidth=1;
    for (let x=0;x<W;x+=55) { ctx.beginPath(); ctx.moveTo(x,G); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y=G;y<H;y+=28) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    // Distant city lights glow at horizon
    for (let i=0;i<12;i++) {
      const lx = i*(W/11);
      const lc = ['#FF4400','#FF8800','#FFFF00','#00FFFF','#FF00FF'][i%5];
      ctx.fillStyle=lc+'40';
      ctx.beginPath(); ctx.ellipse(lx,G-5,20,8,0,0,Math.PI*2); ctx.fill();
    }
  }

  // ============ HUD ============
  drawHUD(p1, p2, round, wins, timer, maxRounds) {
    const ctx = this.ctx;
    const W = CONFIG.CANVAS_WIDTH;

    const bg = ctx.createLinearGradient(0,0,0,72);
    bg.addColorStop(0,'rgba(0,0,0,0.88)');
    bg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,72);

    this._drawHPBar(ctx,14,14,270,22,p1.hp/p1.maxHp,p1.cfg.accentColor,p1.name,p1.face,true);
    this._drawHPBar(ctx,W-284,14,270,22,p2.hp/p2.maxHp,p2.cfg.accentColor,p2.name,p2.face,false);

    this._drawSPBar(ctx,14,40,180,p1.sp/p1.maxSp,'#0088FF',p1.sp>=p1.maxSp);
    this._drawSPBar(ctx,W-194,40,180,p2.sp/p2.maxSp,'#0088FF',p2.sp>=p2.maxSp);

    this._drawTimer(ctx,timer,W);
    this._drawWinDots(ctx,wins,round,maxRounds,W);
  }

  _drawHPBar(ctx,x,y,w,h,fill,color,name,face,leftAlign) {
    const barX = leftAlign ? x+36 : x;
    const barW = w-36;
    ctx.fillStyle='rgba(255,255,255,0.08)';
    ctx.beginPath(); ctx.roundRect(barX,y,barW,h,4); ctx.fill();
    if (fill>0) {
      const grad = ctx.createLinearGradient(barX,y,barX+barW*fill,y+h);
      const c = fill<0.25 ? '#FF2200' : color;
      grad.addColorStop(0,c); grad.addColorStop(1,this._lighten(c,40));
      ctx.fillStyle=grad;
      ctx.beginPath();
      leftAlign
        ? ctx.roundRect(barX,y,barW*fill,h,4)
        : ctx.roundRect(barX+barW*(1-fill),y,barW*fill,h,4);
      ctx.fill();
    }
    ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.roundRect(barX,y,barW,h,4); ctx.stroke();
    const faceSize=32, fx=leftAlign?x:x+w-faceSize, fy=y-4;
    if (face) {
      ctx.save(); ctx.beginPath(); ctx.arc(fx+faceSize/2,fy+faceSize/2,faceSize/2,0,Math.PI*2);
      ctx.clip(); ctx.drawImage(face,fx,fy,faceSize,faceSize); ctx.restore();
    }
    ctx.strokeStyle=color; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(fx+faceSize/2,fy+faceSize/2,faceSize/2,0,Math.PI*2); ctx.stroke();
    ctx.fillStyle='#EEE'; ctx.font='bold 11px Arial';
    ctx.textAlign=leftAlign?'left':'right'; ctx.textBaseline='top';
    ctx.fillText(name,leftAlign?barX+4:barX+barW-4,y-13);
  }

  _drawSPBar(ctx,x,y,w,fill,color,full) {
    ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(x,y,w,7);
    if (fill>0) {
      ctx.fillStyle=full?'#FFD700':color;
      if (full) { ctx.shadowColor='#FFD700'; ctx.shadowBlur=8; }
      ctx.fillRect(x,y,w*fill,7);
      ctx.shadowBlur=0;
    }
    ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.lineWidth=1; ctx.strokeRect(x,y,w,7);
    if (full) {
      ctx.fillStyle='#FFD700'; ctx.font='bold 7px Arial';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('SP READY',x+w/2,y+3.5);
    }
  }

  _drawTimer(ctx,timer,W) {
    const urgent=timer<=10;
    ctx.fillStyle='rgba(0,0,0,0.65)';
    ctx.beginPath(); ctx.roundRect(W/2-28,6,56,36,6); ctx.fill();
    if (urgent) { ctx.shadowColor='#FF0000'; ctx.shadowBlur=15; }
    ctx.fillStyle=urgent?'#FF4444':'#FFFFFF';
    ctx.font=`bold ${urgent?32:26}px 'Arial Black',Arial`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(String(timer).padStart(2,'0'),W/2,26);
    ctx.shadowBlur=0;
  }

  _drawWinDots(ctx,wins,round,maxRounds,W) {
    const dotR=7, need=Math.ceil(maxRounds/2);
    for (let i=0;i<need;i++) {
      const p1x=14+70+i*20;
      ctx.fillStyle=i<wins[0]?'#FFD700':'rgba(255,255,255,0.15)';
      ctx.beginPath(); ctx.arc(p1x,56,dotR,0,Math.PI*2); ctx.fill();
      if (i<wins[0]) { ctx.strokeStyle='#FFA500'; ctx.lineWidth=1.5; ctx.stroke(); }
      const p2x=W-14-70-i*20;
      ctx.fillStyle=i<wins[1]?'#FFD700':'rgba(255,255,255,0.15)';
      ctx.beginPath(); ctx.arc(p2x,56,dotR,0,Math.PI*2); ctx.fill();
      if (i<wins[1]) { ctx.strokeStyle='#FFA500'; ctx.lineWidth=1.5; ctx.stroke(); }
    }
    ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.font='10px Arial';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(`ROUND ${round}`,W/2,56);
  }

  drawAnnouncement(ctx,text,alpha) {
    const W=CONFIG.CANVAS_WIDTH, H=CONFIG.CANVAS_HEIGHT;
    ctx.save(); ctx.globalAlpha=alpha;
    ctx.fillStyle='rgba(0,0,0,0.45)'; ctx.fillRect(0,H/2-50,W,100);
    const size=text.length<=4?64:text.length<=8?48:36;
    ctx.font=`bold ${size}px 'Arial Black',Arial`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.strokeStyle='#000'; ctx.lineWidth=6; ctx.strokeText(text,W/2,H/2);
    ctx.fillStyle='#FFFFFF'; ctx.fillText(text,W/2,H/2);
    ctx.restore();
  }

  _drawCrowd(ctx,frame) {
    const W=CONFIG.CANVAS_WIDTH, G=CONFIG.GROUND_Y;
    for (let i=0;i<22;i++) {
      const x=(i/22)*W+(i%2)*18;
      const h=28+(i*13%20);
      const bob=Math.sin(frame*0.04+i*0.8)*2;
      ctx.fillStyle=`rgba(${20+i%10},${8+i%5},${40+i%15},0.75)`;
      ctx.beginPath(); ctx.arc(x,G-58+bob,9,Math.PI,0);
      ctx.rect(x-9,G-58+bob,18,h); ctx.fill();
    }
  }

  _lighten(hex,amount) {
    const n=parseInt(hex.replace('#',''),16);
    const r=Math.min(255,(n>>16)+amount);
    const g=Math.min(255,((n>>8)&0xFF)+amount);
    const b=Math.min(255,(n&0xFF)+amount);
    return `rgb(${r},${g},${b})`;
  }
}
