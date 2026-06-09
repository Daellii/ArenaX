const canvas = document.getElementById("arena");
const ctx = canvas.getContext("2d");

canvas.width = 1200;
canvas.height = 600;
ctx.imageSmoothingEnabled = true;

const W = canvas.width;
const H = canvas.height;
const GROUND_Y = 520;

const fighterNames = [
  "CHAD",
  "PEPE",
  "MOONKING",
  "WOJAK",
  "GOBLIN",
  "HODL"
];

const keys = {};
let player = null;
let enemy = null;
let gameStarted = false;
let roundTime = 60;
let lastTs = 0;
let assetsReady = null;

const imageCache = {};
const backgroundSrc = "arena_background.png";

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ src, img });
    img.onerror = () => resolve({ src, img: null });
    img.src = src;
  });
}

function frames(folder, base, count) {
  return Array.from({ length: count }, (_, i) => `${folder}/${base}_${i + 1}.png`);
}

function staticFighter(name, portrait, opts = {}) {
  const img = portrait || `${name.toLowerCase()}.png`;
  return {
    display: opts.display || name,
    portrait: img,
    hp: opts.hp || 100,
    speed: opts.speed || 240,
    w: opts.w || 170,
    h: opts.h || 170,
    anims: {
      idle: [img],
      walk: [img],
      punch: [img],
      kick: [img],
      special: [img],
      hit: [img],
      ko: [img]
    }
  };
}

const fighters = {
  CHAD: {
    display: "CHAD",
    portrait: "chad.png",
    hp: 120,
    speed: 255,
    w: 185,
    h: 185,
    anims: {
      idle: frames("sprites/chad", "chad_idle", 4),
      walk: frames("sprites/chad", "chad_walk", 4),
      punch: frames("sprites/chad", "chad_punch", 2),
      kick: frames("sprites/chad", "chad_kick", 2),
      special: frames("sprites/chad", "chad_kick", 2),
      hit: frames("sprites/chad", "chad_hit", 2),
      ko: frames("sprites/chad", "chad_ko", 2)
    }
  },
  PEPE: {
    display: "PEPE",
    portrait: "pepe.png",
    hp: 100,
    speed: 280,
    w: 175,
    h: 175,
    anims: {
      idle: frames("sprites/pepe", "pepe_idle", 4),
      walk: frames("sprites/pepe", "pepe_walk", 4),
      punch: frames("sprites/pepe", "pepe_punch", 2),
      kick: frames("sprites/pepe", "pepe_kick", 2),
      special: frames("sprites/pepe", "pepe_kick", 2),
      hit: frames("sprites/pepe", "pepe_hit", 2),
      ko: frames("sprites/pepe", "pepe_ko", 4)
    }
  },
  MOONKING: staticFighter("MOONKING", "moonking.png", {
    display: "MOON KING",
    hp: 110,
    speed: 220,
    w: 165,
    h: 165
  }),
  WOJAK: staticFighter("WOJAK", "wojak.png", {
    display: "WOJAK",
    hp: 105,
    speed: 225,
    w: 155,
    h: 155
  }),
  GOBLIN: staticFighter("GOBLIN", "goblin.png", {
    display: "GOBLIN",
    hp: 95,
    speed: 240,
    w: 170,
    h: 170
  }),
  HODL: staticFighter("HODL", "hodl.png", {
    display: "HODL",
    hp: 115,
    speed: 215,
    w: 160,
    h: 160
  })
};

const animDefs = {
  idle: { fps: 6, loop: true },
  walk: { fps: 8, loop: true },
  punch: { fps: 12, loop: false },
  kick: { fps: 12, loop: false },
  special: { fps: 10, loop: false },
  hit: { fps: 14, loop: false },
  ko: { fps: 6, loop: false }
};

function ensureOverlayStyles() {
  const style = document.createElement("style");
  style.textContent = `
    #vsScreen,
    #countdown,
    #winnerScreen {
      position: fixed;
      inset: 0;
      z-index: 999;
      display: none;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, .92);
      color: white;
    }

    #vsScreen {
      gap: 50px;
      text-align: center;
      font-weight: bold;
    }

    #vsScreen .fighterCard {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    #vsScreen img {
      width: 220px;
      height: 220px;
      object-fit: contain;
      filter: drop-shadow(0 0 25px rgba(141, 76, 255, .35));
    }

    #vsScreen .vsWord {
      font-size: 7rem;
      color: #d8a8ff;
      text-shadow: 0 0 30px #8d4cff;
    }

    #countdown {
      font-size: 9rem;
      font-weight: bold;
      text-shadow: 0 0 40px #8d4cff;
    }

    #winnerScreen {
      flex-direction: column;
      gap: 18px;
      text-align: center;
    }

    #winnerScreen h1 {
      font-size: 4.5rem;
      margin: 0;
      text-shadow: 0 0 25px #8d4cff;
    }

    #winnerScreen .winnerButtons {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      justify-content: center;
    }

    #winnerScreen .playBtn {
      padding: 15px 25px;
      font-size: 18px;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      background: #8d4cff;
      color: white;
    }
  `;
  document.head.appendChild(style);
}

function ensureOverlays() {
  if (!document.getElementById("vsScreen")) {
    const vs = document.createElement("div");
    vs.id = "vsScreen";
    document.body.appendChild(vs);
  }

  if (!document.getElementById("countdown")) {
    const cd = document.createElement("div");
    cd.id = "countdown";
    document.body.appendChild(cd);
  }

  if (!document.getElementById("winnerScreen")) {
    const win = document.createElement("div");
    win.id = "winnerScreen";
    document.body.appendChild(win);
  }
}

function prettyName(name) {
  if (name === "MOONKING") return "MOON KING";
  return name;
}

function portraitFor(name) {
  return fighters[name]?.portrait || `${name.toLowerCase()}.png`;
}

function getAnimFrames(name, state) {
  const def = fighters[name];
  if (!def) return [];
  return def.anims[state] || def.anims.idle || [def.portrait];
}

function getFrameImage(path) {
  return imageCache[path] || null;
}

async function preloadAssets() {
  const sources = new Set([backgroundSrc]);

  Object.values(fighters).forEach((f) => {
    sources.add(f.portrait);
    Object.values(f.anims).forEach((arr) => {
      arr.forEach((src) => sources.add(src));
    });
  });

  const loaded = await Promise.all([...sources].map(loadImage));
  loaded.forEach(({ src, img }) => {
    imageCache[src] = img;
  });
}

function createFighter(name, side) {
  const def = fighters[name];
  const isPlayer = side === "left";

  return {
    name,
    display: def.display,
    side,
    x: isPlayer ? 120 : 900,
    y: 330,
    w: def.w,
    h: def.h,
    hp: def.hp,
    maxHp: def.hp,
    speed: def.speed,
    state: "idle",
    frame: 0,
    animClock: 0,
    stateEnd: 0,
    flashUntil: 0,
    nextAttackAt: 0,
    frozen: false
  };
}

function setState(f, state) {
  if (f.state !== state) {
    f.state = state;
    f.frame = 0;
    f.animClock = 0;
  }
}

function isBusy(f) {
  return ["punch", "kick", "special", "hit", "ko"].includes(f.state);
}

function clampFighter(f) {
  f.x = Math.max(20, Math.min(W - f.w - 20, f.x));
}

function updateBars() {
  const playerBar = document.getElementById("playerHP");
  const enemyBar = document.getElementById("enemyHP");

  if (playerBar && player) {
    playerBar.style.width = `${Math.max(0, (player.hp / player.maxHp) * 100)}%`;
  }

  if (enemyBar && enemy) {
    enemyBar.style.width = `${Math.max(0, (enemy.hp / enemy.maxHp) * 100)}%`;
  }
}

function showVS(playerName, enemyName) {
  return new Promise((resolve) => {
    const vs = document.getElementById("vsScreen");

    vs.innerHTML = `
      <div class="fighterCard">
        <img src="${portraitFor(playerName)}" alt="${playerName}">
        <div>${prettyName(playerName)}</div>
      </div>
      <div class="vsWord">VS</div>
      <div class="fighterCard">
        <img src="${portraitFor(enemyName)}" alt="${enemyName}">
        <div>${prettyName(enemyName)}</div>
      </div>
    `;

    vs.style.display = "flex";

    setTimeout(() => {
      vs.style.display = "none";
      resolve();
    }, 2200);
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function startCountdown() {
  const cd = document.getElementById("countdown");
  const seq = ["3", "2", "1", "FIGHT!"];

  cd.style.display = "flex";

  for (const item of seq) {
    cd.textContent = item;
    await wait(item === "FIGHT!" ? 650 : 800);
  }

  cd.style.display = "none";
}

function showWinner(name) {
  const screen = document.getElementById("winnerScreen");
  const title = name === "DRAW" ? "DRAW!" : `🏆 ${prettyName(name)} WINS 🏆`;

  screen.innerHTML = `
    <h1>${title}</h1>
    <div class="winnerButtons">
      <button class="playBtn" onclick="location.reload()">PLAY AGAIN</button>
      <button class="playBtn" onclick="location.href='index.html'">BACK TO ARENAX</button>
    </div>
  `;

  screen.style.display = "flex";
}

function endMatch(winnerName) {
  gameStarted = false;
  if (player && player.state !== "ko") setState(player, "ko");
  if (enemy && enemy.state !== "ko") setState(enemy, "ko");
  setTimeout(() => showWinner(winnerName), 650);
}

function applyDamage(target, damage, attacker) {
  if (!gameStarted || target.hp <= 0) return;

  target.hp -= damage;
  if (target.hp < 0) target.hp = 0;

  target.flashUntil = performance.now() + 120;
  setState(target, "hit");
  target.stateEnd = performance.now() + 160;

  if (attacker === player && target === enemy) {
    target.x += 18;
  } else if (attacker === enemy && target === player) {
    target.x -= 18;
  }

  clampFighter(target);
  updateBars();

  if (target.hp <= 0) {
    setState(target, "ko");
    endMatch(attacker.name);
  }
}

function triggerAttack(attacker, defender, type) {
  if (!gameStarted || isBusy(attacker) || attacker.hp <= 0) return;

  const now = performance.now();
  let damage = 0;
  let impact = 180;
  let lockMs = 360;

  if (type === "punch") {
    damage = 12;
    impact = 140;
    lockMs = 320;
  } else if (type === "kick") {
    damage = 20;
    impact = 180;
    lockMs = 420;
  } else if (type === "special") {
    damage = 35;
    impact = 220;
    lockMs = 560;
  }

  setState(attacker, type);
  attacker.stateEnd = now + lockMs;

  setTimeout(() => {
    if (!gameStarted || attacker.hp <= 0 || defender.hp <= 0) return;
    const dist = Math.abs((attacker.x + attacker.w * 0.5) - (defender.x + defender.w * 0.5));
    if (dist < 190) {
      applyDamage(defender, damage, attacker);
    }
  }, impact);
}

function enemyAI(now, dt) {
  if (!gameStarted || enemy.hp <= 0 || player.hp <= 0) return;
  if (isBusy(enemy)) return;

  const dist = (player.x + player.w * 0.5) - (enemy.x + enemy.w * 0.5);
  const abs = Math.abs(dist);

  if (abs > 175) {
    enemy.x += Math.sign(dist) * enemy.speed * dt;
    setState(enemy, "walk");
  } else {
    setState(enemy, "idle");
    if (now >= enemy.nextAttackAt) {
      const roll = Math.random();
      if (roll < 0.55) {
        triggerAttack(enemy, player, "punch");
      } else if (roll < 0.85) {
        triggerAttack(enemy, player, "kick");
      } else {
        triggerAttack(enemy, player, "special");
      }
      enemy.nextAttackAt = now + 850 + Math.random() * 650;
    }
  }

  clampFighter(enemy);
}

function updateAnimation(entity, dt) {
  const framesList = getAnimFrames(entity.name, entity.state);
  const anim = animDefs[entity.state] || animDefs.idle;

  entity.animClock += dt;
  const frameTime = 1 / anim.fps;

  while (entity.animClock >= frameTime) {
    entity.animClock -= frameTime;
    entity.frame += 1;

    if (entity.frame >= framesList.length) {
      if (anim.loop) {
        entity.frame = 0;
      } else {
        entity.frame = framesList.length - 1;
        break;
      }
    }
  }

  if (entity.state !== "ko" && (entity.state === "punch" || entity.state === "kick" || entity.state === "special" || entity.state === "hit")) {
    if (performance.now() >= entity.stateEnd) {
      const moving = entity === player
        ? (keys["a"] || keys["d"])
        : false;

      if (!isBusy(entity) || entity.state === "hit") {
        setState(entity, moving ? "walk" : "idle");
      }
    }
  }
}

function drawStage() {
  if (imageCache[backgroundSrc]) {
    ctx.drawImage(imageCache[backgroundSrc], 0, 0, W, H);
  } else {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#1b1430");
    grad.addColorStop(1, "#0a0811");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  ctx.fillStyle = "rgba(0,0,0,.22)";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(141,76,255,.16)";
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

  ctx.strokeStyle = "rgba(141,76,255,.8)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(W, GROUND_Y);
  ctx.stroke();

  ctx.fillStyle = "white";
  ctx.font = "bold 22px Arial";
  ctx.textAlign = "center";
  ctx.fillText("ROUND 1", W / 2, 28);

  ctx.font = "bold 68px Arial";
  ctx.fillText(String(Math.max(0, Math.ceil(roundTime))), W / 2, 86);
}

function drawFighter(entity, opponent) {
  const framesList = getAnimFrames(entity.name, entity.state);
  const frameSrc = framesList[Math.min(entity.frame, framesList.length - 1)] || entity.portrait;
  const img = getFrameImage(frameSrc) || getFrameImage(entity.portrait);

  const facing = entity.x <= opponent.x ? 1 : -1;
  const drawW = entity.w;
  const drawH = entity.h;

  ctx.save();
  ctx.translate(entity.x + drawW / 2, entity.y + drawH / 2);
  ctx.scale(facing, 1);

  if (performance.now() < entity.flashUntil) {
    ctx.shadowColor = "rgba(255,255,255,.95)";
    ctx.shadowBlur = 22;
  } else {
    ctx.shadowColor = "rgba(141,76,255,.4)";
    ctx.shadowBlur = 16;
  }

  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
  } else {
    ctx.fillStyle = "#cccccc";
    ctx.fillRect(-drawW / 2, -drawH / 2, drawW, drawH);
  }

  ctx.restore();

  ctx.fillStyle = "white";
  ctx.font = "bold 24px Arial";
  ctx.textAlign = "center";
  ctx.fillText(prettyName(entity.name), entity.x + drawW / 2, entity.y - 12);
}

function update(dt, now) {
  if (!player || !enemy || !gameStarted) return;

  roundTime -= dt;
  if (roundTime <= 0) {
    roundTime = 0;
    const result =
      player.hp > enemy.hp ? player.name :
      enemy.hp > player.hp ? enemy.name :
      "DRAW";
    endMatch(result);
    return;
  }

  if (!isBusy(player)) {
    const movingLeft = !!keys["a"];
    const movingRight = !!keys["d"];

    if (movingLeft) {
      player.x -= player.speed * dt;
      if (player.state !== "walk") setState(player, "walk");
    } else if (movingRight) {
      player.x += player.speed * dt;
      if (player.state !== "walk") setState(player, "walk");
    } else {
      if (player.state !== "idle") setState(player, "idle");
    }
  }

  clampFighter(player);
  enemyAI(now, dt);

  updateAnimation(player, dt);
  updateAnimation(enemy, dt);
}

function render(now) {
  ctx.clearRect(0, 0, W, H);
  drawStage();

  drawFighter(player, enemy);
  drawFighter(enemy, player);

  ctx.fillStyle = "white";
  ctx.font = "bold 18px Arial";
  ctx.textAlign = "left";
  ctx.fillText("A/D = MOVE", 20, H - 18);
  ctx.fillText("J = PUNCH", 160, H - 18);
  ctx.fillText("K = KICK", 300, H - 18);
  ctx.fillText("L = SPECIAL", 420, H - 18);
}

function loop(ts) {
  if (!gameStarted) return;

  const now = ts || performance.now();
  const dt = lastTs ? Math.min(0.033, (now - lastTs) / 1000) : 0.016;
  lastTs = now;

  update(dt, now);
  render(now);

  if (gameStarted) {
    requestAnimationFrame(loop);
  }
}

async function startGame(name) {
  if (!fighters[name]) return;

  await assetsReady;

  document.getElementById("menu").style.display = "none";
  document.getElementById("game").style.display = "block";

  const possibleEnemies = fighterNames.filter((f) => f !== name);
  const randomEnemy = possibleEnemies[Math.floor(Math.random() * possibleEnemies.length)];

  player = createFighter(name, "left");
  enemy = createFighter(randomEnemy, "right");

  player.y = 330;
  enemy.y = 330;

  player.state = "idle";
  enemy.state = "idle";
  player.frame = 0;
  enemy.frame = 0;
  player.animClock = 0;
  enemy.animClock = 0;

  roundTime = 60;
  gameStarted = false;
  lastTs = 0;

  updateBars();

  await showVS(player.name, enemy.name);
  await startCountdown();

  gameStarted = true;
  lastTs = performance.now();
  requestAnimationFrame(loop);
}

document.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;

  if (!gameStarted || !player || !enemy) return;

  const key = e.key.toLowerCase();

  if (key === "j") {
    triggerAttack(player, enemy, "punch");
  } else if (key === "k") {
    triggerAttack(player, enemy, "kick");
  } else if (key === "l") {
    triggerAttack(player, enemy, "special");
  }
});

document.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

ensureOverlayStyles();
ensureOverlays();

assetsReady = preloadAssets();
updateBars();
