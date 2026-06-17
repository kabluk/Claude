const CONFIG = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 450,
  GROUND_Y: 375,
  GRAVITY: 0.55,
  JUMP_FORCE: -13,
  WALK_SPEED: 3.2,
  P1_START_X: 210,
  P2_START_X: 590,
  ROUND_TIME: 99,
  MAX_ROUNDS: 3,

  STYLES: {
    boxer: {
      name: 'Боксёр', emoji: '🥊',
      hpMult: 1.1, powerMult: 1.3, speedMult: 0.82,
      torsoColor: '#CC2200', armsColor: '#AA1100', legsColor: '#1a1a1a',
      accentColor: '#FF4422',
      desc: 'Мощные удары, крепкая защита'
    },
    ninja: {
      name: 'Ниндзя', emoji: '🥷',
      hpMult: 0.85, powerMult: 0.82, speedMult: 1.6,
      torsoColor: '#1a1a2e', armsColor: '#16213e', legsColor: '#0f0f1a',
      accentColor: '#FF0044',
      desc: 'Максимальная скорость, комбо-удары'
    },
    karate: {
      name: 'Каратист', emoji: '🦵',
      hpMult: 1.0, powerMult: 1.05, speedMult: 1.1,
      torsoColor: '#E8E8E8', armsColor: '#D0D0D0', legsColor: '#FFFFFF',
      accentColor: '#CC0000',
      desc: 'Баланс силы и скорости'
    },
    wrestler: {
      name: 'Борец', emoji: '🤼',
      hpMult: 1.3, powerMult: 1.5, speedMult: 0.65,
      torsoColor: '#006622', armsColor: '#005518', legsColor: '#003311',
      accentColor: '#FFD700',
      desc: 'Огромный HP, захваты и броски'
    },
    street: {
      name: 'Уличный', emoji: '😤',
      hpMult: 0.95, powerMult: 1.1, speedMult: 1.12,
      torsoColor: '#7A3B00', armsColor: '#5C2C00', legsColor: '#333333',
      accentColor: '#FF8800',
      desc: 'Грязные приёмы, непредсказуем'
    }
  },

  ATTACKS: {
    punch_light:  { startup: 4,  active: 4, recovery: 6,  damage: 8,  knockback: 2.5, spGain: 8  },
    punch_heavy:  { startup: 9,  active: 5, recovery: 13, damage: 18, knockback: 6,   spGain: 15 },
    kick:         { startup: 7,  active: 6, recovery: 10, damage: 13, knockback: 4,   spGain: 12 },
    special:      { startup: 10, active: 8, recovery: 22, damage: 26, knockback: 8,   spGain: 0  }
  }
};

const STATES = {
  IDLE:       'idle',
  WALK:       'walk',
  JUMP:       'jump',
  CROUCH:     'crouch',
  PUNCH_L:    'punch_light',
  PUNCH_H:    'punch_heavy',
  KICK:       'kick',
  SPECIAL:    'special',
  BLOCK:      'block',
  HURT:       'hurt',
  KNOCKDOWN:  'knockdown',
  GETUP:      'getup',
  VICTORY:    'victory',
  DEFEAT:     'defeat'
};
