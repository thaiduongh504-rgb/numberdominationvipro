/* modes.js — All 15 Game Modes with Unique Mechanics */
'use strict';

// ── MODE REGISTRY ─────────────────────────────────────────────
const MODES = {

  // ──────────────────────────────────────────────
  // CLASSIC MODE
  // ──────────────────────────────────────────────
  classic: {
    id: 'classic',
    name: 'CLASSIC',
    icon: '🎮',
    desc: 'Pure guessing. Higher/lower hints. Find the number.',
    defaultConfig: { min: 1, max: 100, guesses: 7, hp: 3, timer: 0 },

    init(state) {
      state.numberSystem = 'decimal';
      return state;
    },

    onGuess(state, guess) {
      const answer = state._answer;
      if (guess === answer) return { correct: true };
      return { correct: false, direction: guess < answer ? 'up' : 'down' };
    },

    generateHints(state, guess, result) {
      const hints = [];
      const answer = state._answer;
      const dist = Math.abs(answer - guess);

      hints.push({ type: result.direction === 'up' ? 'direction-up' : 'direction-down',
        label: 'DIRECTION', value: result.direction === 'up' ? '▲ HIGHER' : '▼ LOWER' });

      if (state.save.upgrades.hintQuality >= 1) {
        const pct = Math.round((dist / (state.config.max - state.config.min)) * 100);
        const closeness = pct < 5 ? 'VERY CLOSE' : pct < 20 ? 'CLOSE' : pct < 50 ? 'FAR' : 'VERY FAR';
        hints.push({ type: 'info', label: 'PROXIMITY', value: `${closeness} (${100-pct}%)` });
      }
      if (state.save.upgrades.hintQuality >= 2) {
        hints.push({ type: 'info', label: 'PARITY',
          value: answer % 2 === 0 ? 'EVEN NUMBER' : 'ODD NUMBER' });
      }
      if (state.save.upgrades.hintQuality >= 3) {
        const isPrime = HintEngine.isPrime(answer);
        hints.push({ type: 'info', label: 'PRIME', value: isPrime ? 'IS PRIME' : 'NOT PRIME' });
      }
      return hints;
    },

    getGuessLimit(config, save) {
      return config.guesses + (save.upgrades.extraGuesses * 2);
    }
  },

  // ──────────────────────────────────────────────
  // SURVIVAL MODE
  // ──────────────────────────────────────────────
  survival: {
    id: 'survival',
    name: 'SURVIVAL',
    icon: '💀',
    desc: 'Endless waves. Each round gets harder. Lose HP on wrong guesses.',
    defaultConfig: { min: 1, max: 50, guesses: 5, hp: 3, timer: 30 },

    init(state) {
      state.round = 1;
      state.roundsCleared = 0;
      state.roundConfig = this._buildRoundConfig(state, 1);
      state._answer = HintEngine.generateAnswer(state.roundConfig.min, state.roundConfig.max, state.numberSystem);
      return state;
    },

    _buildRoundConfig(state, round) {
      const scale = 1 + (round - 1) * 0.15;
      const min = state.config.min;
      const max = Math.floor(state.config.max * scale);
      const guesses = Math.max(3, state.config.guesses - Math.floor(round / 5));
      const timer = state.config.timer > 0 ? Math.max(10, state.config.timer - Math.floor(round * 0.5)) : 0;
      return { min, max, guesses, timer };
    },

    onGuess(state, guess) {
      const answer = state._answer;
      if (guess === answer) {
        state.roundsCleared++;
        // Update modeStats for max round
        const save = window.SaveData;
        if (!save.stats.modeStats.survival) save.stats.modeStats.survival = { wins: 0, losses: 0, maxRound: 0 };
        save.stats.modeStats.survival.maxRound = Math.max(save.stats.modeStats.survival.maxRound, state.roundsCleared);
        Storage.save(save);
        return { correct: true, roundComplete: true };
      }
      return { correct: false, direction: guess < answer ? 'up' : 'down', hpLoss: 1 };
    },

    onRoundComplete(state) {
      state.round++;
      state.roundConfig = this._buildRoundConfig(state, state.round);
      state._answer = HintEngine.generateAnswer(state.roundConfig.min, state.roundConfig.max, state.numberSystem);
      state.guessCount = 0;
      state.guessesLeft = state.roundConfig.guesses + (state.save.upgrades.extraGuesses * 2);
      state.timeLeft = state.roundConfig.timer > 0 ? state.roundConfig.timer + (state.save.upgrades.timerBonus * 5) : 0;
      return state;
    },

    generateHints(state, guess, result) {
      const hints = [];
      const answer = state._answer;
      hints.push({ type: result.direction === 'up' ? 'direction-up' : 'direction-down',
        label: 'DIRECTION', value: result.direction === 'up' ? '▲ HIGHER' : '▼ LOWER' });
      hints.push({ type: 'info', label: 'ROUND', value: `ROUND ${state.round}` });
      const dist = Math.abs(answer - guess);
      if (dist < 10) hints.push({ type: 'info', label: 'PROXIMITY', value: 'VERY CLOSE!' });
      return hints;
    },

    getGuessLimit(config, save, state) {
      return state?.roundConfig ? state.roundConfig.guesses + (save.upgrades.extraGuesses * 2) : config.guesses;
    },

    isInfinite: true
  },

  // ──────────────────────────────────────────────
  // HARDCORE MODE
  // ──────────────────────────────────────────────
  hardcore: {
    id: 'hardcore',
    name: 'HARDCORE',
    icon: '⚔️',
    desc: 'One life. Fewer hints. No mercy.',
    defaultConfig: { min: 1, max: 100, guesses: 5, hp: 1, timer: 45 },

    init(state) {
      state.shielded = false;
      return state;
    },

    onGuess(state, guess) {
      const answer = state._answer;
      if (guess === answer) return { correct: true };
      // Any wrong guess costs 1 HP in hardcore
      return { correct: false, direction: guess < answer ? 'up' : 'down', hpLoss: 1 };
    },

    generateHints(state, guess, result) {
      // Very limited hints
      const hints = [];
      hints.push({ type: result.direction === 'up' ? 'direction-up' : 'direction-down',
        label: 'DIRECTION', value: result.direction === 'up' ? '▲ HIGHER' : '▼ LOWER' });
      // Only distance hint every 3rd guess
      if (state.guessCount % 3 === 0) {
        const dist = Math.abs(state._answer - guess);
        hints.push({ type: 'warning', label: 'DISTANCE', value: `±${dist}` });
      }
      return hints;
    },

    getGuessLimit(config, save) {
      return config.guesses + (save.upgrades.extraGuesses * 2);
    }
  },

  // ──────────────────────────────────────────────
  // NIGHTMARE MODE
  // ──────────────────────────────────────────────
  nightmare: {
    id: 'nightmare',
    name: 'NIGHTMARE',
    icon: '😱',
    desc: 'Timer counts down. Wrong guess = -HP. Hints degraded.',
    defaultConfig: { min: 1, max: 100, guesses: 6, hp: 2, timer: 30 },

    init(state) {
      state.stressLevel = 0;
      return state;
    },

    onGuess(state, guess) {
      const answer = state._answer;
      // Stress increases every guess
      state.stressLevel = Math.min(10, state.stressLevel + 1);
      if (guess === answer) return { correct: true };
      return { correct: false, direction: guess < answer ? 'up' : 'down', hpLoss: 1 };
    },

    generateHints(state, guess, result) {
      const hints = [];
      hints.push({ type: result.direction === 'up' ? 'direction-up' : 'direction-down',
        label: 'DIRECTION', value: result.direction === 'up' ? '▲ HIGHER' : '▼ LOWER' });
      // Stress-modulated hint accuracy
      if (state.stressLevel < 5) {
        const dist = Math.abs(state._answer - guess);
        const pct = Math.round((1 - dist / (state.config.max - state.config.min)) * 100);
        hints.push({ type: 'warning', label: 'STRESS', value: `${state.stressLevel}/10 ⚠` });
        hints.push({ type: 'info', label: 'CLOSENESS', value: `${pct}%` });
      } else {
        hints.push({ type: 'warning', label: 'CRITICAL STRESS', value: 'SYSTEM DEGRADED' });
      }
      return hints;
    },

    getGuessLimit(config, save) {
      return config.guesses + (save.upgrades.extraGuesses * 2);
    }
  },

  // ──────────────────────────────────────────────
  // INFINITE MODE
  // ──────────────────────────────────────────────
  infinite: {
    id: 'infinite',
    name: 'INFINITE',
    icon: '♾️',
    desc: 'No guess limit. Play forever. Chase the highest score.',
    defaultConfig: { min: 1, max: 100, guesses: 999, hp: 3, timer: 0 },

    init(state) {
      state.totalGuessesEver = 0;
      state.numbersSolved = 0;
      state.score = 0;
      return state;
    },

    onGuess(state, guess) {
      const answer = state._answer;
      if (guess === answer) {
        state.numbersSolved++;
        const pointsEarned = Math.max(1, 10 - state.guessCount);
        state.score += pointsEarned;
        return { correct: true, points: pointsEarned, continuous: true };
      }
      state.totalGuessesEver++;
      return { correct: false, direction: guess < answer ? 'up' : 'down' };
    },

    onNumberSolved(state) {
      // New number, same session
      state._answer = HintEngine.generateAnswer(state.config.min, state.config.max, state.numberSystem);
      state.guessCount = 0;
      return state;
    },

    generateHints(state, guess, result) {
      const hints = [];
      const answer = state._answer;
      hints.push({ type: result.direction === 'up' ? 'direction-up' : 'direction-down',
        label: 'DIRECTION', value: result.direction === 'up' ? '▲ HIGHER' : '▼ LOWER' });
      const dist = Math.abs(answer - guess);
      hints.push({ type: 'info', label: 'DISTANCE', value: `±${dist}` });
      hints.push({ type: 'info', label: 'SCORE', value: `${state.score} pts` });
      return hints;
    },

    getGuessLimit() { return 999; },
    isInfinite: true
  },

  // ──────────────────────────────────────────────
  // CAMPAIGN MODE (uses classic engine, configured per level)
  // ──────────────────────────────────────────────
  campaign: {
    id: 'campaign',
    name: 'CAMPAIGN',
    icon: '📡',
    desc: 'Story mode with 50+ levels across 5 worlds.',
    defaultConfig: { min: 1, max: 100, guesses: 7, hp: 3, timer: 0 },

    init(state) { return state; },
    onGuess(state, guess) {
      const answer = state._answer;
      if (guess === answer) return { correct: true };
      return { correct: false, direction: guess < answer ? 'up' : 'down' };
    },
    generateHints(state, guess, result) {
      return MODES.classic.generateHints(state, guess, result);
    },
    getGuessLimit(config, save) { return config.guesses + (save.upgrades.extraGuesses * 2); }
  },

  // ──────────────────────────────────────────────
  // DAILY CHALLENGE (seeded random)
  // ──────────────────────────────────────────────
  daily: {
    id: 'daily',
    name: 'DAILY CHALLENGE',
    icon: '🗓',
    desc: 'One challenge per day. Fixed seed. Global leaderboard.',
    defaultConfig: { min: 1, max: 100, guesses: 7, hp: 3, timer: 60 },

    init(state) {
      state.isDaily = true;
      return state;
    },

    onGuess(state, guess) {
      const answer = state._answer;
      if (guess === answer) return { correct: true };
      return { correct: false, direction: guess < answer ? 'up' : 'down' };
    },

    generateHints(state, guess, result) {
      return MODES.classic.generateHints(state, guess, result);
    },

    getGuessLimit(config, save) { return config.guesses + (save.upgrades.extraGuesses * 2); }
  },

  // ──────────────────────────────────────────────
  // RANKED MODE
  // ──────────────────────────────────────────────
  ranked: {
    id: 'ranked',
    name: 'RANKED',
    icon: '⚔️',
    desc: 'Competitive play. Win to climb tiers. Lose to drop.',
    defaultConfig: { min: 1, max: 100, guesses: 7, hp: 3, timer: 45 },

    init(state) {
      state.isRanked = true;
      return state;
    },

    onGuess(state, guess) {
      const answer = state._answer;
      if (guess === answer) return { correct: true };
      return { correct: false, direction: guess < answer ? 'up' : 'down' };
    },

    onResult(state, won) {
      const save = window.SaveData;
      const tier = save.ranked.tier;
      const tierData = RANKED_TIERS[tier];
      const pointChange = won ? (15 + tier * 3) : -(10 + tier * 2);
      save.ranked.points = Math.max(0, save.ranked.points + pointChange);
      save.ranked.wins += won ? 1 : 0;
      save.ranked.losses += won ? 0 : 1;
      const newTier = Progression.getRankedTier(save.ranked.points);
      if (newTier > save.ranked.tier) {
        UI.toast(`TIER UP: ${RANKED_TIERS[newTier].name}!`, 'gold');
      }
      save.ranked.tier = newTier;
      Storage.save(save);
      return { pointChange, newTier };
    },

    generateHints(state, guess, result) {
      return MODES.classic.generateHints(state, guess, result);
    },

    getGuessLimit(config, save) { return config.guesses + (save.upgrades.extraGuesses * 2); }
  },

  // ──────────────────────────────────────────────
  // REVERSE MODE
  // ──────────────────────────────────────────────
  reverse: {
    id: 'reverse',
    name: 'REVERSE',
    icon: '🔄',
    desc: 'YOU are the number. The AI guesses. Mislead it!',
    defaultConfig: { min: 1, max: 100, guesses: 10, hp: 3, timer: 0 },

    init(state) {
      state.playerNumber = null; // Player picks number at start
      state.aiGuesses = [];
      state.aiState = { low: state.config.min, high: state.config.max };
      state.aiGuessCount = 0;
      state.maxAIGuesses = state.config.guesses;
      state.reversePhase = 'pick'; // 'pick' or 'respond'
      return state;
    },

    getAIGuess(state) {
      // Binary search AI (can be beaten by lying)
      const { low, high } = state.aiState;
      return Math.floor((low + high) / 2);
    },

    processPlayerResponse(state, response) {
      // response: 'correct', 'higher', 'lower'
      const aiGuess = state.currentAIGuess;
      if (response === 'correct') {
        // Check if player is telling the truth
        if (aiGuess === state.playerNumber) {
          return { aiWon: true, caught: false };
        } else {
          // Player lied!
          return { aiWon: false, caught: true, reveal: state.playerNumber };
        }
      }
      // Validate response
      const truthful = (response === 'higher' && state.playerNumber > aiGuess) ||
                       (response === 'lower'  && state.playerNumber < aiGuess);
      if (!truthful) {
        return { aiWon: false, caught: true, reveal: state.playerNumber };
      }
      // Update AI search
      if (response === 'higher') state.aiState.low = aiGuess + 1;
      else state.aiState.high = aiGuess - 1;

      state.aiGuessCount++;
      if (state.aiGuessCount >= state.maxAIGuesses) {
        return { aiWon: false, playerWon: true };
      }
      state.currentAIGuess = this.getAIGuess(state);
      return { aiWon: false, nextGuess: state.currentAIGuess };
    },

    onGuess() { return { correct: false }; }, // Not used in reverse mode
    generateHints() { return []; },
    getGuessLimit(config) { return config.guesses; }
  },

  // ──────────────────────────────────────────────
  // QUANTUM MODE
  // ──────────────────────────────────────────────
  quantum: {
    id: 'quantum',
    name: 'QUANTUM',
    icon: '⚛️',
    desc: 'The number is in superposition. Collapse it with each guess.',
    defaultConfig: { min: 1, max: 100, guesses: 7, hp: 3, timer: 0 },

    init(state) {
      // Quantum state: number starts in superposition of multiple candidates
      state.quantumCandidates = HintEngine.generateQuantumSet(state.config.min, state.config.max, 5);
      state._answer = state.quantumCandidates[Math.floor(Math.random() * state.quantumCandidates.length)];
      state.observed = false;
      state.collapseCount = 0;
      return state;
    },

    onGuess(state, guess) {
      const answer = state._answer;
      if (guess === answer) {
        state.observed = true;
        return { correct: true };
      }
      // Each wrong guess collapses quantum state further
      state.collapseCount++;
      state.quantumCandidates = state.quantumCandidates.filter(c => {
        // Keep candidates consistent with direction
        return guess < answer ? c > guess : c < guess;
      });
      if (state.quantumCandidates.length === 0) {
        state.quantumCandidates = [answer];
      }
      return { correct: false, direction: guess < answer ? 'up' : 'down', quantumCollapse: true };
    },

    generateHints(state, guess, result) {
      const hints = [];
      hints.push({ type: result.direction === 'up' ? 'direction-up' : 'direction-down',
        label: 'DIRECTION', value: result.direction === 'up' ? '▲ HIGHER' : '▼ LOWER' });
      hints.push({ type: 'info', label: 'QUANTUM STATE',
        value: `${state.quantumCandidates.length} candidates remain` });
      if (state.quantumCandidates.length <= 3) {
        hints.push({ type: 'warning', label: 'COLLAPSE IMMINENT',
          value: `Candidates: ${state.quantumCandidates.join(', ')}` });
      }
      hints.push({ type: 'info', label: 'COLLAPSES', value: `${state.collapseCount}` });
      return hints;
    },

    getGuessLimit(config, save) { return config.guesses + (save.upgrades.extraGuesses * 2); }
  },

  // ──────────────────────────────────────────────
  // CHAOS MODE
  // ──────────────────────────────────────────────
  chaos: {
    id: 'chaos',
    name: 'CHAOS',
    icon: '🌪️',
    desc: 'Random events. Misleading hints. The system is corrupted.',
    defaultConfig: { min: 1, max: 100, guesses: 8, hp: 3, timer: 0 },

    EVENTS: [
      { id: 'range_shift',   weight: 2, name: 'RANGE SHIFT',    apply: (s) => { s._answer = HintEngine.generateAnswer(s.config.min, s.config.max, s.numberSystem); return 'Answer relocated!'; } },
      { id: 'guess_steal',   weight: 2, name: 'GUESS STEAL',    apply: (s) => { s.guessesLeft = Math.max(1, s.guessesLeft - 1); return '-1 guess!'; } },
      { id: 'hint_invert',   weight: 3, name: 'HINT INVERT',    apply: (s) => { s.hintsInverted = !s.hintsInverted; return 'Hints inverted!'; } },
      { id: 'time_warp',     weight: 2, name: 'TIME WARP',      apply: (s) => { if (s.timeLeft) { s.timeLeft = Math.max(5, s.timeLeft - 10); } return '-10 seconds!'; } },
      { id: 'extra_guess',   weight: 2, name: 'BONUS GUESS',    apply: (s) => { s.guessesLeft++; return '+1 guess!'; } },
      { id: 'hp_drain',      weight: 1, name: 'HP DRAIN',       apply: (s) => { s.hp = Math.max(1, s.hp - 1); return '-1 HP!'; } },
      { id: 'range_narrow',  weight: 2, name: 'RANGE NARROW',   apply: (s) => { const mid = Math.round((s.config.min + s.config.max) / 2); s.config.min = Math.min(s._answer - 1, mid - 10); s.config.max = Math.max(s._answer + 1, mid + 10); return 'Range narrowed!'; } },
      { id: 'multiply_hints',weight: 2, name: 'HINT FLOOD',     apply: () => 'Extra hints incoming!' }
    ],

    init(state) {
      state.hintsInverted = false;
      state.chaosEventCooldown = 3;
      state.lastChaosEvent = null;
      return state;
    },

    onGuess(state, guess) {
      const answer = state._answer;
      if (guess === answer) return { correct: true };

      // Maybe trigger chaos event
      let chaosEvent = null;
      state.chaosEventCooldown--;
      if (state.chaosEventCooldown <= 0) {
        state.chaosEventCooldown = 2 + Math.floor(Math.random() * 3);
        chaosEvent = this._triggerEvent(state);
      }

      let dir = guess < answer ? 'up' : 'down';
      // Invert direction hint if inverted
      if (state.hintsInverted) dir = dir === 'up' ? 'down' : 'up';

      return { correct: false, direction: dir, chaosEvent };
    },

    _triggerEvent(state) {
      const events = this.EVENTS;
      const total = events.reduce((s, e) => s + e.weight, 0);
      let r = Math.random() * total;
      for (const e of events) {
        r -= e.weight;
        if (r <= 0) {
          const msg = e.apply(state);
          return { name: e.name, msg };
        }
      }
      return null;
    },

    generateHints(state, guess, result) {
      const hints = [];
      const answer = state._answer;

      if (result.chaosEvent) {
        hints.push({ type: 'chaos', label: '⚠ CHAOS EVENT', value: `${result.chaosEvent.name}: ${result.chaosEvent.msg}` });
      }

      // Possibly mislead
      if (Math.random() < 0.25) {
        hints.push({ type: 'mislead', label: 'SIGNAL', value: state.hintsInverted ? 'Hint matrix normal' : '⚠ MISLEADING DATA' });
      }

      hints.push({ type: result.direction === 'up' ? 'direction-up' : 'direction-down',
        label: state.hintsInverted ? '⚠ MAYBE DIRECTION' : 'DIRECTION',
        value: result.direction === 'up' ? '▲ HIGHER' : '▼ LOWER' });

      if (Math.random() < 0.4) {
        // Fake extra hint
        hints.push({ type: 'mislead', label: 'GHOST SIGNAL',
          value: `Try ~${Math.floor(Math.random() * (state.config.max - state.config.min) + state.config.min)}` });
      }

      const dist = Math.abs(answer - guess);
      hints.push({ type: 'warning', label: 'DISTANCE', value: `±${dist + Math.floor(Math.random() * 10 - 5)}` });

      return hints;
    },

    getGuessLimit(config, save) { return config.guesses + (save.upgrades.extraGuesses * 2); }
  },

  // ──────────────────────────────────────────────
  // MULTI NUMBER MODE
  // ──────────────────────────────────────────────
  multi: {
    id: 'multi',
    name: 'MULTI NUMBER',
    icon: '🔢',
    desc: 'Guess multiple secret numbers simultaneously.',
    defaultConfig: { min: 1, max: 50, guesses: 10, hp: 3, timer: 0, multiCount: 3 },

    init(state) {
      const count = state.config.multiCount || 3;
      state.answers = [];
      state.solved = [];
      for (let i = 0; i < count; i++) {
        let n;
        do { n = HintEngine.generateAnswer(state.config.min, state.config.max, state.numberSystem); }
        while (state.answers.includes(n));
        state.answers.push(n);
        state.solved.push(false);
      }
      // Anti-cheat: store answers as encoded
      state._answers_enc = state.answers.map(a => btoa(String(a + 7919)));
      delete state.answers;
      state._answer = null; // Not used in multi
      return state;
    },

    _getAnswers(state) {
      return state._answers_enc.map(e => parseInt(atob(e)) - 7919);
    },

    onGuess(state, guess) {
      const answers = this._getAnswers(state);
      const results = answers.map((a, i) => {
        if (state.solved[i]) return { solved: true };
        if (guess === a) { state.solved[i] = true; return { hit: true, index: i }; }
        return { direction: guess < a ? 'up' : 'down', index: i };
      });

      const allSolved = state.solved.every(s => s);
      return { correct: allSolved, multiResults: results, allSolved };
    },

    generateHints(state, guess, result) {
      const hints = [];
      const answers = this._getAnswers(state);

      result.multiResults.forEach((r, i) => {
        if (r.solved) {
          hints.push({ type: 'exact', label: `TARGET ${i+1}`, value: '✓ SOLVED' });
        } else if (r.hit) {
          hints.push({ type: 'exact', label: `TARGET ${i+1}`, value: '✓ HIT!' });
        } else {
          hints.push({ type: r.direction === 'up' ? 'direction-up' : 'direction-down',
            label: `TARGET ${i+1}`, value: r.direction === 'up' ? '▲ HIGHER' : '▼ LOWER' });
        }
      });

      const remaining = state.solved.filter(s => !s).length;
      hints.push({ type: 'info', label: 'REMAINING', value: `${remaining} targets left` });
      return hints;
    },

    getGuessLimit(config, save) { return config.guesses + (save.upgrades.extraGuesses * 2); }
  },

  // ──────────────────────────────────────────────
  // CORRUPTED MODE
  // ──────────────────────────────────────────────
  corrupted: {
    id: 'corrupted',
    name: 'CORRUPTED',
    icon: '💾',
    desc: 'Data is corrupted. Some hints are false. Detect the corruption.',
    defaultConfig: { min: 1, max: 100, guesses: 8, hp: 3, timer: 0 },

    init(state) {
      state.corruptionLevel = 0.3; // 30% hints are false
      state.corruptedThisGuess = false;
      return state;
    },

    onGuess(state, guess) {
      const answer = state._answer;
      if (guess === answer) return { correct: true };
      state.corruptedThisGuess = Math.random() < state.corruptionLevel;
      let dir = guess < answer ? 'up' : 'down';
      if (state.corruptedThisGuess) dir = dir === 'up' ? 'down' : 'up';
      return { correct: false, direction: dir, corrupted: state.corruptedThisGuess };
    },

    generateHints(state, guess, result) {
      const hints = [];
      const corrupted = result.corrupted;
      const answer = state._answer;

      hints.push({ type: result.direction === 'up' ? 'direction-up' : 'direction-down',
        label: corrupted ? '⚠ [CORRUPTED]' : 'DIRECTION',
        value: result.direction === 'up' ? '▲ HIGHER' : '▼ LOWER' });

      if (corrupted) {
        hints.push({ type: 'warning', label: 'CORRUPTION', value: 'DATA INTEGRITY COMPROMISED' });
      }

      const digitSum = HintEngine.digitSum(Math.abs(answer));
      const corruptedDs = Math.random() < state.corruptionLevel ? digitSum + Math.floor(Math.random() * 5) - 2 : digitSum;
      hints.push({ type: 'info', label: 'DIGIT SUM', value: `${corruptedDs}${Math.random() < state.corruptionLevel ? ' ⚠' : ''}` });

      return hints;
    },

    getGuessLimit(config, save) { return config.guesses + (save.upgrades.extraGuesses * 2); }
  },

  // ──────────────────────────────────────────────
  // IMPOSSIBLE MODE
  // ──────────────────────────────────────────────
  impossible: {
    id: 'impossible',
    name: 'IMPOSSIBLE',
    icon: '🌀',
    desc: 'Minimal hints. Large range. Very few guesses. True challenge.',
    defaultConfig: { min: 1, max: 1000, guesses: 5, hp: 1, timer: 0 },

    init(state) {
      state.hintRevealed = false;
      return state;
    },

    onGuess(state, guess) {
      const answer = state._answer;
      if (guess === answer) return { correct: true };
      // One HP loss per guess
      return { correct: false, direction: guess < answer ? 'up' : 'down', hpLoss: 1 };
    },

    generateHints(state, guess, result) {
      const hints = [];
      // Only direction, no extra hints — except one hint per game
      hints.push({ type: result.direction === 'up' ? 'direction-up' : 'direction-down',
        label: 'DIRECTION', value: result.direction === 'up' ? '▲ HIGHER' : '▼ LOWER' });
      if (!state.hintRevealed && state.guessCount === 2) {
        state.hintRevealed = true;
        const answer = state._answer;
        const isFib = HintEngine.isFibonacci(answer);
        hints.push({ type: 'warning', label: 'ONE-TIME HINT',
          value: isFib ? 'FIBONACCI NUMBER' : answer % 2 === 0 ? 'EVEN' : 'ODD' });
      }
      return hints;
    },

    getGuessLimit(config, save) { return config.guesses + Math.floor(save.upgrades.extraGuesses); }
  },

  // ──────────────────────────────────────────────
  // BOSS MODE
  // ──────────────────────────────────────────────
  boss: {
    id: 'boss',
    name: 'BOSS',
    icon: '🐉',
    desc: 'Fight a boss. Deplete its HP by guessing close. It attacks you.',
    defaultConfig: { min: 1, max: 100, guesses: 8, hp: 3, timer: 60 },

    BOSSES: [
      { name: 'CORRUPTED COMPILER', hp: 10, attack: 1, attackEvery: 3, color: '#ff2244' },
      { name: 'PHANTOM PROCESS',    hp: 15, attack: 1, attackEvery: 2, color: '#bf5fff' },
      { name: 'VOID DAEMON',        hp: 20, attack: 2, attackEvery: 3, color: '#ff9500' },
      { name: 'QUANTUM LEVIATHAN',  hp: 25, attack: 2, attackEvery: 2, color: '#00d4ff' },
      { name: 'DOMINION FINAL',     hp: 40, attack: 3, attackEvery: 2, color: '#ffd700' }
    ],

    init(state) {
      const bossIndex = state.config.bossIndex || Math.floor(Math.random() * this.BOSSES.length);
      state.boss = Storage.deepClone ? Storage.deepClone(this.BOSSES[bossIndex]) : JSON.parse(JSON.stringify(this.BOSSES[bossIndex]));
      state.boss.maxHp = state.boss.hp;
      state.boss.turnCount = 0;
      state._answers_history = [state._answer];
      return state;
    },

    onGuess(state, guess) {
      const answer = state._answer;
      const dist = Math.abs(answer - guess);
      const range = state.config.max - state.config.min;
      state.boss.turnCount++;

      // Damage boss based on closeness
      let bossDamage = 0;
      if (guess === answer) {
        bossDamage = 3;
      } else if (dist <= range * 0.05) {
        bossDamage = 2;
      } else if (dist <= range * 0.15) {
        bossDamage = 1;
      }

      state.boss.hp = Math.max(0, state.boss.hp - bossDamage);

      // Boss attacks player periodically
      let playerDamage = 0;
      if (state.boss.turnCount % state.boss.attackEvery === 0 && state.boss.hp > 0) {
        playerDamage = state.boss.attack;
      }

      const bossDefeated = state.boss.hp <= 0;

      if (bossDefeated) {
        return { correct: true, bossDamage, playerDamage, bossDefeated: true };
      }

      if (guess === answer) {
        // New answer for boss encounter
        state._answer = HintEngine.generateAnswer(state.config.min, state.config.max, state.numberSystem);
        return { correct: false, continuous: true, bossDamage, playerDamage, newAnswer: true };
      }

      return {
        correct: false,
        direction: guess < answer ? 'up' : 'down',
        bossDamage, playerDamage, bossDefeated: false
      };
    },

    generateHints(state, guess, result) {
      const hints = [];
      const answer = state._answer;

      if (result.bossDamage > 0) {
        hints.push({ type: 'direction-up', label: 'BOSS HIT', value: `-${result.bossDamage} HP to boss` });
      }
      if (result.playerDamage > 0) {
        hints.push({ type: 'direction-down', label: 'BOSS ATTACK', value: `${state.boss.name} attacks! -${result.playerDamage} HP` });
      }

      if (!result.bossDefeated && !result.newAnswer) {
        hints.push({ type: result.direction === 'up' ? 'direction-up' : 'direction-down',
          label: 'DIRECTION', value: result.direction === 'up' ? '▲ HIGHER' : '▼ LOWER' });
        const dist = Math.abs(answer - guess);
        hints.push({ type: 'warning', label: 'BOSS HP', value: `${state.boss.hp}/${state.boss.maxHp}` });
        hints.push({ type: 'info', label: 'DISTANCE', value: `±${dist}` });
      }

      if (result.newAnswer) {
        hints.push({ type: 'info', label: 'BOSS', value: 'NEW TARGET ACQUIRED' });
      }

      return hints;
    },

    getGuessLimit(config, save) { return config.guesses + (save.upgrades.extraGuesses * 2); }
  }
};

// ── HINT ENGINE ───────────────────────────────────────────────
const HintEngine = (() => {
  function generateAnswer(min, max, system = 'decimal') {
    const n = Math.floor(Math.random() * (max - min + 1)) + min;
    return n;
  }

  function generateQuantumSet(min, max, count) {
    const set = [];
    while (set.length < count) {
      const n = generateAnswer(min, max);
      if (!set.includes(n)) set.push(n);
    }
    return set;
  }

  // Seeded random for daily challenge
  function seededRandom(seed) {
    let s = seed;
    return function() {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      return (s >>> 0) / 0xffffffff;
    };
  }

  function generateDailyAnswer(min, max, dateStr) {
    const seed = dateStr.split('-').reduce((a, b) => a * 31 + parseInt(b), 0);
    const rng = seededRandom(seed);
    return Math.floor(rng() * (max - min + 1)) + min;
  }

  function isPrime(n) {
    if (n < 2) return false;
    if (n === 2) return true;
    if (n % 2 === 0) return false;
    for (let i = 3; i <= Math.sqrt(n); i += 2) {
      if (n % i === 0) return false;
    }
    return true;
  }

  function isFibonacci(n) {
    const isPerfectSquare = (x) => {
      const s = Math.floor(Math.sqrt(x));
      return s * s === x;
    };
    return isPerfectSquare(5 * n * n + 4) || isPerfectSquare(5 * n * n - 4);
  }

  function digitSum(n) {
    return String(Math.abs(n)).split('').reduce((s, d) => s + parseInt(d), 0);
  }

  function toBase(n, base) {
    if (base === 2)   return n.toString(2);
    if (base === 16)  return n.toString(16).toUpperCase();
    return String(n);
  }

  function formatForSystem(n, system) {
    if (system === 'binary')  return `0b${n.toString(2)}`;
    if (system === 'hex')     return `0x${n.toString(16).toUpperCase()}`;
    return String(n);
  }

  function parseForSystem(str, system) {
    str = str.trim();
    if (system === 'binary')  return parseInt(str.replace('0b', ''), 2);
    if (system === 'hex')     return parseInt(str.replace('0x', ''), 16);
    return parseFloat(str);
  }

  function isValidInput(str, system, min, max) {
    str = str.trim();
    let n;
    if (system === 'binary') {
      if (!/^(0b)?[01]+$/i.test(str)) return { valid: false, error: 'Enter a binary number (e.g. 1010)' };
      n = parseInt(str.replace('0b', ''), 2);
    } else if (system === 'hex') {
      if (!/^(0x)?[0-9a-fA-F]+$/i.test(str)) return { valid: false, error: 'Enter a hex number (e.g. 1F)' };
      n = parseInt(str.replace('0x', ''), 16);
    } else {
      if (!/^-?\d+(\.\d+)?$/.test(str)) return { valid: false, error: 'Enter a valid number' };
      n = parseFloat(str);
    }
    if (isNaN(n)) return { valid: false, error: 'Invalid number' };
    return { valid: true, value: n };
  }

  return {
    generateAnswer, generateQuantumSet, seededRandom, generateDailyAnswer,
    isPrime, isFibonacci, digitSum, toBase, formatForSystem, parseForSystem, isValidInput
  };
})();

// Make available globally
window.MODES = MODES;
window.HintEngine = HintEngine;
