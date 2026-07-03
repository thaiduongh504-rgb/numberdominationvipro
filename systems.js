/* systems.js — Progression, XP, Ranks, Achievements, Upgrades, Powerups */
'use strict';

// ── RANK DEFINITIONS ──────────────────────────────────────────
const RANKS = [
  { id: 'recruit',    name: 'RECRUIT',    minXP: 0,     color: '#4a7a9b', icon: '◦' },
  { id: 'initiate',  name: 'INITIATE',   minXP: 200,   color: '#39ff14', icon: '▹' },
  { id: 'hacker',    name: 'HACKER',     minXP: 600,   color: '#00d4ff', icon: '◈' },
  { id: 'ghost',     name: 'GHOST',      minXP: 1400,  color: '#bf5fff', icon: '◑' },
  { id: 'cipher',    name: 'CIPHER',     minXP: 2800,  color: '#ff9500', icon: '◎' },
  { id: 'oracle',    name: 'ORACLE',     minXP: 5000,  color: '#ffd700', icon: '⬡' },
  { id: 'phantom',   name: 'PHANTOM',    minXP: 8500,  color: '#ff4d6d', icon: '◈' },
  { id: 'spectre',   name: 'SPECTRE',    minXP: 14000, color: '#00ffff', icon: '◉' },
  { id: 'sovereign', name: 'SOVEREIGN',  minXP: 22000, color: '#ff2244', icon: '⬟' },
  { id: 'dominion',  name: 'DOMINION',   minXP: 35000, color: '#ffffff', icon: '★' }
];

// ── RANKED TIERS ──────────────────────────────────────────────
const RANKED_TIERS = [
  { name: 'BRONZE',   minPoints: 0,    color: '#cd7f32' },
  { name: 'SILVER',   minPoints: 300,  color: '#c0c0c0' },
  { name: 'GOLD',     minPoints: 700,  color: '#ffd700' },
  { name: 'PLATINUM', minPoints: 1200, color: '#00d4ff' },
  { name: 'DIAMOND',  minPoints: 2000, color: '#bf5fff' },
  { name: 'MASTER',   minPoints: 3000, color: '#ff4d6d' },
  { name: 'GRANDMASTER', minPoints: 4500, color: '#ff2244' }
];

// ── UPGRADE DEFINITIONS ───────────────────────────────────────
const UPGRADES = [
  {
    id: 'extraGuesses',
    name: 'EXTENDED BUFFER',
    icon: '🎯',
    desc: '+2 max guesses per level',
    maxLevel: 5,
    costs: [50, 120, 250, 500, 1000],
    effect: lvl => `+${lvl * 2} guesses`
  },
  {
    id: 'hintQuality',
    name: 'DEEP SCAN',
    icon: '🔍',
    desc: 'Unlocks better hints',
    maxLevel: 4,
    costs: [80, 180, 350, 700],
    effect: lvl => `Tier ${lvl} hints`
  },
  {
    id: 'timerBonus',
    name: 'OVERCLOCK',
    icon: '⏱',
    desc: '+5 sec timer bonus per level',
    maxLevel: 5,
    costs: [60, 140, 280, 560, 900],
    effect: lvl => `+${lvl * 5}s timer`
  },
  {
    id: 'coinMultiplier',
    name: 'PROFIT ENGINE',
    icon: '⬡',
    desc: '+15% coin rewards per level',
    maxLevel: 5,
    costs: [100, 200, 400, 800, 1500],
    effect: lvl => `×${(1 + lvl * 0.15).toFixed(2)} coins`
  },
  {
    id: 'xpMultiplier',
    name: 'NEURAL BOOST',
    icon: '⚡',
    desc: '+10% XP per level',
    maxLevel: 5,
    costs: [90, 190, 380, 760, 1400],
    effect: lvl => `×${(1 + lvl * 0.1).toFixed(1)} XP`
  },
  {
    id: 'powerupSlots',
    name: 'UTILITY BELT',
    icon: '🔧',
    desc: '+1 powerup slot per level',
    maxLevel: 3,
    costs: [150, 300, 600],
    effect: lvl => `${3 + lvl} slots`
  },
  {
    id: 'startingHP',
    name: 'ARMOR PLATING',
    icon: '♥',
    desc: '+1 starting HP per level',
    maxLevel: 3,
    costs: [120, 260, 520],
    effect: lvl => `${3 + lvl} base HP`
  },
  {
    id: 'comboMaster',
    name: 'COMBO PROTOCOL',
    icon: '🔥',
    desc: 'Combo bonuses scale harder',
    maxLevel: 3,
    costs: [200, 450, 900],
    effect: lvl => `+${lvl * 20}% combo multiplier`
  }
];

// ── MODE UNLOCK REQUIREMENTS ──────────────────────────────────
const MODE_UNLOCK_REQS = {
  classic:    { always: true },
  survival:   { always: true },
  infinite:   { always: true },
  campaign:   { always: true },
  daily:      { always: true },
  ranked:     { always: true },
  hardcore:   { wins: 5 },
  nightmare:  { wins: 20 },
  reverse:    { rank: 2 },
  quantum:    { rank: 3 },
  chaos:      { wins: 15 },
  multi:      { rank: 2 },
  corrupted:  { rank: 4 },
  impossible: { rank: 6 },
  boss:       { rank: 3 }
};

// ── ACHIEVEMENT DEFINITIONS ───────────────────────────────────
const ACHIEVEMENTS = [
  // Beginner
  { id: 'first_win',     icon: '🏆', name: 'FIRST BLOOD',      desc: 'Win your first game',                         condition: s => s.totalWins >= 1 },
  { id: 'win10',         icon: '⭐', name: 'RISING STAR',       desc: 'Win 10 games',                                condition: s => s.totalWins >= 10 },
  { id: 'win50',         icon: '🌟', name: 'VETERAN',           desc: 'Win 50 games',                                condition: s => s.totalWins >= 50 },
  { id: 'win100',        icon: '💫', name: 'CENTURION',         desc: 'Win 100 games',                               condition: s => s.totalWins >= 100 },
  { id: 'win500',        icon: '👑', name: 'LEGEND',            desc: 'Win 500 games',                               condition: s => s.totalWins >= 500 },
  // Accuracy
  { id: 'perfect3',      icon: '🎯', name: 'MARKSMAN',          desc: 'Win in 3 guesses',                            condition: s => s.bestGuessCount <= 3 && s.totalWins >= 1 },
  { id: 'perfect1',      icon: '💥', name: 'GODLIKE',           desc: 'Win in 1 guess',                              condition: s => s.bestGuessCount === 1 },
  { id: 'accuracy90',    icon: '📡', name: 'PRECISION MATRIX',  desc: 'Reach 90% accuracy over 20+ games',          condition: s => s.accuracyDenominator >= 20 && (s.accuracyNumerator/s.accuracyDenominator) >= 0.9 },
  // Streaks
  { id: 'streak5',       icon: '🔥', name: 'ON FIRE',           desc: 'Win 5 games in a row',                        condition: s => s.bestStreak >= 5 },
  { id: 'streak15',      icon: '⚡', name: 'UNSTOPPABLE',        desc: 'Win 15 games in a row',                       condition: s => s.bestStreak >= 15 },
  { id: 'streak30',      icon: '☄️', name: 'DIVINE STREAK',      desc: 'Win 30 games in a row',                       condition: s => s.bestStreak >= 30 },
  // Mode specific
  { id: 'survival_10',   icon: '💀', name: 'SURVIVOR',          desc: 'Survive 10 rounds in Survival mode',         condition: s => (s.modeStats?.survival?.maxRound || 0) >= 10 },
  { id: 'survival_25',   icon: '🧟', name: 'UNDYING',           desc: 'Survive 25 rounds in Survival mode',         condition: s => (s.modeStats?.survival?.maxRound || 0) >= 25 },
  { id: 'hardcore_win',  icon: '⚔️', name: 'IRON WILL',          desc: 'Win a Hardcore game',                         condition: s => (s.modeStats?.hardcore?.wins || 0) >= 1 },
  { id: 'nightmare_win', icon: '😱', name: 'NIGHTMARE BREAKER',  desc: 'Win a Nightmare game',                        condition: s => (s.modeStats?.nightmare?.wins || 0) >= 1 },
  { id: 'impossible_win',icon: '🌀', name: 'THE IMPOSSIBLE',     desc: 'Win an Impossible mode game',                 condition: s => (s.modeStats?.impossible?.wins || 0) >= 1 },
  { id: 'boss_win',      icon: '🐉', name: 'BOSS SLAYER',        desc: 'Defeat a Boss',                               condition: s => (s.modeStats?.boss?.wins || 0) >= 1 },
  { id: 'daily_3',       icon: '📅', name: 'REGULAR',           desc: 'Complete 3 daily challenges',                condition: s => (s.modeStats?.daily?.wins || 0) >= 3 },
  { id: 'daily_30',      icon: '🗓', name: 'DEDICATED',          desc: 'Complete 30 daily challenges',               condition: s => (s.modeStats?.daily?.wins || 0) >= 30 },
  { id: 'ranked_gold',   icon: '🥇', name: 'GOLDEN RANKS',       desc: 'Reach Gold tier in Ranked',                  condition: (s,r) => (r?.ranked?.tier || 0) >= 3 },
  { id: 'ranked_master', icon: '💎', name: 'MASTER ANALYST',     desc: 'Reach Master tier in Ranked',                condition: (s,r) => (r?.ranked?.tier || 0) >= 5 },
  { id: 'quantum_win',   icon: '⚛️', name: 'QUANTUM OBSERVER',   desc: 'Win a Quantum mode game',                     condition: s => (s.modeStats?.quantum?.wins || 0) >= 1 },
  { id: 'chaos_win',     icon: '🌪️', name: 'CHAOS CONQUEROR',    desc: 'Win a Chaos mode game',                       condition: s => (s.modeStats?.chaos?.wins || 0) >= 1 },
  { id: 'multi_win',     icon: '🔢', name: 'MULTIPLEXER',        desc: 'Win a Multi Number game',                     condition: s => (s.modeStats?.multi?.wins || 0) >= 1 },
  // Powerups
  { id: 'use_powerup',   icon: '⚡', name: 'EQUIPPED',           desc: 'Use a powerup for the first time',            condition: s => (s.powerupsUsed || 0) >= 1 },
  { id: 'use_10_powerups',icon:'🔋', name: 'POWER USER',         desc: 'Use 10 powerups total',                       condition: s => (s.powerupsUsed || 0) >= 10 },
  // XP / Level
  { id: 'level10',       icon: '📊', name: 'EXPERIENCED',        desc: 'Reach player level 10',                       condition: (s,r) => (r?.level || 1) >= 10 },
  { id: 'level25',       icon: '📈', name: 'ELITE',              desc: 'Reach player level 25',                       condition: (s,r) => (r?.level || 1) >= 25 },
  { id: 'rank_oracle',   icon: '🔮', name: 'ORACLE ASCENSION',   desc: 'Reach Oracle rank',                           condition: (s,r) => (r?.rank || 0) >= 5 },
  { id: 'rank_dominion', icon: '🌐', name: 'DOMINION ACHIEVED',  desc: 'Reach the highest rank',                      condition: (s,r) => (r?.rank || 0) >= 9 },
  // Coins
  { id: 'coins1000',     icon: '💰', name: 'WEALTHY',            desc: 'Earn 1000 total coins',                       condition: s => (s.lifetimeCoins || 0) >= 1000 },
  { id: 'coins10000',    icon: '🏦', name: 'BILLIONAIRE',        desc: 'Earn 10000 total coins',                      condition: s => (s.lifetimeCoins || 0) >= 10000 },
  // Special
  { id: 'campaign_world1',icon:'🗺', name: 'EXPLORER',           desc: 'Complete World 1 of Campaign',               condition: (s,r) => (r?.campaign?.completedLevels?.['0-9'] || false) },
  { id: 'all_modes',     icon: '🌈', name: 'MODE MASTER',        desc: 'Win a game in 10 different modes',            condition: s => Object.keys(s.modeStats || {}).filter(m => (s.modeStats[m].wins || 0) > 0).length >= 10 }
];

// ── LEVEL CONFIGURATIONS (Campaign) ──────────────────────────
const CAMPAIGN_LEVELS = (() => {
  const worlds = [];

  // World 1 — Boot Sequence (levels 1-10)
  worlds.push({
    name: 'WORLD 1: BOOT SEQUENCE',
    levels: [
      { id: '0-0', name: 'INIT',       mode: 'classic',  config: { min:1,   max:10,  guesses:6,  hp:3, timer:0  }, type:'normal' },
      { id: '0-1', name: 'SCAN',       mode: 'classic',  config: { min:1,   max:20,  guesses:6,  hp:3, timer:0  }, type:'normal' },
      { id: '0-2', name: 'PROBE',      mode: 'classic',  config: { min:1,   max:50,  guesses:7,  hp:3, timer:0  }, type:'normal' },
      { id: '0-3', name: 'ANALYZE',    mode: 'classic',  config: { min:1,   max:100, guesses:7,  hp:3, timer:0  }, type:'normal' },
      { id: '0-4', name: 'COMPILE',    mode: 'survival', config: { min:1,   max:50,  guesses:5,  hp:3, timer:30 }, type:'normal' },
      { id: '0-5', name: 'EXECUTE',    mode: 'classic',  config: { min:0,   max:200, guesses:8,  hp:3, timer:0  }, type:'normal' },
      { id: '0-6', name: 'ENCRYPT',    mode: 'classic',  config: { min:-50, max:50,  guesses:8,  hp:3, timer:0  }, type:'challenge' },
      { id: '0-7', name: 'DECRYPT',    mode: 'reverse',  config: { min:1,   max:100, guesses:5,  hp:3, timer:0  }, type:'challenge' },
      { id: '0-8', name: 'FIREWALL',   mode: 'hardcore', config: { min:1,   max:100, guesses:5,  hp:1, timer:45 }, type:'challenge' },
      { id: '0-9', name: 'BOSS_VIRUS', mode: 'boss',     config: { min:1,   max:100, guesses:8,  hp:3, timer:60 }, type:'boss' }
    ]
  });

  // World 2 — Neural Net (levels 11-20)
  worlds.push({
    name: 'WORLD 2: NEURAL NET',
    levels: [
      { id: '1-0', name: 'SYNAPSE',    mode: 'classic',  config: { min:1,   max:500,  guesses:9,  hp:3, timer:0  }, type:'normal' },
      { id: '1-1', name: 'DENDRITE',   mode: 'survival', config: { min:1,   max:100,  guesses:5,  hp:3, timer:25 }, type:'normal' },
      { id: '1-2', name: 'AXON',       mode: 'classic',  config: { min:1,   max:1000, guesses:10, hp:3, timer:0  }, type:'normal' },
      { id: '1-3', name: 'CORTEX',     mode: 'quantum',  config: { min:1,   max:100,  guesses:7,  hp:3, timer:0  }, type:'challenge' },
      { id: '1-4', name: 'IMPULSE',    mode: 'survival', config: { min:1,   max:200,  guesses:5,  hp:2, timer:20 }, type:'normal' },
      { id: '1-5', name: 'SIGNAL',     mode: 'multi',    config: { min:1,   max:50,   guesses:8,  hp:3, timer:0, multiCount:2 }, type:'normal' },
      { id: '1-6', name: 'FEEDBACK',   mode: 'reverse',  config: { min:1,   max:200,  guesses:6,  hp:3, timer:0  }, type:'challenge' },
      { id: '1-7', name: 'OVERFLOW',   mode: 'chaos',    config: { min:1,   max:100,  guesses:7,  hp:3, timer:0  }, type:'challenge' },
      { id: '1-8', name: 'REROUTE',    mode: 'hardcore', config: { min:0,   max:500,  guesses:6,  hp:1, timer:40 }, type:'challenge' },
      { id: '1-9', name: 'BOSS_MIND',  mode: 'boss',     config: { min:1,   max:200,  guesses:10, hp:3, timer:90 }, type:'boss' }
    ]
  });

  // World 3 — Quantum Core (levels 21-30)
  worlds.push({
    name: 'WORLD 3: QUANTUM CORE',
    levels: [
      { id: '2-0', name: 'QUBIT',      mode: 'quantum',  config: { min:1,   max:100,  guesses:7,  hp:3, timer:0  }, type:'normal' },
      { id: '2-1', name: 'SUPERPOSE',  mode: 'classic',  config: { min:1,   max:2000, guesses:11, hp:3, timer:0  }, type:'normal' },
      { id: '2-2', name: 'ENTANGLE',   mode: 'multi',    config: { min:1,   max:100,  guesses:8,  hp:3, timer:0, multiCount:3 }, type:'normal' },
      { id: '2-3', name: 'COLLAPSE',   mode: 'chaos',    config: { min:1,   max:200,  guesses:7,  hp:2, timer:0  }, type:'challenge' },
      { id: '2-4', name: 'DECOHERE',   mode: 'nightmare',config: { min:1,   max:100,  guesses:5,  hp:2, timer:30 }, type:'challenge' },
      { id: '2-5', name: 'TUNNELING',  mode: 'corrupted',config: { min:1,   max:100,  guesses:7,  hp:3, timer:0  }, type:'challenge' },
      { id: '2-6', name: 'SPIN',       mode: 'infinite', config: { min:1,   max:100,  guesses:7,  hp:3, timer:0  }, type:'normal' },
      { id: '2-7', name: 'PHASE',      mode: 'reverse',  config: { min:1,   max:500,  guesses:7,  hp:3, timer:0  }, type:'challenge' },
      { id: '2-8', name: 'INTERFERENCE',mode:'hardcore', config: { min:1,   max:200,  guesses:5,  hp:1, timer:35 }, type:'challenge' },
      { id: '2-9', name: 'BOSS_QUANT', mode: 'boss',     config: { min:1,   max:500,  guesses:12, hp:3, timer:120}, type:'boss' }
    ]
  });

  // World 4 — Void Protocol (levels 31-40)
  worlds.push({
    name: 'WORLD 4: VOID PROTOCOL',
    levels: [
      { id: '3-0', name: 'NULL',       mode: 'corrupted',config: { min:1,   max:200,  guesses:7,  hp:3, timer:0  }, type:'normal' },
      { id: '3-1', name: 'VOID',       mode: 'nightmare',config: { min:1,   max:200,  guesses:6,  hp:2, timer:25 }, type:'normal' },
      { id: '3-2', name: 'ABYSS',      mode: 'multi',    config: { min:1,   max:100,  guesses:9,  hp:3, timer:0, multiCount:4 }, type:'challenge' },
      { id: '3-3', name: 'ENTROPY',    mode: 'chaos',    config: { min:1,   max:500,  guesses:8,  hp:2, timer:0  }, type:'challenge' },
      { id: '3-4', name: 'SINGULARITY',mode: 'impossible',config:{min:1,   max:100,  guesses:5,  hp:1, timer:0  }, type:'secret' },
      { id: '3-5', name: 'DARK SCAN',  mode: 'corrupted',config: { min:-100,max:100,  guesses:8,  hp:3, timer:0  }, type:'normal' },
      { id: '3-6', name: 'FRACTURE',   mode: 'hardcore', config: { min:1,   max:1000, guesses:6,  hp:1, timer:30 }, type:'challenge' },
      { id: '3-7', name: 'PARADOX',    mode: 'quantum',  config: { min:1,   max:500,  guesses:8,  hp:3, timer:0  }, type:'challenge' },
      { id: '3-8', name: 'OBLIVION',   mode: 'nightmare',config: { min:1,   max:500,  guesses:5,  hp:1, timer:20 }, type:'challenge' },
      { id: '3-9', name: 'BOSS_VOID',  mode: 'boss',     config: { min:1,   max:1000, guesses:15, hp:3, timer:180}, type:'boss' }
    ]
  });

  // World 5 — Dominion (levels 41-50)
  worlds.push({
    name: 'WORLD 5: DOMINION',
    levels: [
      { id: '4-0', name: 'ASCEND',     mode: 'nightmare',config: { min:1,   max:500,  guesses:7,  hp:2, timer:0  }, type:'normal' },
      { id: '4-1', name: 'TRANSCEND',  mode: 'impossible',config:{min:1,   max:100,  guesses:6,  hp:2, timer:0  }, type:'challenge' },
      { id: '4-2', name: 'DOMINANCE',  mode: 'multi',    config: { min:1,   max:100,  guesses:10, hp:3, timer:0, multiCount:5 }, type:'challenge' },
      { id: '4-3', name: 'PROTOCOL X', mode: 'chaos',    config: { min:1,   max:1000, guesses:10, hp:2, timer:0  }, type:'secret' },
      { id: '4-4', name: 'NEXUS',      mode: 'corrupted',config: { min:1,   max:500,  guesses:9,  hp:3, timer:0  }, type:'normal' },
      { id: '4-5', name: 'MATRIX',     mode: 'hardcore', config: { min:1,   max:2000, guesses:7,  hp:1, timer:25 }, type:'challenge' },
      { id: '4-6', name: 'CIPHER X',   mode: 'quantum',  config: { min:1,   max:1000, guesses:10, hp:3, timer:0  }, type:'challenge' },
      { id: '4-7', name: 'GHOST ZERO', mode: 'nightmare',config: { min:1,   max:1000, guesses:6,  hp:1, timer:15 }, type:'challenge' },
      { id: '4-8', name: 'SPECTRE',    mode: 'impossible',config:{min:1,   max:500,  guesses:7,  hp:1, timer:0  }, type:'challenge' },
      { id: '4-9', name: 'FINAL BOSS', mode: 'boss',     config: { min:1,   max:2000, guesses:20, hp:5, timer:240}, type:'boss' }
    ]
  });

  return worlds;
})();

// ── POWERUP DEFINITIONS ───────────────────────────────────────
const POWERUP_DEFS = {
  revealDigit: {
    name: 'REVEAL DIGIT',
    icon: '🔭',
    desc: 'Reveals one digit of the answer',
    color: '#bf5fff'
  },
  extraGuess: {
    name: 'EXTRA GUESS',
    icon: '➕',
    desc: 'Adds one more guess',
    color: '#39ff14'
  },
  freezeTimer: {
    name: 'FREEZE TIMER',
    icon: '❄️',
    desc: 'Freezes timer for 10 seconds',
    color: '#00d4ff'
  },
  shield: {
    name: 'SHIELD',
    icon: '🛡',
    desc: 'Absorbs one HP loss',
    color: '#ffd700'
  },
  undoGuess: {
    name: 'UNDO GUESS',
    icon: '↩️',
    desc: 'Removes last guess from history',
    color: '#ff9500'
  },
  extraLife: {
    name: 'EXTRA LIFE',
    icon: '💖',
    desc: 'Restores one HP',
    color: '#ff4d6d'
  },
  multiplierBoost: {
    name: 'MULTIPLIER',
    icon: '⚡',
    desc: 'Doubles XP/coin reward for this game',
    color: '#ff9500'
  }
};

// ── PROGRESSION SYSTEM ────────────────────────────────────────
const Progression = (() => {
  function xpForLevel(level) {
    return Math.floor(100 * Math.pow(1.25, level - 1));
  }

  function getRank(xp) {
    let rank = 0;
    for (let i = RANKS.length - 1; i >= 0; i--) {
      if (xp >= RANKS[i].minXP) { rank = i; break; }
    }
    return rank;
  }

  function addXP(amount) {
    const save = window.SaveData;
    const multiplier = 1 + save.upgrades.xpMultiplier * 0.1;
    const actualXP = Math.floor(amount * multiplier);

    save.xp += actualXP;
    save.stats.lifetimeXP += actualXP;

    let leveled = false;
    while (save.xp >= xpForLevel(save.level)) {
      save.xp -= xpForLevel(save.level);
      save.level++;
      leveled = true;
    }

    const newRank = getRank(save.stats.lifetimeXP);
    if (newRank > save.rank) {
      save.rank = newRank;
      UI.toast(`RANK UP: ${RANKS[newRank].name}!`, 'gold');
      Effects.playLevelUpEffect();
    }

    if (leveled) {
      Effects.playLevelUpEffect();
      UI.toast(`LEVEL ${save.level}!`, 'gold');
    }

    Storage.save(save);
    UI.updateXPBar();
    Effects.playXPEffect(actualXP);
    return actualXP;
  }

  function addCoins(amount) {
    const save = window.SaveData;
    const multiplier = 1 + save.upgrades.coinMultiplier * 0.15;
    const actual = Math.floor(amount * multiplier);
    save.coins += actual;
    save.stats.lifetimeCoins = (save.stats.lifetimeCoins || 0) + actual;
    Storage.save(save);
    Effects.playCoinEffect(actual);
    return actual;
  }

  function spendCoins(amount) {
    const save = window.SaveData;
    if (save.coins < amount) return false;
    save.coins -= amount;
    Storage.save(save);
    return true;
  }

  function checkAchievements(newlyUnlocked = []) {
    const save = window.SaveData;
    const stats = save.stats;

    for (const ach of ACHIEVEMENTS) {
      if (save.achievements[ach.id]) continue;
      try {
        if (ach.condition(stats, save)) {
          save.achievements[ach.id] = Date.now();
          newlyUnlocked.push(ach);
          Effects.playAchievementEffect();
          UI.toast(`🏆 ACHIEVEMENT: ${ach.name}`, 'gold');
        }
      } catch(e) {}
    }

    Storage.save(save);
    return newlyUnlocked;
  }

  function recordModeWin(modeId) {
    const save = window.SaveData;
    if (!save.stats.modeStats[modeId]) save.stats.modeStats[modeId] = { wins: 0, losses: 0, maxRound: 0 };
    save.stats.modeStats[modeId].wins++;
    Storage.save(save);
  }

  function recordModeLoss(modeId) {
    const save = window.SaveData;
    if (!save.stats.modeStats[modeId]) save.stats.modeStats[modeId] = { wins: 0, losses: 0, maxRound: 0 };
    save.stats.modeStats[modeId].losses++;
    Storage.save(save);
  }

  function isModeLocked(modeId) {
    const req = MODE_UNLOCK_REQS[modeId];
    if (!req || req.always) return false;
    const save = window.SaveData;
    if (req.wins && save.stats.totalWins < req.wins) return true;
    if (req.rank && save.rank < req.rank) return true;
    return false;
  }

  function purchaseUpgrade(upgradeId) {
    const save = window.SaveData;
    const upg = UPGRADES.find(u => u.id === upgradeId);
    if (!upg) return false;
    const currentLevel = save.upgrades[upgradeId] || 0;
    if (currentLevel >= upg.maxLevel) return false;
    const cost = upg.costs[currentLevel];
    if (!spendCoins(cost)) return false;
    save.upgrades[upgradeId] = currentLevel + 1;
    Storage.save(save);
    return true;
  }

  function getRankedTier(points) {
    let tier = 0;
    for (let i = RANKED_TIERS.length - 1; i >= 0; i--) {
      if (points >= RANKED_TIERS[i].minPoints) { tier = i; break; }
    }
    return tier;
  }

  function calculateRewards(result) {
    const { won, guessCount, maxGuesses, timeTaken, mode, combo, multiplierActive } = result;
    const save = window.SaveData;

    let baseXP = 0, baseCoins = 0;

    if (won) {
      const guessEfficiency = Math.max(0, (maxGuesses - guessCount) / maxGuesses);
      baseXP = 50 + Math.floor(guessEfficiency * 100);
      baseCoins = 10 + Math.floor(guessEfficiency * 30);

      // Mode bonuses
      const modeBonuses = {
        hardcore: 1.5, nightmare: 2.0, impossible: 4.0, boss: 2.5,
        survival: 1.2, ranked: 1.3, chaos: 1.4, quantum: 1.3,
        corrupted: 1.6, daily: 1.5
      };
      const modeBonus = modeBonuses[mode] || 1.0;
      baseXP = Math.floor(baseXP * modeBonus);
      baseCoins = Math.floor(baseCoins * modeBonus);

      // Combo bonus
      if (combo > 1) {
        const comboBonus = 1 + (combo - 1) * 0.1 * (1 + save.upgrades.comboMaster * 0.2);
        baseXP = Math.floor(baseXP * comboBonus);
      }

      // Speed bonus
      if (timeTaken !== null && timeTaken < 10) {
        baseXP += 25; baseCoins += 8;
      }
    } else {
      baseXP = 5;
      baseCoins = 0;
    }

    if (multiplierActive) {
      baseXP *= 2; baseCoins *= 2;
    }

    return { xp: baseXP, coins: baseCoins };
  }

  return {
    xpForLevel, getRank, addXP, addCoins, spendCoins,
    checkAchievements, recordModeWin, recordModeLoss,
    isModeLocked, purchaseUpgrade, getRankedTier, calculateRewards
  };
})();

// Make available globally
window.RANKS = RANKS;
window.RANKED_TIERS = RANKED_TIERS;
window.UPGRADES = UPGRADES;
window.ACHIEVEMENTS = ACHIEVEMENTS;
window.CAMPAIGN_LEVELS = CAMPAIGN_LEVELS;
window.POWERUP_DEFS = POWERUP_DEFS;
window.MODE_UNLOCK_REQS = MODE_UNLOCK_REQS;
window.Progression = Progression;
