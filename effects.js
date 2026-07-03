/* effects.js — Particles, Screen Shake, Audio, Animations */
'use strict';

const Effects = (() => {
  // ── PARTICLE SYSTEM ──────────────────────────────────────────
  const pCanvas = document.getElementById('particle-canvas');
  const pCtx = pCanvas.getContext('2d');
  let particles = [];
  let pAnimFrame = null;

  function resizeParticleCanvas() {
    pCanvas.width = window.innerWidth;
    pCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeParticleCanvas);
  resizeParticleCanvas();

  function spawnParticles(x, y, count, color, options = {}) {
    const { spread = 120, speed = 3, size = 3, life = 60 } = options;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const vel = (Math.random() * speed) + 1;
      particles.push({
        x, y,
        vx: Math.cos(angle) * vel * (Math.random() * spread / 60),
        vy: Math.sin(angle) * vel * (Math.random() * spread / 60) - (Math.random() * 2),
        size: (Math.random() * size) + 1,
        color,
        alpha: 1,
        life,
        maxLife: life,
        gravity: options.gravity !== undefined ? options.gravity : 0.06
      });
    }
    if (!pAnimFrame) animateParticles();
  }

  function spawnTextParticle(x, y, text, color) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 2,
      vy: -(Math.random() * 3 + 1),
      size: 0,
      text,
      color,
      alpha: 1,
      life: 80,
      maxLife: 80,
      gravity: -0.02,
      isText: true
    });
    if (!pAnimFrame) animateParticles();
  }

  function animateParticles() {
    pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
    particles = particles.filter(p => p.alpha > 0.01 && p.life > 0);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.life--;
      p.alpha = p.life / p.maxLife;

      pCtx.globalAlpha = p.alpha;
      if (p.isText) {
        pCtx.font = `bold 18px 'Orbitron', monospace`;
        pCtx.fillStyle = p.color;
        pCtx.fillText(p.text, p.x, p.y);
      } else {
        pCtx.fillStyle = p.color;
        pCtx.shadowBlur = 8;
        pCtx.shadowColor = p.color;
        pCtx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
        pCtx.shadowBlur = 0;
      }
    }
    pCtx.globalAlpha = 1;

    if (particles.length > 0) {
      pAnimFrame = requestAnimationFrame(animateParticles);
    } else {
      pAnimFrame = null;
    }
  }

  // ── WIN / LOSE EFFECTS ────────────────────────────────────────
  function playWinEffect(x, y) {
    const cx = x || window.innerWidth / 2;
    const cy = y || window.innerHeight / 2;
    spawnParticles(cx, cy, 60, '#00d4ff', { spread: 200, speed: 6, size: 5, life: 80 });
    spawnParticles(cx, cy, 40, '#ffd700', { spread: 180, speed: 4, size: 4, life: 70 });
    spawnParticles(cx, cy, 30, '#00ff88', { spread: 160, speed: 5, size: 3, life: 65 });
    spawnTextParticle(cx - 30, cy - 30, '✓', '#00ff88');
    spawnTextParticle(cx + 10, cy - 10, '★', '#ffd700');
    if (window.SaveData?.settings?.screenShake) screenShake(6, 300);
    Audio.play('win');
  }

  function playLoseEffect(x, y) {
    const cx = x || window.innerWidth / 2;
    const cy = y || window.innerHeight / 2;
    spawnParticles(cx, cy, 40, '#ff2244', { spread: 150, speed: 4, size: 4, life: 60 });
    spawnParticles(cx, cy, 20, '#ff4d6d', { spread: 120, speed: 3, size: 3, life: 50 });
    if (window.SaveData?.settings?.screenShake) screenShake(10, 500);
    Audio.play('lose');
  }

  function playComboEffect(combo) {
    const colors = ['#00d4ff','#39ff14','#ffd700','#ff9500','#bf5fff'];
    const color = colors[Math.min(combo - 2, colors.length - 1)];
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    spawnParticles(cx, cy, 20 + combo * 5, color, { spread: 100, speed: 4, size: 3, life: 50 });
    spawnTextParticle(cx, cy - 60, `×${combo} COMBO!`, color);
    Audio.play('combo');
  }

  function playHintEffect() {
    const panel = document.getElementById('hint-panel');
    if (panel) {
      panel.style.boxShadow = '0 0 20px rgba(0,212,255,0.5)';
      setTimeout(() => { panel.style.boxShadow = ''; }, 400);
    }
  }

  function playCorrectGuessEffect() {
    const input = document.getElementById('guess-input');
    if (input) {
      input.style.borderColor = '#ffd700';
      input.style.boxShadow = '0 0 20px rgba(255,215,0,0.6)';
      setTimeout(() => {
        input.style.borderColor = '';
        input.style.boxShadow = '';
      }, 600);
    }
  }

  function playWrongGuessEffect() {
    const input = document.getElementById('guess-input');
    if (input) {
      input.classList.add('shake');
      input.style.borderColor = '#ff2244';
      setTimeout(() => {
        input.classList.remove('shake');
        input.style.borderColor = '';
      }, 500);
    }
    if (window.SaveData?.settings?.screenShake) screenShake(3, 200);
    Audio.play('wrong');
  }

  function playXPEffect(amount) {
    const bar = document.getElementById('xp-bar-inner');
    if (bar) {
      bar.style.filter = 'brightness(2)';
      setTimeout(() => { bar.style.filter = ''; }, 400);
    }
    const cx = window.innerWidth / 2;
    spawnTextParticle(cx, window.innerHeight - 80, `+${amount} XP`, '#00d4ff');
  }

  function playCoinEffect(amount) {
    const cx = window.innerWidth / 2;
    spawnTextParticle(cx + 30, window.innerHeight - 80, `+${amount} ⬡`, '#ffd700');
  }

  function playLevelUpEffect() {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    spawnParticles(cx, cy, 80, '#ffd700', { spread: 300, speed: 7, size: 5, life: 100 });
    spawnTextParticle(cx - 50, cy - 80, 'LEVEL UP!', '#ffd700');
    if (window.SaveData?.settings?.screenShake) screenShake(8, 600);
    Audio.play('levelup');
  }

  function playAchievementEffect() {
    const cx = window.innerWidth - 150;
    const cy = 120;
    spawnParticles(cx, cy, 30, '#ffd700', { spread: 80, speed: 3, size: 3, life: 50 });
    Audio.play('achievement');
  }

  function playPowerupEffect(type) {
    const colors = {
      revealDigit: '#bf5fff',
      extraGuess: '#39ff14',
      freezeTimer: '#00d4ff',
      shield: '#ffd700',
      undoGuess: '#ff9500',
      extraLife: '#ff4d6d',
      multiplierBoost: '#ff9500'
    };
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    spawnParticles(cx, cy, 25, colors[type] || '#ffffff', { spread: 100, speed: 4, size: 3, life: 45 });
    Audio.play('powerup');
  }

  // ── SCREEN SHAKE ─────────────────────────────────────────────
  let shakeHandle = null;
  function screenShake(intensity, duration) {
    if (!window.SaveData?.settings?.screenShake) return;
    const el = document.getElementById('screen-game');
    if (!el) return;
    if (shakeHandle) clearTimeout(shakeHandle);
    const start = Date.now();
    function frame() {
      const elapsed = Date.now() - start;
      if (elapsed >= duration) {
        el.style.transform = '';
        shakeHandle = null;
        return;
      }
      const progress = elapsed / duration;
      const amp = intensity * (1 - progress);
      const dx = (Math.random() - 0.5) * amp * 2;
      const dy = (Math.random() - 0.5) * amp * 2;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // ── BACKGROUND CANVAS ANIMATION ───────────────────────────────
  const bgCanvas = document.getElementById('bg-canvas');
  const bgCtx = bgCanvas.getContext('2d');

  let bgAnimFrame = null;
  let bgGrid = [];

  function initBackground() {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;

    // Init grid dots
    bgGrid = [];
    const spacing = 60;
    for (let x = 0; x < window.innerWidth + spacing; x += spacing) {
      for (let y = 0; y < window.innerHeight + spacing; y += spacing) {
        bgGrid.push({
          x, y,
          baseAlpha: Math.random() * 0.3,
          alpha: Math.random() * 0.3,
          phase: Math.random() * Math.PI * 2,
          speed: 0.005 + Math.random() * 0.01
        });
      }
    }

    if (!bgAnimFrame) animateBg();
  }

  window.addEventListener('resize', () => {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
    initBackground();
  });

  let bgTick = 0;
  function animateBg() {
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    bgTick += 0.01;

    // Background gradient
    const grad = bgCtx.createRadialGradient(
      bgCanvas.width/2, bgCanvas.height/2, 0,
      bgCanvas.width/2, bgCanvas.height/2, Math.max(bgCanvas.width, bgCanvas.height)
    );
    grad.addColorStop(0, '#060f1e');
    grad.addColorStop(1, '#030810');
    bgCtx.fillStyle = grad;
    bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

    // Moving scan line
    const scanY = ((bgTick * 40) % (bgCanvas.height + 40)) - 20;
    const scanGrad = bgCtx.createLinearGradient(0, scanY - 20, 0, scanY + 20);
    scanGrad.addColorStop(0, 'rgba(0,212,255,0)');
    scanGrad.addColorStop(0.5, 'rgba(0,212,255,0.03)');
    scanGrad.addColorStop(1, 'rgba(0,212,255,0)');
    bgCtx.fillStyle = scanGrad;
    bgCtx.fillRect(0, scanY - 20, bgCanvas.width, 40);

    // Grid dots
    for (const dot of bgGrid) {
      dot.alpha = dot.baseAlpha + Math.sin(bgTick * dot.speed * 100 + dot.phase) * 0.1;
      bgCtx.globalAlpha = Math.max(0, dot.alpha);
      bgCtx.fillStyle = '#1a3a5c';
      bgCtx.fillRect(dot.x - 1, dot.y - 1, 2, 2);
    }
    bgCtx.globalAlpha = 1;

    bgAnimFrame = requestAnimationFrame(animateBg);
  }

  initBackground();

  // ── AUDIO SYSTEM ─────────────────────────────────────────────
  const Audio = (() => {
    const ctx = (() => {
      try { return new (window.AudioContext || window.webkitAudioContext)(); }
      catch(e) { return null; }
    })();

    function play(type) {
      if (!ctx) return;
      if (!window.SaveData?.settings?.soundEnabled) return;
      // Resume if suspended (browser policy)
      if (ctx.state === 'suspended') ctx.resume();

      const configs = {
        click:       { freq: 440, duration: 0.05, type: 'square',   vol: 0.15 },
        wrong:       { freq: 180, duration: 0.2,  type: 'sawtooth', vol: 0.2  },
        win:         { freqs: [523, 659, 784, 1047], duration: 0.12, type: 'sine', vol: 0.25 },
        lose:        { freqs: [261, 220, 196, 147],  duration: 0.15, type: 'sawtooth', vol: 0.2 },
        hint:        { freq: 660, duration: 0.08, type: 'sine',     vol: 0.1  },
        combo:       { freq: 880, duration: 0.1,  type: 'square',   vol: 0.18 },
        powerup:     { freqs: [523, 659, 784], duration: 0.08, type: 'sine', vol: 0.2 },
        achievement: { freqs: [784, 1047, 1319, 1568], duration: 0.1, type: 'sine', vol: 0.25 },
        levelup:     { freqs: [523, 659, 784, 1047, 1319], duration: 0.1, type: 'sine', vol: 0.3 },
        tick:        { freq: 880, duration: 0.04, type: 'square',   vol: 0.08 },
        shield:      { freq: 330, duration: 0.15, type: 'triangle', vol: 0.15 }
      };

      const cfg = configs[type];
      if (!cfg) return;

      const now = ctx.currentTime;
      if (cfg.freqs) {
        cfg.freqs.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = cfg.type;
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(cfg.vol, now + i * cfg.duration);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * cfg.duration + cfg.duration);
          osc.start(now + i * cfg.duration);
          osc.stop(now + i * cfg.duration + cfg.duration + 0.01);
        });
      } else {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = cfg.type;
        osc.frequency.value = cfg.freq;
        gain.gain.setValueAtTime(cfg.vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + cfg.duration);
        osc.start(now);
        osc.stop(now + cfg.duration + 0.01);
      }
    }

    return { play };
  })();

  // ── TRANSITION ────────────────────────────────────────────────
  function screenTransition(fromEl, toEl, callback) {
    if (!fromEl || !toEl) { callback && callback(); return; }
    fromEl.style.transition = 'opacity 0.2s, transform 0.2s';
    fromEl.style.opacity = '0';
    fromEl.style.transform = 'scale(0.98)';
    setTimeout(() => {
      fromEl.classList.remove('active');
      fromEl.style.opacity = '';
      fromEl.style.transform = '';
      fromEl.style.transition = '';
      toEl.classList.add('active');
      toEl.style.opacity = '0';
      toEl.style.transform = 'scale(1.02)';
      toEl.style.transition = 'opacity 0.2s, transform 0.2s';
      requestAnimationFrame(() => {
        toEl.style.opacity = '1';
        toEl.style.transform = 'scale(1)';
        setTimeout(() => {
          toEl.style.opacity = '';
          toEl.style.transform = '';
          toEl.style.transition = '';
          callback && callback();
        }, 200);
      });
    }, 200);
  }

  return {
    spawnParticles, spawnTextParticle,
    playWinEffect, playLoseEffect, playComboEffect, playHintEffect,
    playCorrectGuessEffect, playWrongGuessEffect, playXPEffect, playCoinEffect,
    playLevelUpEffect, playAchievementEffect, playPowerupEffect,
    screenShake, screenTransition,
    Audio
  };
})();
