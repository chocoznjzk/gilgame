// app.js

// ===== DOM =====
const startScreen = document.querySelector("#startScreen");
const gameScreen  = document.querySelector("#gameScreen");
const gameApp = document.querySelector("#gameApp");
const startBtn = document.querySelector("#startBtn");

const drawBtn = document.querySelector("#drawBtn");
const restartBtn = document.querySelector("#restartBtn");
const historyList = document.querySelector("#historyList");
const stageEl = document.querySelector("#stage");

const overlayEl = document.querySelector("#overlay");
const overlayMediaEl = document.querySelector("#overlayMedia");

if (!drawBtn || !restartBtn) throw new Error("drawBtn/restartBtn를 index.html에 넣어주세요.");

// 슬롯 3개
const slots = [1, 2, 3].map((n) => {
  const el = document.querySelector(`#slot-${n}`);
  return {
    el,
    capImgEl: el.querySelector("[data-cap-img]"),
    contentEl: el.querySelector("[data-content]"),
    charImgEl: el.querySelector("[data-char-img]"),
    gradeEl: el.querySelector("[data-grade]"),
    nameEl: el.querySelector("[data-name]"),
    lineEl: el.querySelector("[data-line]"),
    typeEl: el.querySelector("[data-type]"), 
    descEl: el.querySelector("[data-desc]"), 
  };
});

// ===== State =====
const state = {
  isAnimating: false,
  isEnded: false,
  drawCount: 0,
  noBlackStreak: 0,
  isBlackRun: false,

  // SPECIAL 관련
  hasSpecialThisRun: false,
  specialSlotIndex: -1,

  lastDrawItems: [],
  opened: [false, false, false],
  history: [], // {id,name,capImg}
};

// ===== Config =====
const BROKEN_CAP_IMG = "./assets/caps/broken.png";
const SEALED_PLACEHOLDER = "./assets/caps/sealed.png";

const BLACK_BASE_PROB = 0.1; // 10%
const BLACK_STEP_PROB = 0.01;
const BLACK_MAX_PROB = 0.3;

const REVEAL_DELAY_MS = 450;
const OVERLAY_MS = 3000;

// 블랙 회차에 특수 SSR이 따라올 확률
const SPECIAL_SSR_BOOST_PROB = 0.20;

// ===== Utils =====
function withSubjectParticle(name) {
  const last = name.charCodeAt(name.length - 1);
  const hasJong = (last - 0xac00) % 28 !== 0;
  return name + (hasJong ? "이" : "가");
}

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function getPool() {
  const pool = window.GACHA_POOL || [];
  if (!pool.length) throw new Error("GACHA_POOL이 비어있어요. pool.js 로드 확인!");
  return pool;
}

function isBlack(item) {
  return item && item.grade === "?" && item.special === "BLACK";
}
function isSpecialSSR(item) {
  return item && item.grade === "SSR" && (item.special === "DELAY_BREAK" || item.special === "LAST_LINE");
}
function isSpecial(item) {
  return item && item.grade === "SPECIAL";
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function pickFromPool(filterFn) {
  const pool = getPool().filter(filterFn);
  if (!pool.length) throw new Error("조건에 맞는 pool 항목이 없어요. pool.js 확인!");
  return pickRandom(pool);
}

function pickNonBlack() {
  return pickFromPool((it) => !isBlack(it));
}
function pickBlack() {
  return pickFromPool((it) => isBlack(it));
}
function pickHidden() {
  return pickFromPool(it => it.grade === "HIDDEN");
}
function pickSpecialSSR() {
  return pickFromPool((it) => it.grade === "SSR" && it.special && it.special !== "BLACK");
}
function pickSpecial() {
  const pool = getPool().filter((it) => it.grade === "SPECIAL");
  if (!pool.length) return null;
  return pickRandom(pool);
}

function computeBlackProb() {
  const p = BLACK_BASE_PROB + state.noBlackStreak * BLACK_STEP_PROB;
  return Math.min(BLACK_MAX_PROB, p);
}

// ===== Special Guard Notice (Toast) =====
const GUARD_NOTICE_MS = 2500;

function getRandomSpecialFromHistory() {
  const pool = getPool();
  const specials = state.history
    .map(h => pool.find(p => p.id === h.id))
    .filter(it => it && it.grade === "SPECIAL");

  if (!specials.length) return null;
  return specials[Math.floor(Math.random() * specials.length)];
}

// (선택) 기존 HTML 기반 guardNotice를 쓰고 싶다면 유지
function showGuardNotice() {
  const guard = getRandomSpecialFromHistory();
  if (!guard) return;

  const el = document.querySelector("#guardNotice");
  const img = document.querySelector("#guardImg");
  const name = document.querySelector("#guardName");
  const msg = document.querySelector("#guardMsg");

  if (!el || !img || !name || !msg) return;

  img.src = guard.charImg;
  img.alt = guard.name;
  name.textContent = guard.name;
  msg.textContent = `${withSubjectParticle(guard.name)} MTJ로부터 당신을 지켜주었어요!`;
  el.classList.remove("hidden");
}

// JS 생성형 토스트 (항상 동작하는 버전)
function ensureGuardNoticeEl() {
  let el = document.querySelector("#guardNotice");

  // ✅ 기존 #guardNotice가 있어도, 우리가 필요한 내부구조가 없으면 "깨진 요소"로 보고 재생성
  const isBroken =
    !el ||
    !el.querySelector?.("[data-guard-img]") ||
    !el.querySelector?.("[data-guard-title]");

  if (isBroken) {
    if (el) el.remove();

    el = document.createElement("div");
    el.id = "guardNotice";
    el.className = "guard-notice hidden";
    el.innerHTML = `
      <div class="guard-card vertical">
        <div class="guard-thumb large">
          <img data-guard-img alt="SPECIAL" />
        </div>
        <div class="guard-title" data-guard-title></div>
        <div class="guard-sub">스페셜 카드가 당신을 지켜주었어요!</div>
      </div>
    `;
    document.body.appendChild(el);

    // ✅ 스타일 중복 삽입 방지
    if (!document.querySelector("#guardNoticeStyle")) {
      const style = document.createElement("style");
      style.id = "guardNoticeStyle";
      style.textContent = `
        .guard-notice.hidden{display:none;}
        .guard-notice{
          position:fixed;
          top:14%;
          left:50%;
          transform:translate(-50%, 0);
          z-index:999999;
          pointer-events:none;
          max-width:min(320px, calc(100vw - 24px));
          width:max-content;
        }
        .guard-card{
          background:rgba(255,255,255,.94);
          border:1px solid rgba(0,0,0,.08);
          border-radius:18px;
          box-shadow:0 12px 36px rgba(0,0,0,.14);
          backdrop-filter: blur(6px);
          padding:18px 20px 16px;
          text-align:center;
          min-width:240px;
        }
        .guard-card.vertical{
          display:flex;
          flex-direction:column;
          align-items:center;
          gap:10px;
        }
        .guard-thumb.large{
          width:96px;
          height:96px;
          border-radius:20px;
          overflow:hidden;
          background:rgba(0,0,0,.04);
          display:flex;
          align-items:center;
          justify-content:center;
          box-shadow: inset 0 0 0 1px rgba(0,0,0,.06);
        }
        .guard-thumb.large img{
          width:100%;
          height:100%;
          object-fit:cover;
        }
        .guard-title{
          font-weight:700;
          font-size:15px;
          color:#111;
          margin-top:2px;
        }
        .guard-sub{
          font-size:13px;
          color:#444;
          opacity:.9;
          line-height:1.4;
        }
      `;
      document.head.appendChild(style);
    }
  }

  return el;
}


async function showSpecialGuardNotice(specialItem, ms = GUARD_NOTICE_MS) {
  if (!specialItem) return;

  const el = ensureGuardNoticeEl();
  const imgEl = el.querySelector("[data-guard-img]");
  const titleEl = el.querySelector("[data-guard-title]");

  titleEl.textContent = specialItem.name || "SPECIAL";
  imgEl.src = specialItem.charImg || specialItem.capImg || "";
  imgEl.alt = specialItem.name || "SPECIAL";

  el.classList.remove("hidden");
  await sleep(ms);
  el.classList.add("hidden");
}

// ===== UI =====
function setGameOverUI(on) {
  document.body.classList.toggle("is-gameover", on);
}

function setOverlayVisible(visible, blackItem) {
  if (visible) {
    overlayEl.classList.remove("hidden");
    overlayEl.setAttribute("aria-hidden", "false");
    overlayMediaEl.innerHTML = "";

    if (blackItem?.charImg) {
      const src = blackItem.charImg;
      if (src.endsWith(".mp4") || src.endsWith(".webm")) {
        const v = document.createElement("video");
        v.src = src;
        v.autoplay = true;
        v.loop = true;
        v.muted = true;
        v.playsInline = true;
        overlayMediaEl.appendChild(v);
      } else {
        const img = document.createElement("img");
        img.src = src;
        img.alt = "BLACK";
        overlayMediaEl.appendChild(img);
      }
    }
  } else {
    overlayEl.classList.add("hidden");
    overlayEl.setAttribute("aria-hidden", "true");
    overlayMediaEl.innerHTML = "";
  }
}

// sealed(겉모습만)
function setSlotSealed(i, capImgSrc) {
  const s = slots[i];
  s.el.dataset.state = "sealed";
  s.capImgEl.src = capImgSrc || SEALED_PLACEHOLDER;

  // sealed에서는 무조건 내용 숨김
  s.contentEl.classList.add("hidden");

  s.charImgEl.src = "";
  s.charImgEl.alt = "";
  s.gradeEl.textContent = "—";
  s.nameEl.textContent = "대기중";
  s.lineEl.textContent = "캡슐을 눌러 오픈";
  if (s.typeEl) s.typeEl.textContent = "";
  if (s.descEl) s.descEl.textContent = "";

}

// opened
function setSlotOpened(i, item, context = { blackTriggered: false }) {
  const s = slots[i];
  s.el.dataset.state = "opened";
  s.contentEl.classList.remove("hidden");

  s.gradeEl.textContent = item.grade;
  s.gradeEl.setAttribute("data-grade", item.grade);
  s.nameEl.textContent = item.name;
  if (s.typeEl) s.typeEl.textContent = item.type || "";

  const line =
    (context.blackTriggered && item.blackLine) ? item.blackLine :
    (item.normalLine ? item.normalLine : (item.line || ""));

  s.lineEl.textContent = line ? `"${line}"` : "";

  if (item.charImg && !isBlack(item)) {
    s.charImgEl.src = item.charImg;
    s.charImgEl.alt = item.name;
  } else {
    s.charImgEl.src = "";
    s.charImgEl.alt = "";
  }
  if (s.descEl) s.descEl.textContent = item.desc || "";
}

function clearTypewriter(el) {
  if (!el) return;
  if (el._twTimer) {
    clearInterval(el._twTimer);
    el._twTimer = null;
  }
  const cursor = el.querySelector?.(".tw-cursor");
  if (cursor) cursor.remove();
}

function typewriterWithCursor(el, text, speed = 120) {
  if (!el) return;

  clearTypewriter(el);

  el.innerHTML = "";
  const span = document.createElement("span");
  const cursor = document.createElement("span");
  cursor.className = "tw-cursor";
  cursor.textContent = "|";

  el.appendChild(span);
  el.appendChild(cursor);

  let i = 0;
  el._twTimer = setInterval(() => {
    i += 1;
    span.textContent = text.slice(0, i);

    if (i >= text.length) {
      clearInterval(el._twTimer);
      el._twTimer = null;
      cursor.remove();
    }
  }, speed);
}

// 전체 슬롯 초기화
function resetAllSlots() {
  stageEl.classList.remove("ending");
  stageEl.classList.remove("hide-broken");

  for (let i = 0; i < 3; i++) {
    const s = slots[i];

    s.el.style.pointerEvents = "";
    s.el.style.removeProperty("pointer-events");

    s.el.classList.remove("keep-content", "summary", "summary-fade", "summary-stay", "fade-out");

    s.el.dataset.state = "sealed";
    s.el.removeAttribute("data-state");

    setSlotSealed(i, SEALED_PLACEHOLDER);
  }
}

// ===== History =====
function renderHistory() {
  historyList.innerHTML = "";

  if (state.history.length === 0) {
    const empty = document.createElement("span");
    empty.className = "history-empty";
    empty.textContent = "아직 기록이 없습니다.";
    historyList.appendChild(empty);
    return;
  }

  for (const h of state.history.slice().reverse()) {
    const row = document.createElement("div");
    row.className = "history-item";

    const img = document.createElement("img");
    img.src = h.capImg || SEALED_PLACEHOLDER;
    img.alt = h.name;

    const name = document.createElement("div");
    name.className = "hn";
    name.textContent = h.name;

    row.appendChild(img);
    row.appendChild(name);
    historyList.appendChild(row);
  }
}

// ===== Pick logic =====
function pickForSlot(slotIndex) {
  // 회차당 1장만 SPECIAL
  if (slotIndex === state.specialSlotIndex) {
    const sp = pickSpecial();
    if (sp) return sp;

    state.hasSpecialThisRun = false;
    state.specialSlotIndex = -1;
  }

  // 3번째 슬롯: 블랙 회차면 블랙, 아니면 블랙 금지
  if (slotIndex === 2) {
    if (state.isBlackRun) return pickBlack();
    return pickNonBlack();
  }

  // 1~2번째 슬롯: 블랙 절대 금지
  // 블랙 회차면 특수 SSR 부스트
  if (state.isBlackRun && Math.random() < SPECIAL_SSR_BOOST_PROB) {
    return pickSpecialSSR();
  }

  return pickNonBlack();
}

// ===== Main: Draw =====
async function handleDraw() {
  if (state.isAnimating || state.isEnded) return;
  state.isAnimating = true;

  drawBtn.disabled = true;
  restartBtn.disabled = true;

  try {
    // 새 회차 시작
    state.opened = [false, false, false];
    state.lastDrawItems = [];

    // SPECIAL(5%)
    state.hasSpecialThisRun = Math.random() < 0.05;
    state.specialSlotIndex = state.hasSpecialThisRun ? (Math.random() < 0.5 ? 0 : 1) : -1;

    // 이번 회차 블랙인지
    state.isBlackRun = false;

    // 첫 회차 보호
    if (state.drawCount !== 0) {
      const pBlack = computeBlackProb();
      state.isBlackRun = Math.random() < pBlack;
    }

    // placeholder
    for (let i = 0; i < 3; i++) {
      slots[i].el.classList.remove("keep-content");
      setSlotSealed(i, SEALED_PLACEHOLDER);
    }

    // 3개 뽑고 겉모습만 표시
    for (let i = 0; i < 3; i++) {
      const item = pickForSlot(i);
      state.lastDrawItems.push(item);
      setSlotSealed(i, item.capImg || SEALED_PLACEHOLDER);
      await sleep(REVEAL_DELAY_MS);
    }

    if (!state.isBlackRun) state.noBlackStreak += 1;
    state.drawCount += 1;

    // 오픈 단계
    drawBtn.disabled = true;
    restartBtn.disabled = false;
  } catch (err) {
    console.error(err);
    drawBtn.disabled = false;
    restartBtn.disabled = false;
    resetAllSlots();
  } finally {
    state.isAnimating = false;
  }
}

// ===== Slot open handler =====
async function openSlot(index) {
  if (state.isAnimating || state.isEnded) return;
  if (!state.lastDrawItems.length) return;
  if (state.opened[index]) return;
  if (slots[index].el.dataset.state === "broken") return;

  const item = state.lastDrawItems[index];
  state.opened[index] = true;

  const blackTriggered = isBlack(item);

  setSlotOpened(index, item, { blackTriggered: false });

  // 히스토리
  state.history.push({ id: item.id, name: item.name, capImg: item.capImg });
  renderHistory();

  // ===== BLACK 처리 =====
  if (blackTriggered) {
    state.isAnimating = true;

    // 이번 회차 SPECIAL 존재 여부(블랙 슬롯 제외)
    const specialIdxs = state.lastDrawItems
      .map((it, idx) => ({ it, idx }))
      .filter(({ it, idx }) => idx !== index && isSpecial(it))
      .map(({ idx }) => idx);

    const BLACK_BEFORE_OVERLAY_MS = 2000;
    await sleep(BLACK_BEFORE_OVERLAY_MS);

    // 오버레이
    setOverlayVisible(true, item);
    await sleep(OVERLAY_MS);
    setOverlayVisible(false);

    // 가운데로
    stageEl.classList.add("ending");

    // 1) 양옆 처리
    for (let i = 0; i < 3; i++) {
      if (i === index) continue;

      const other = state.lastDrawItems[i];
      const el = slots[i].el;

      // SPECIAL 면역
      if (isSpecial(other)) {
        setSlotOpened(i, other, { blackTriggered: false });
        el.classList.add("keep-content");
        el.dataset.state = "opened";
        state.opened[i] = true;
        continue;
      }

      // 블랙 영향
      setSlotOpened(i, other, { blackTriggered: true });

      if (isSpecialSSR(other)) {
        el.classList.add("keep-content");
        el.dataset.state = "opened";
        el.classList.add("summary-fade");

        setTimeout(() => {
          el.classList.remove("summary-fade");
          el.classList.add("summary-stay");
          const finalLine = other.blackLine || other.line || other.normalLine || "";
          typewriterWithCursor(slots[i].lineEl, finalLine);
        }, 950);
      } else {
        el.classList.add("fade-out");
        setTimeout(() => {
          el.dataset.state = "dead";
        }, 1200);
      }

      state.opened[i] = true;
    }

    // 2) 히스토리 재구성
    await sleep(350);
    const pool = getPool();

    const keepSpecialFromHistory = state.history.filter((h) => {
      const it = pool.find(p => p.id === h.id);
      return it && it.grade === "SPECIAL";
    });

    const hasAnySpecial = (specialIdxs.length > 0) || (keepSpecialFromHistory.length > 0);

    const specialThisRun = specialIdxs.map((idx) => {
      const sp = state.lastDrawItems[idx];
      return { id: sp.id, name: sp.name, capImg: sp.capImg };
    });

    const blackHistory = { id: item.id, name: item.name, capImg: item.capImg };

    const merged = [blackHistory, ...specialThisRun, ...keepSpecialFromHistory];
    const uniq = [];
    const seen = new Set();
    for (const h of merged) {
      if (!h || !h.id) continue;
      if (seen.has(h.id)) continue;
      seen.add(h.id);
      uniq.push(h);
    }
    state.history = uniq;
    renderHistory();

    // 블랙 리셋
    state.noBlackStreak = 0;

    // 3) 갈림
    if (hasAnySpecial) {
      setGameOverUI(false);
      state.isEnded = false;

      // 보호자 선정 (이번 회차 우선, 없으면 히스토리)
      const runSpecials = specialIdxs
        .map(i => state.lastDrawItems[i])
        .filter(it => it && it.grade === "SPECIAL");

      const histSpecials = state.history
        .map(h => pool.find(p => p.id === h.id))
        .filter(Boolean)
        .filter(it => it.grade === "SPECIAL");

      const candidates = runSpecials.length ? runSpecials : histSpecials;
      const protector = candidates.length
        ? candidates[Math.floor(Math.random() * candidates.length)]
        : null;

      // 토스트 (JS생성형)
      await showSpecialGuardNotice(protector, 2500);

      // (선택) 네가 쓰던 HTML 기반 메시지도 같이 띄우고 싶으면 유지
      //showGuardNotice();

      // 복구 (중첩 setTimeout 제거 / 딱 1번만)
      await sleep(500);
      stageEl.classList.remove("ending");

      for (let i = 0; i < 3; i++) {
        const el = slots[i].el;
        el.classList.remove("fade-out", "summary-fade", "summary-stay", "keep-content");
        setSlotSealed(i, SEALED_PLACEHOLDER);
        state.opened[i] = false;
      }

      state.lastDrawItems = [];
      drawBtn.disabled = false;
      restartBtn.disabled = false;

      state.isAnimating = false;
      return;
    } else {
      // 게임오버
      state.isEnded = true;
      setGameOverUI(true);

      const blackEl = slots[index].el;
      blackEl.classList.remove("fade-out");
      blackEl.dataset.state = "opened";
      state.opened[index] = true;

      drawBtn.disabled = true;
      restartBtn.disabled = false;

      state.isAnimating = false;
      return;
    }
  }

  // 일반 회차: 3개 다 열리면 다시 뽑기 가능
  const allOpened = state.opened.every(Boolean);
  if (allOpened) drawBtn.disabled = false;
}

// ===== Restart =====
function handleRestart() {
  if (state.isAnimating) return;

  state.isEnded = false;
  state.isAnimating = false;
  state.drawCount = 0;
  state.noBlackStreak = 0;
  state.isBlackRun = false;
  state.lastDrawItems = [];
  state.opened = [false, false, false];
  state.history = [];

  setOverlayVisible(false);
  setGameOverUI(false);

  drawBtn.disabled = false;
  restartBtn.disabled = true;

  for (let i = 0; i < 3; i++) {
    clearTypewriter(slots[i].lineEl);
  }

  renderHistory();
  resetAllSlots();
}

function goToStart() {
  gameApp.classList.add("hidden");
  startScreen.classList.remove("hidden");
}

function backToStart() {
  handleRestart();
  goToStart();
}

function showStart() {
  startScreen.classList.remove("hidden");
  gameApp.classList.add("hidden");
}

function showGame() {
  startScreen.classList.add("hidden");
  gameApp.classList.remove("hidden");

  handleRestart();

  setTimeout(() => {
    handleDraw();
  }, 0);
}

startBtn.addEventListener("click", showGame);

// ===== Init =====
showStart();
renderHistory();
resetAllSlots();

drawBtn.addEventListener("click", handleDraw);
restartBtn.addEventListener("click", backToStart);
setGameOverUI(false);

// 슬롯 클릭/터치로 오픈
slots.forEach((s, idx) => {
  s.el.addEventListener("click", () => openSlot(idx));
  s.el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openSlot(idx);
    }
  });
});
