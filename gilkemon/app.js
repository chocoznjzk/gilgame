// app.js
console.log("GILKEMON_POOL loaded?", window.GILKEMON_POOL?.length);

console.log("APP VERSION 2026-01-28 A");

function setVh() {
  const vh = window.innerHeight * 0.01; 
  document.documentElement.style.setProperty("--vh", `${vh}px`);
}

setVh();
window.addEventListener("resize", setVh);

// iOS에서 주소창 변화/회전 등 더 잘 잡히게
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", setVh);
  window.visualViewport.addEventListener("scroll", setVh);
}

// ===== DOM =====
const screenEl = document.querySelector("#screen");
const headlineEl = document.querySelector("#headline");
const hintEl = document.querySelector("#hint");

const ballBtn = document.querySelector("#ballBtn");
const ballImg = document.querySelector("#ballImg");
const cardBody = document.querySelector("#cardBody");

const infoCard = document.querySelector("#infoCard");
const charImgEl = document.querySelector("#charImg");
const charVideoEl = document.querySelector("#charVideo");

const charGradeEl = document.querySelector("#charGrade");
const charTypeEl = document.querySelector("#charType");
const charNameEl = document.querySelector("#charName");
const charDescEl = document.querySelector("#charDesc");
const charLineEl = document.querySelector("#charLine");

const eventOverlay = document.querySelector("#eventOverlay");
const eventImg = document.querySelector("#eventImg");
const eventVideo = document.querySelector("#eventVideo");

const toastEl = document.querySelector("#toast");
const FIRST_BG = "./assets/bg/하늘5.jpg"; // 첫 화면 고정 배경
screenEl.style.backgroundImage = `url("${FIRST_BG}")`;
screenEl.style.backgroundPosition = "center";
screenEl.style.backgroundRepeat = "no-repeat";
screenEl.style.backgroundSize = "contain";



const historyList = document.querySelector("#historyList");
const typeFx = document.querySelector("#typeFx");
// ===== Screen BG (카드 닫을 때만 랜덤 교체) =====
const SCREEN_BGS = [
  "./assets/bg/하늘4.jpg",
  "./assets/bg/하늘3.jpg",
  "./assets/bg/하늘2.jpg",
  "./assets/bg/하늘.jpg",
  "./assets/bg/저녁가로등.jpg",
  "./assets/bg/시골.jpg",
  "./assets/bg/숲.jpg",
  "./assets/bg/산.jpg",
  "./assets/bg/붉은하늘.jpg",
  "./assets/bg/밤바다.jpg",
  "./assets/bg/밤.jpg","./assets/bg/나무.jpg",
  "./assets/bg/달.jpg","./assets/bg/고양이.jpg",
  "./assets/bg/하늘3.jpg","./assets/bg/가로등.jpg",
  
  
  //배경들 경로로 추가
];



let _bgIndex = -1;

function setRandomScreenBg() {
  if (!SCREEN_BGS.length) return;

  // 같은 배경 연속 방지
  let next = _bgIndex;
  if (SCREEN_BGS.length === 1) {
    next = 0;
  } else {
    while (next === _bgIndex) {
      next = Math.floor(Math.random() * SCREEN_BGS.length);
    }
  }
  _bgIndex = next;

screenEl.style.backgroundImage = `url("${SCREEN_BGS[_bgIndex]}")`;
screenEl.style.backgroundPosition = "center";
screenEl.style.backgroundRepeat = "no-repeat";
screenEl.style.backgroundSize = "contain";


}

// (선택) 로딩때 깜빡임 줄이기: 미리 로드
function preloadScreenBgs() {
  SCREEN_BGS.forEach((src) => { const img = new Image(); img.src = src; });
}
preloadScreenBgs();


const choiceRow = document.querySelector("#choiceRow");
const choiceYes = document.querySelector("#choiceYes");
const choiceNo  = document.querySelector("#choiceNo");



// ===== Dex DOM =====
const dexBtn = document.querySelector("#dexBtn");
const dexOverlay = document.querySelector("#dexOverlay");
const dexClose = document.querySelector("#dexClose");
const dexGrid = document.querySelector("#dexGrid");

const dexDetail = document.querySelector("#dexDetail");
const dexCharImg = document.querySelector("#dexCharImg");
const dexCharGrade = document.querySelector("#dexCharGrade");
const dexCharName = document.querySelector("#dexCharName");
const dexCharType = document.querySelector("#dexCharType");
const dexCharDesc = document.querySelector("#dexCharDesc");
const dexCharLine = document.querySelector("#dexCharLine");

let dexCurrent = null;


// ===== State =====
const state = {
  mode: "IDLE", // IDLE | REVEAL | INFO | CHOICE_RESULT | SPECIAL_AFTER | BLACK_EVENT | BLACK_MSG
  current: null,
  history: [], // session only
  dex: new Set(), // persistent
  isLocked: false,
  isDexOpen: false,
  dexReturn: null,
};

// ===== Storage (도감은 유지, 히스토리는 리셋) =====
const DEX_KEY = "gilkemon_dex_v1";

function loadDex() {
  try {
    const raw = localStorage.getItem(DEX_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function saveDex() {
  try {
    localStorage.setItem(DEX_KEY, JSON.stringify([...state.dex]));
  } catch {}
}

// ===== Pool =====
function getPool() {
  const pool = window.GILKEMON_POOL || [];
  if (!pool.length) throw new Error("GILKEMON_POOL이 비어있어요. pool.js 로드 확인!");
  return Array.isArray(window.GILKEMON_POOL) ? window.GILKEMON_POOL : [];
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// ===== Utils =====
function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function isBlack(item) {
  return item && item.grade === "?" && item.special === "BLACK";
}

function isSpecialSSR(item) {
  return item && item.grade === "ssr" && item.special === "SPECIAL_SSR";
}
function isSpecialTyping(item) {
  return item && item.grade === "special" && item.special === "SPECIAL_TYPING";
}

function isRefuseSR(item) {
  return item && item.grade === "sr" && item.special === "REFUSE";
}

// ===== Type FX =====
// 타입별 효과 이미지 경로
const TYPE_FX = {
  "공격형": {
    bg: "./assets/typefx/폭풍1.png",
    sprites: [
      "./assets/typefx/폭풍1.png",
      "./assets/typefx/폭풍2.png",
      "./assets/typefx/폭풍3.png",
    ],
  },
  "방어형": {
    bg: "./assets/typefx/폭풍1.png",
    sprites: [
      "./assets/typefx/폭풍1.png",
      "./assets/typefx/폭풍1.png",
    ],
  },
  "지원형": {
    bg: "./assets/typefx/폭풍1.png",
    sprites: [
      "./assets/typefx/폭풍1.png",
      "./assets/typefx/폭풍1.png",
    ],
  },
  "관찰형": {
    bg: "./assets/typefx/폭풍1.png",
    sprites: [
      "./assets/typefx/폭풍1.png",
      "./assets/typefx/폭풍1.png",
    ],
  },
  "균형형": {
    bg: "./assets/typefx/폭풍1.png",
    sprites: [
      "./assets/typefx/폭풍1.png",
      "./assets/typefx/폭풍1.png",
    ],
  },
  "압박형": {
    bg: "./assets/typefx/폭풍1.png",
    sprites: [
      "./assets/typefx/폭풍1.png",
      "./assets/typefx/폭풍2.png",
      "./assets/typefx/폭풍3.png",
    ],
  },
  "교란형": {
    bg: "./assets/typefx/폭풍1.png",
    sprites: [
      "./assets/typefx/폭풍1.png",
      "./assets/typefx/폭풍2.png",
      "./assets/typefx/폭풍3.png",
    ],
  },
};

function clearTypeFx(){
  if (!typeFx) return;
  typeFx.classList.remove("on");
  typeFx.style.removeProperty("--type-bg");
  typeFx.innerHTML = "";
}
// 항상 동일한 사방 퍼짐 벡터(정방향 아이콘용)
const FX_VEC_PRESET = [
  { dx:   0, dy: -170, s: 26, delay:  0 },
  { dx:  70, dy: -150, s: 22, delay: 20 },
  { dx: 120, dy:  -80, s: 24, delay: 40 },
  { dx: 150, dy:    0, s: 20, delay: 60 },
  { dx: 120, dy:   80, s: 24, delay: 40 },
  { dx:  70, dy:  150, s: 22, delay: 20 },
  { dx:   0, dy:  170, s: 26, delay:  0 },
  { dx: -70, dy:  150, s: 22, delay: 20 },
  { dx:-120, dy:   80, s: 24, delay: 40 },
  { dx:-150, dy:    0, s: 20, delay: 60 },
  { dx:-120, dy:  -80, s: 24, delay: 40 },
  { dx: -70, dy: -150, s: 22, delay: 20 },
];

function playTypeFx(type){
  if (!typeFx) return;

  const conf = TYPE_FX[type];
  if (!conf) return;

  // 초기화
  typeFx.innerHTML = "";
  typeFx.style.setProperty("--type-bg", `url("${conf.bg}")`);
  typeFx.classList.add("on");

  // 파동 링 1~2개(겹치면 더 포켓몬 느낌)
  const ring1 = document.createElement("div");
  ring1.className = "ring";
  typeFx.appendChild(ring1);

  const ring2 = document.createElement("div");
  ring2.className = "ring";
  ring2.style.animationDelay = "120ms";
  typeFx.appendChild(ring2);

  // 반짝 폭발(중앙에서 여러 개 튀어나가기)
  const count = 14; // 10~18 추천
  for (let i = 0; i < count; i++){
    const img = document.createElement("img");
    img.className = "spark";
    img.src = conf.sprites[i % conf.sprites.length];
    if (!Array.isArray(conf.sprites) || conf.sprites.length === 0) return;

    const preset = FX_VEC_PRESET;
const count = preset.length;

for (let i = 0; i < count; i++){
  const img = document.createElement("img");
  img.className = "spark";
  img.src = conf.sprites[i % conf.sprites.length]; // ✅ 타입별 이미지

  const p = preset[i];
  img.style.setProperty("--dx", `${p.dx}px`);
  img.style.setProperty("--dy", `${p.dy}px`);
  img.style.setProperty("--s", `${p.s}px`);
  img.style.setProperty("--delay", `${p.delay}ms`);

  img.addEventListener("animationend", () => img.remove());
  typeFx.appendChild(img);
}

  }
}

function playPokemonText() {
  // headline
  headlineEl.classList.remove("poke-pop", "poke-wiggle");
  // 리플로우로 애니메이션 재시작
  void headlineEl.offsetWidth;
  headlineEl.classList.add("poke-pop", "poke-wiggle");

  // hint도 같이 (원하면 hint는 pop만)
  hintEl.classList.remove("poke-pop", "poke-wiggle");
  void hintEl.offsetWidth;
  hintEl.classList.add("poke-pop", "poke-wiggle");
}
function isChoiceSR(it){
  return it && it.special === "CHOICE_SR" && it.choice;
}

let typingTimer = null;
function stopTyping(){
  if (typingTimer) clearTimeout(typingTimer);
  typingTimer = null;
}

function typeLine(el, text, speed=28){
  stopTyping();
  el.textContent = "";
  const s = String(text ?? "");
  let i = 0;

  const tick = () => {
    el.textContent = s.slice(0, i);
    i++;
    if (i <= s.length) typingTimer = setTimeout(tick, speed);
    else typingTimer = null;
  };
  tick();
}


// ===== History =====
function renderHistory() {
  historyList.innerHTML = "";

  if (state.history.length === 0) {
    const empty = document.createElement("div");
    empty.className = "history-empty";
    empty.textContent = "아직 기록이 없습니다.";
    historyList.appendChild(empty);
    return;
  }

  for (const h of state.history.slice().reverse()) {
    const row = document.createElement("div");
    row.className = "history-item";

    const img = document.createElement("img");
    img.src = h.charImg || "";
    img.alt = h.name;

    const name = document.createElement("div");
    name.className = "name";
    name.textContent = h.name;

    row.appendChild(img);
    row.appendChild(name);
    historyList.appendChild(row);
  }
}

function pushHistory(item) {
  // 거부 SR은 히스토리에 안 남김
  if (isRefuseSR(item)) return;

  state.history.push({
    id: item.id,
    name: item.name,
    charImg: item.charImg || "",
  });
  renderHistory();
}
function renderDex(){
  const pool = getPool();
  dexGrid.innerHTML = "";

  pool.forEach(it => {
    const cell = document.createElement("div");
    cell.className = "dex-item";

    const unlocked = state.dex.has(it.id);

    if(!unlocked){
      // 미획득: 카드 크기는 동일, 볼만 진하게
      cell.classList.add("locked");

      const ball = document.createElement("img");
      ball.className = "dex-ball";
      ball.src = it.ballImg;
      ball.alt = "ball";

      cell.appendChild(ball);
    } else {
      // 획득: 카드 + 흐린 볼 배경(각 캐릭터 ballImg)
      cell.classList.add("unlocked");

      const bgBall = document.createElement("img");
      bgBall.className = "dex-ball bg";
      bgBall.src = it.ballImg;
      bgBall.alt = "ball bg";
      cell.appendChild(bgBall);

      const info = document.createElement("div");
      info.className = "dex-info";

      //const safeLine = (it.line || "");
      const safeDesc = (it.desc || "");
      const safeLine = (it.line || "");

       info.innerHTML = `
       <img class="dex-char" src="${it.dexGif || it.charImg}" alt="${it.name || ""}">
       <div class="dex-meta">
        <div class="dex-grade">${(it.grade || "").toUpperCase()}</div>
        <div class="dex-name">${it.name || ""}</div>
       <div class="dex-type">${it.type || ""}</div>
       </div>

       <div class="dex-textbox">
        <div class="dex-desc">${safeDesc}</div>
        <div class="dex-line">${safeLine}</div>
        </div>
        `;


      cell.appendChild(info);
    }

    dexGrid.appendChild(cell);
  });
 
}


function showDexDetail(item) {
  dexCurrent = item;

  // 뒤를 흐리게
  dexOverlay.querySelector(".dex-panel")?.classList.add("is-detail");

  dexCharImg.src = item.dexGif || item.charImg || "";
  dexCharImg.alt = item.name || "";

  dexCharGrade.textContent = (item.grade || "").toUpperCase();
  dexCharName.textContent = item.name || "";
  dexCharType.textContent = item.type || "";
  dexCharDesc.textContent = item.desc || "";

  const raw = item.line || "";
  dexCharLine.textContent =
    raw.startsWith("“") || raw.startsWith("\"") ? raw : `“${raw}”`;

  dexDetail.classList.remove("hidden");
  dexDetail.setAttribute("aria-hidden", "false");
}

function hideDexDetail() {
  dexCurrent = null;
  dexOverlay.querySelector(".dex-panel")?.classList.remove("is-detail");
  dexDetail.classList.add("hidden");
  dexDetail.setAttribute("aria-hidden", "true");
}

// ===== Dex events =====
if (dexBtn) {
  dexBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // screen 클릭 핸들러로 번지는 거 방지
    showDex();           // 네가 만든 showDex() 사용
     // ✅ 도감 열리고 나서 폰트 자동 조절
  if (typeof fitDexQuoteLines === "function") {
  setTimeout(fitDexQuoteLines, 0);
}
  });
}
if (dexClose) {
  dexClose.addEventListener("click", (e) => {
    e.stopPropagation();
    hideDex();           // 네가 만든 hideDex() 사용
  });
}
// 도감 바깥(검은 배경) 눌러 닫기
if (dexOverlay) {
  dexOverlay.addEventListener("click", (e) => {
    if (e.target === dexOverlay) hideDex();
  });
}
//dexClose.addEventListener("click", closeDex);

// 도감 상세 열려있을 때: 아무데나 터치하면 닫기
//dexDetail.addEventListener("click", hideDexDetail);

// 도감 바깥(검은 배경)을 눌러도 닫기
//dexOverlay.addEventListener("click", (e) => {
  //if (e.target === dexOverlay) closeDex();
//});


// ===== UI helpers =====
let __typingToken = 0;

async function typeText(el, text, speed = 28) {
  const token = ++__typingToken;
  el.textContent = "";
  for (let i = 0; i < text.length; i++) {
    if (token !== __typingToken) return; // 다른 카드로 넘어가면 중단
    el.textContent += text[i];
    await sleep(speed);
  }
}

function isNewUnlock(id){
  const key = "dexUnlocked";
  const raw = localStorage.getItem(key);
  const unlocked = raw ? JSON.parse(raw) : {};
  const wasUnlocked = !!unlocked[id];

  if (!wasUnlocked){
    unlocked[id] = true;
    localStorage.setItem(key, JSON.stringify(unlocked));
    return true; // ✅ 이번에 처음 해금
  }
  return false;
}

function showDex() {
  state.isDexOpen = true;

   state.dexReturn = {
    mode: state.mode,
    current: state.current,       // 현재 뽑은 캐릭터 데이터
    infoVisible: !infoCard.classList.contains("hidden"),
    eventVisible: !!document.querySelector("#eventOverlay:not(.hidden)"), // 너 프로젝트에 맞게 id/class 수정 가능
    toastVisible: !!document.querySelector("#toast:not(.hidden)"),        // idem
  };

  dexOverlay.classList.remove("hidden");
  dexOverlay.setAttribute("aria-hidden", "false");
  renderDex();
}

function hideDex() {
  dexOverlay.classList.add("hidden");
  dexOverlay.setAttribute("aria-hidden", "true");

  // 도감 닫기 처리 후
  state.isDexOpen = false;

  const back = state.dexReturn;
  state.dexReturn = null;

  if (!back) return;

  // ✅ 도감 열기 전 상태로 복구
  state.mode = back.mode;
  state.current = back.current;

  // 도감 열기 전에 카드가 떠있었으면 다시 보여주기
  if (back.infoVisible && back.current) {
    showInfoCard(back.current);  // ✅ 너 코드에 있는 “카드 보여주는 함수” 이름 그대로 써야 함
  }
}

let _videoEndedHandler = null;

function playVideoNTimes(videoEl, times = Infinity){
  // 무한
  if (!isFinite(times)) {
    videoEl.loop = true;
    videoEl.currentTime = 0;
    videoEl.play().catch(()=>{});
    return;
  }

  // N번 재생
  videoEl.loop = false;
  let count = 0;

  if (_videoEndedHandler) videoEl.removeEventListener("ended", _videoEndedHandler);

  _videoEndedHandler = () => {
    count++;
    if (count < times) {
      videoEl.currentTime = 0;
      videoEl.play().catch(()=>{});
    }
  };

  videoEl.addEventListener("ended", _videoEndedHandler);

  videoEl.currentTime = 0;
  videoEl.play().catch(()=>{});
}

function showInfoCard(item, opts = {}) {
  screenEl.classList.add("is-dim");
  infoCard.classList.remove("hidden");
  const newBadge = document.querySelector("#newBadge");

  const id = item.id || item.name; //  데이터에 맞게
  const isNew = isNewUnlock(id);

  infoCard.classList.remove("new-hit");
  screenEl.classList.remove("flash");
  newBadge.classList.add("hidden");
  // ✅ 카드에서는 GIF(있으면) 우선, 없으면 기존 캐릭터 이미지
  const gifOrPng = item.cardGif || item.charImg || "";
  const mp4 = item.cardMp4 || item.mp4 || "";   // 네가 쓸 필드명
   if (mp4 && charVideoEl) {
    // video ON, img OFF
    charImgEl.classList.add("hidden");
    charVideoEl.classList.remove("hidden");

    // 소스 교체
    if (charVideoEl.src !== mp4) charVideoEl.src = mp4;

    // ✅ 무한 or 2번
    // 무한: playVideoNTimes(charVideoEl, Infinity)
    // 2번: playVideoNTimes(charVideoEl, 2)
    playVideoNTimes(charVideoEl, Infinity); // <- 여기만 바꾸면 됨
  } else {
    // img ON, video OFF
    if (charVideoEl) {
      charVideoEl.pause();
      charVideoEl.removeAttribute("src");
      charVideoEl.load();
      charVideoEl.classList.add("hidden");
    }
    charImgEl.classList.remove("hidden");
    charImgEl.src = gifOrPng;
  }

  infoCard.classList.remove("hidden");
;

if (isNew){
  // NEW 임팩트
  screenEl.classList.add("flash");
  infoCard.classList.add("new-hit");
  newBadge.classList.remove("hidden");

  // 플래시 클래스 정리
  setTimeout(() => screenEl.classList.remove("flash"), 260);
}

  infoCard.setAttribute("aria-hidden", "false");

  
  charImgEl.alt = item.name || "";

  // grade 출력은 그대로 보여주되, 소문자/대문자 섞여 있어도 보기 좋게
  charGradeEl.textContent = (item.grade || "").toUpperCase();
  charTypeEl.textContent = item.type || "";

  charNameEl.textContent = item.name || "";
  charDescEl.textContent = item.desc || "";

  // 대사는 "" 안에 보이게
  const rawLine = item.line || "";
  const displayLine =
  rawLine.startsWith("“") || rawLine.startsWith("\"") ? rawLine : `“${rawLine}”`;

  // ✅ 줄바꿈이 pool에서 들어오면 그대로 보이게(원하면 유지)
  charLineEl.style.whiteSpace = "pre-line";

  // ✅ 신규일 때만 타이핑
  if (state.currentIsNew) {
  typeText(charLineEl, displayLine, 80); // 속도 숫자 낮을수록 빨라짐
  }  else {
  charLineEl.textContent = displayLine;
  }

  
  // 텍스트 박스 "뒤 배경색" (캐릭터별)
  cardBody.style.setProperty("--tb-bg", item.textBoxBg || "rgba(255, 255, 255, 0.65)");
    // ===== 선택형 SR(그래/아니)면 버튼 노출 + 화면 더 어둡게 =====
  if (isChoiceSR(item)) {
    screenEl.classList.add("is-choice-dim");
    choiceRow.classList.remove("hidden");
  } else {
    screenEl.classList.remove("is-choice-dim");
    choiceRow.classList.add("hidden");
  }

 
}

function hideInfoCard() {
  infoCard.classList.add("hidden");
  infoCard.setAttribute("aria-hidden", "true");
  screenEl.classList.remove("is-dim");
    screenEl.classList.remove("is-choice-dim");
  choiceRow.classList.add("hidden");

}

function showEventMedia(item) {
  const mp4 = item.eventMp4 || item.eventNoMp4 || "";
  const gif = item.eventGif || "";

  // 비디오 먼저
  if (mp4 && eventVideo) {
    eventImg.classList.add("hidden");
    eventVideo.classList.remove("hidden");

    if (eventVideo.src !== mp4) eventVideo.src = mp4;

    // 무한(원하면 2번: playVideoNTimes(eventVideo, 2))
    playVideoNTimes(eventVideo, Infinity);

    eventVideo.currentTime = 0;
    eventVideo.play().catch(() => {});
  } else {
    // gif/이미지
    if (eventVideo) {
      eventVideo.pause();
      eventVideo.removeAttribute("src");
      eventVideo.load();
      eventVideo.classList.add("hidden");
    }

    eventImg.classList.remove("hidden");
    eventImg.src = gif; // ✅ 여기서 gif를 넣어야 함 (재귀 호출 X)
  }

  eventOverlay.classList.remove("hidden");
  eventOverlay.setAttribute("aria-hidden", "false");
}

function hideEventImage() {
  eventOverlay.classList.add("hidden");
  eventOverlay.setAttribute("aria-hidden", "true");

  // ✅ 비디오 쓰는 경우도 정리
  if (eventVideo) {
    eventVideo.pause();
    eventVideo.removeAttribute("src");
    eventVideo.load();
    eventVideo.classList.add("hidden");
  }
  if (eventImg) eventImg.src = "";
}


function showToast(text) {
  toastEl.textContent = text;
  toastEl.classList.remove("hidden");
  toastEl.setAttribute("aria-hidden", "false");
}

function hideToast() {
  toastEl.classList.add("hidden");
  toastEl.setAttribute("aria-hidden", "true");
  toastEl.textContent = "";
}

// ===== IDLE =====
function setIdle(changeBg = false) {
  if (changeBg) setRandomScreenBg();

  state.mode = "IDLE";
  state.current = null;
  state.isLocked = false;

  headlineEl.innerHTML = "앗, &nbsp;&nbsp;&nbsp; ??? &nbsp;&nbsp;&nbsp; 가 나타났다!";
  hintEl.textContent = "볼을 눌러보세요";

  ballImg.src = "./assets/balls/empty.png";
  ballImg.alt = "empty ball";

  ballBtn.classList.add("is-idle");
  ballBtn.classList.remove("is-colored");

  hideInfoCard();
  hideEventImage();
  hideToast();
  hideDex();
  clearTypeFx();
  playPokemonText(); 
}


// ===== Step A: 빈볼 클릭 -> 반짝 + 색볼 =====
async function handleBallClick() {
  if (state.isLocked) return;
  

  if (state.mode === "IDLE") {
    state.isLocked = true;
    ballBtn.classList.remove("is-idle");   //  클릭하면 둥둥 멈춤

 //테스트
  const item = pickRandom(getPool());
   //const pool = getPool();
   //const item = pool.find(x => x.id === "SPECIAL-08") ?? pickRandom(pool);

    state.current = item;

   
    hintEl.textContent = "…";

    await sleep(900); // 색 볼 바뀌기전 반짝 모션 준비

    ballImg.src = item.ballImg || "./assets/balls/empty.png";
    ballImg.alt = item.grade || "ball";

    ballBtn.classList.remove("is-colored"); // 한번 리셋
    void ballBtn.offsetWidth;               //  reflow로 애니메이션 재시작
    ballBtn.classList.add("is-colored");    //  통통+흔들

    await sleep(700); // 색 볼 보여주고 안정화 시간
   
    state.mode = "REVEAL";
    hintEl.textContent = "한 번 더 눌러보세요";
    state.isLocked = false;
    return;
  }

  // Step B: 색볼 클릭 -> 캐릭터 정보
  if (state.mode === "REVEAL") {
    const item = state.current;
    if (!item) return;
    state.isLocked = true; // 이펙트 보여주는 동안 연타 방지

    state.mode = "INFO";
    hintEl.textContent = " "; // 화면을 터치하면~ 글자 삭제.
      // ✅ '신규' 여부를 먼저 판단 (추가하기 전에)
    const isNew = !state.dex.has(item.id);
    state.currentIsNew = isNew;

    // 도감 저장

      state.dex.add(item.id);
      saveDex();
      // if (!dexOverlay.classList.contains("hidden")) renderDex();
    
    playTypeFx(item.type);
    // 여기 시간을 늘리면, 파동/타입 이미지가 확실히 보임
    await sleep(1500);
    showInfoCard(item, { isNew });

    // 히스토리 누적(거부 SR 제외)
    pushHistory(item);
    state.isLocked = false;

    return;
  }
}

// ===== 화면 아무데나 터치: 진행 흐름 =====
async function handleAnyTap(e) {
  //if (e.target.closest("#infoCard")) return;
   if (e.target.closest("#dexGrid")) return;
    // 도감 열려있으면 게임 진행 터치 무시
    if (!dexOverlay.classList.contains("hidden")) return;

  // 볼 클릭은 별도 처리(중복 방지)
  if (e.target === ballBtn) return;

  if (state.isLocked) return;

  const item = state.current;

  // INFO 상태에서 등급별 분기
  if (state.mode === "INFO") {
      // 0) 선택형 SR은 배경 터치로 진행하지 않음(버튼으로만)
    if (isChoiceSR(item)) return;

    if (!item) return;

    // 1) 거부 SR: 다음 터치 -> "~가 떠났습니다." -> idle (히스토리엔 안 남김은 이미 처리됨)
    if (isRefuseSR(item)) {
      state.isLocked = true;
      hideInfoCard();
      showToast(`${item.name}가 떠났습니다.`);
      await sleep(2000);
      hideToast();
      setIdle(true);
      return;
    }

    // 2) 특수 SSR: 다음 터치 -> (이미지+이름+대사) 타이핑 연출 화면으로 한 번 더
    if (isSpecialSSR(item) || isSpecialTyping(item)) {
      state.isLocked = true;
      state.mode = "SPECIAL_AFTER";

      // 카드 구성은 "이미지+이름+대사" 느낌으로: desc/type 숨기고 라인 타이핑
      charTypeEl.textContent = "";
      charDescEl.textContent = "";
      charNameEl.textContent = item.name || "";

      // 타이핑
      const raw = item.eline || "";
      const line = raw.startsWith("“") || raw.startsWith("\"") ? raw : `“${raw}”`;
      typewriter(charLineEl, line, 70); // 타이핑 속도 조절

      showToast("한 번 더 터치하면 돌아가요");
      state.isLocked = false;
      return;
    }

    // 3) 블랙: 다음 터치 -> 이벤트 이미지 먼저(특수SSR처럼) / 그 다음 터치 -> 메시지 3초 / 그 다음 -> idle
    if (isBlack(item)) {
      state.isLocked = true;

      // INFO -> BLACK_EVENT
      state.mode = "BLACK_EVENT";
      hideInfoCard();
      showEventMedia(item);
     // showEventMedia(item.eventMp4 || "./assets/events/black-event.png");
      showToast("감당 가능하시겠어요?");
      state.isLocked = false;
      return;
    }

    // 4) 일반 등급: 다음 터치 -> idle 복귀
     setIdle(true);
    return;
  }

  // 특수 SSR 추가 화면에서 터치 -> idle
  if (state.mode === "SPECIAL_AFTER") {
    hideToast();
    setIdle(true);
    return;
  }
// 선택 결과 화면에서 터치 -> idle
  if (state.mode === "CHOICE_RESULT") {
    hideToast();
    setIdle(true);
    return;
  }
  
  // 블랙 이벤트 이미지 보이는 상태에서 터치 -> 이미지 숨기고 메시지 3초 단계로
  if (state.mode === "BLACK_EVENT") {
    state.isLocked = true;

    hideEventImage();
    hideInfoCard();

    state.mode = "BLACK_MSG";

    // 블랙이 히스토리의 나머지 캐릭터를 없앰 (도감은 그대로)
    // => 히스토리 전체 삭제 후, 블랙 자신만 남기기(원하면)
    state.history = [{ id: item.id, name: item.name, charImg: item.charImg || "" }];
    renderHistory();

    showToast("민태주가 가방에 있던\n 다른 이들을\n 없애버렸다.");

    // 3초 유지
    await sleep(3000);

    hideToast();

    
   // ✅ 자동으로 idle 복귀
    setIdle(true);
    return;
  }

  // 블랙 메시지 단계에서 한 번 더 터치 -> idle
  /*if (state.mode === "BLACK_MSG") {
    setIdle();
    return;*/
  
}

// ===== Typewriter (특수SSR용) =====
function typewriter(el, text, speed = 150) {
  if (!el) return;
  if (el._twTimer) {
    clearInterval(el._twTimer);
    el._twTimer = null;
  }
  el.textContent = "";
  let i = 0;
  el._twTimer = setInterval(() => {
    i += 1;
    el.textContent = text.slice(0, i);
    if (i >= text.length) {
      clearInterval(el._twTimer);
      el._twTimer = null;
    }
  }, speed);
}

// ===== Init =====
state.dex = loadDex(); // (지금은 화면에 안 보여주지만, 저장은 시작해둠)

ballBtn.addEventListener("click", handleBallClick);
screenEl.addEventListener("click", handleAnyTap, true);

renderHistory();
setIdle();

function setCardMedia(src){
  const isVideo = /\.mp4($|\?)/i.test(src) || /\.webm($|\?)/i.test(src);

  if (isVideo) {
    charImgEl.classList.add("hidden");
    charVideoEl.classList.remove("hidden");

    charVideoEl.src = src;
    charVideoEl.muted = true;
    charVideoEl.playsInline = true;
    charVideoEl.autoplay = true;
    charVideoEl.loop = true; // 무한 반복(원하면)

    charVideoEl.play().catch(()=>{});
  } else {
    charVideoEl.pause();
    charVideoEl.removeAttribute("src");
    charVideoEl.load();
    charVideoEl.classList.add("hidden");

    charImgEl.src = src;
    charImgEl.classList.remove("hidden");
  }
}

function applyChoice(item, which) {
  // ✅ 네가 말한 대로 eventMp4/eventGif 기반으로 재생
  const media = (which === "yes")
    ? (item.eventMp4 || item.eventGif || "")
    : (item.eventNoMp4 || item.eventNoGif || item.choiceNoImg || "");

  const line  = (which === "yes") ? (item.choiceYesLine || "") : (item.choiceNoLine || "");

  choiceRow.classList.add("hidden");

  if (media) setCardMedia(media);

  const text = line ? (line.startsWith("“") || line.startsWith("\"") ? line : `“${line}”`) : "";
  typewriter(charLineEl, text, 150);

  state.mode = "CHOICE_RESULT";
  showToast("한 번 더 터치하면 돌아가요");
}


// (선택) 2회 반복하고 싶을 때만 사용:
let _loop2Count = 0;
function playVideoTwice(){
  _loop2Count = 0;
  charVideoEl.loop = false;
  charVideoEl.onended = () => {
    _loop2Count += 1;
    if (_loop2Count < 2) {
      charVideoEl.currentTime = 0;
      charVideoEl.play().catch(()=>{});
    } else {
      charVideoEl.onended = null;
    }
  };
}

/*function applyChoice(item, which) {
  const media = (which === "yes") ? (item.choiceYesImg || "") : (item.choiceNoImg || "");
  const line  = (which === "yes") ? (item.choiceYesLine || "") : (item.choiceNoLine || "");

  choiceRow.classList.add("hidden");

  if (media) setCardMedia(media);

  const text = line ? (line.startsWith("“") || line.startsWith("\"") ? line : `“${line}”`) : "";
  typewriter(charLineEl, text, 150);

  state.mode = "CHOICE_RESULT";
  showToast("한 번 더 터치하면 돌아가요");
}*/


// 버튼 클릭은 screen 클릭(handleAnyTap)으로 전달되지 않게 막기
choiceYes.addEventListener("click", (e) => {
  e.stopPropagation();
  if (state.mode !== "INFO") return;
  const item = state.current;
  if (!item || !isChoiceSR(item)) return;
  applyChoice(item, "yes");
});


choiceNo.addEventListener("click", (e) => {
  e.stopPropagation();
  if (state.mode !== "INFO") return;
  const item = state.current;
  if (!item || !isChoiceSR(item)) return;
  applyChoice(item, "no");
});
//choiceNo.addEventListener("pointerup", (e) => choiceNo.click());


// 오버레이 바깥(배경) 눌러 닫기
dexOverlay.addEventListener("click", (e) => {
  if (e.target === dexOverlay) hideDex();
});

function fitTextToBox(boxEl, opts = {}) {
  const min = opts.min ?? 10;      // 최소 폰트(px)
  const max = opts.max ?? 14;      // 기본 폰트(px)
  const step = opts.step ?? 0.5;   // 줄이는 단위(px)

  if (!boxEl) return;

  // 텍스트들(설명/대사 등)을 함께 줄이기 위해 box 전체에 font-size를 건다
  let size = max;
  boxEl.style.fontSize = `${size}px`;

  // 레이아웃 적용 후 측정
  const fits = () => boxEl.scrollHeight <= boxEl.clientHeight;

  // 이미 맞으면 끝
  if (fits()) return;

  // 작아질 때까지 줄이기
  while (size > min && !fits()) {
    size -= step;
    boxEl.style.fontSize = `${size}px`;
  }
}
function fitDexQuoteLines() {
  // 도감 카드(획득한 것) 안의 텍스트 박스들
  const boxes = document.querySelectorAll(".dex-item.unlocked .dex-textbox");
  boxes.forEach((box) => {
    fitTextToBox(box, { min: 10, max: 14, step: 0.5 });
  });
}


window.addEventListener("resize", () => fitDexQuoteLines());
