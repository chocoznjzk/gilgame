// pool.js
const GACHA_POOL = [
  // ===== N/R/SR 예시 =====
  {
    id: "n_01",
    grade: "N",
    name: "TS",
    type: "방어형",
    line: "알고 있었어.",
    desc: "말을 아낀다. 결정을 존중한다.",
    charImg: "./assets/chars/TS.png",   // assets/chars/xxx.png
    capImg: "./assets/caps/N.png",
    special: null
  },
  {
    id: "r_01",
    grade: "R",
    name: "조금 특별한 캐릭터 B",
    line: "이 정도면 나쁘지 않지?",
    charImg: "",
    capImg: "./assets/caps/R.png",
    special: null
  },
  {
    id: "sr_01",
    grade: "SR",
    name: "능숙한 캐릭터 B",
    line: "결과는 어느 정도 예상했어",
    charImg: "",
    capImg: "./assets/caps/SR.png",
    special: null
  },

  // ===== 특수 SSR 2개 =====
  {
    id: "ssr_01",
    grade: "SSR",
    name: "완전한 상태의 SSR",
    normalLine: "괜찮아. 아직 끝난 건 아니야.",  // 평소(강한 이미지)
    blackLine: "아, 이건 예상 못했네.",          // 블랙 때
    charImg: "",
    capImg: "./assets/caps/SSR.png",
    special: "DELAY_BREAK"
  },
  {
    id: "ssr_02",
    grade: "SSR",
    name: "마지막 한마디 SSR",
    normalLine: "괜찮아. 네가 잘못한 거 아니야.", // 평소(위로)
    blackLine: "괜찮아, 난 알고 있었어.",         // 블랙 때(마지막 한마디)
    charImg: "",
    capImg: "./assets/caps/SSR.png",
    special: "LAST_LINE"
  },

  // ===== BLACK =====
  {
    id: "black_01",
    grade: "?",
    name: "BLACK",
    line: "",
    charImg: "./assets/fx/black.gif", // 오버레이에 씀(없으면 빈 화면)
    capImg: "./assets/caps/B.png",
    special: "BLACK"
  },

   // ===== hidden =====
  {
  id: "hidden_01",
  grade: "HIDDEN",
  name: "수양대군",
  line: "처음부터 여기에 있었어.",
  charImg: "",
  capImg: "./assets/caps/HIDDEN.png",
  special: null
},

  // ===== SPECIAL =====

 {
  id: "sp_01",
  grade: "SPECIAL",
  name: "SPECIAL-1",
  line: "…여기서 끝내.",
  charImg: "",
  capImg: "./assets/caps/SPECIAL.png",
  special: "COUNTER_BLACK"
},
{
  id: "sp_02",
  grade: "SPECIAL",
  name: "SPECIAL-2",
  line: "너는 여기까지야.",
  charImg: "",
  capImg: "./assets/caps/SPECIAL.png",
  special: "COUNTER_BLACK"
},
{
  id: "sp_03",
  grade: "SPECIAL",
  name: "SPECIAL-3",
  line: "이건 내가 막는다.",
  charImg: "",
  capImg: "./assets/caps/SPECIAL.png",
  special: "COUNTER_BLACK"
}
];

window.GACHA_POOL = GACHA_POOL;
