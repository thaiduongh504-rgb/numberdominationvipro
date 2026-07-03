/* storage.js — Save/Load system using LocalStorage */
'use strict';

const Storage = (() => {
  const KEY = 'numdom_save_v1';

  const DEFAULT_SAVE = {
    version: 1,
    xp: 0,
    level: 1,
    rank: 0,
    coins: 0,
    stats: {
      totalWins: 0,
      totalLosses: 0,
      totalGuesses: 0,
      totalGamesPlayed: 0,
      bestStreak: 0,
      currentStreak: 0,
      accuracyNumerator: 0,
      accuracyDenominator: 0,
      lifetimeXP: 0,
      lifetimeCoins: 0,
      fastestWin: null,
      avgGuessesPerWin: 0,
      modeStats: {}
    },
    achievements: {},
    upgrades: {
      extraGuesses: 0,
      hintQuality: 0,
      timerBonus: 0,
      coinMultiplier: 0,
      xpMultiplier: 0,
      powerupSlots: 0,
      startingHP: 0,
      comboMaster: 0
    },
    powerups: {
      revealDigit: 2,
      extraGuess: 2,
      freezeTimer: 1,
      shield: 1,
      undoGuess: 2,
      extraLife: 1,
      multiplierBoost: 2
    },
    settings: {
      soundEnabled: true,
      musicEnabled: false,
      particles: true,
      screenShake: true,
      hints: true,
      theme: 'cyber'
    },
    campaign: {
      currentWorld: 0,
      currentLevel: 0,
      completedLevels: {},
      levelStars: {}
    },
    daily: {
      lastDate: null,
      streak: 0,
      completed: {},
      scores: {}
    },
    ranked: {
      points: 0,
      tier: 0,
      wins: 0,
      losses: 0,
      seasonBest: 0
    },
    unlockedModes: ['classic', 'survival', 'infinite', 'campaign', 'daily', 'ranked']
  };

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return deepClone(DEFAULT_SAVE);
      const saved = JSON.parse(raw);
      return deepMerge(deepClone(DEFAULT_SAVE), saved);
    } catch (e) {
      console.warn('Save load failed:', e);
      return deepClone(DEFAULT_SAVE);
    }
  }

  function save(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Save failed:', e);
    }
  }

  function reset() {
    localStorage.removeItem(KEY);
    return deepClone(DEFAULT_SAVE);
  }

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function deepMerge(target, source) {
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key] || typeof target[key] !== 'object') target[key] = {};
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

  // Obfuscated get for anti-cheat: stores a hash alongside sensitive values
  function _hash(val) {
    let h = 0;
    const s = String(val) + 'nd_salt_42x';
    for (let i = 0; i < s.length; i++) {
      h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
    }
    return h.toString(16);
  }

  function secureSet(store, key, value) {
    store[key] = value;
    store[key + '__h'] = _hash(value);
  }

  function secureGet(store, key, fallback) {
    const val = store[key];
    const h = store[key + '__h'];
    if (h !== undefined && h !== _hash(val)) {
      console.warn('Integrity check failed for', key);
      return fallback;
    }
    return val !== undefined ? val : fallback;
  }

  return { load, save, reset, deepClone, secureSet, secureGet };
})();
