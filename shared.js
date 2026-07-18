// ============================================================
// 『カジュアルなロミオとジュリエット』LP 共通スクリプト
// 設定はこのファイルの先頭にまとまっています。
// ============================================================

// ===== Google フォーム(作成後に formResponse URL と entry ID を設定) =====
const SURVEY_FORM = 'https://docs.google.com/forms/d/e/1FAIpQLSdKPg8sW2pY818jQ6-2Buge4rKrSNkWU7faADRVwFcByig3Sw/formResponse';
const ENTRY = {
  impression: 'entry.1263349879', // 感想
  firsttime:  'entry.1762247259', // シェイクスピア観劇回数
  nickname:   'entry.288189140',  // ニックネーム
  consent:    'entry.1485371368', // 紹介許諾
  age:        'entry.1158783329', // 年代
  clientId:   'entry.1118639962'  // 匿名共通ID(Stripe突合用)
};

// ===== 匿名共通ID =====
// ブラウザごとに乱数IDを生成・保存。
// Stripeの client_reference_id とフォームの隠し項目に同じ値を送り、
// 決済とアンケートを同一ブラウザ単位で紐付ける(個人情報は含まない)。
const CLIENT_ID = (() => {
  const KEY = 'rj_client_id';
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = 'rj-' + (crypto.randomUUID ? crypto.randomUUID() :
        Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10));
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch (e) {
    return 'rj-nostore-' + Math.random().toString(36).slice(2, 10);
  }
})();

// ===== Stripe Payment Link(投げ銭) =====
const STRIPE_LINK = 'https://donate.stripe.com/aFadRb1l61vZ5bn17z0x208';

// ===== 計測(あとから設定: IDを入れると有効化) =====
const GA_ID = 'G-L3DXLYGGKW';

// --- GA4 ---
if (GA_ID) {
  const s = document.createElement('script');
  s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function(){ dataLayer.push(arguments); };
  gtag('js', new Date()); gtag('config', GA_ID);
}
// GA4 にイベントを送る
function track(eventName, params) {
  try { if (window.gtag) gtag('event', eventName, params || {}); } catch (e) {}
}

// ===== 投げ銭ボタン(クリック計測つき) =====
// data-tip 属性を持つすべてのリンクを Stripe に接続し、ラベル別に計測
(function setupSupport() {
  const tips = document.querySelectorAll('[data-tip]');
  if (!STRIPE_LINK) {
    const support = document.getElementById('support');
    if (support) support.style.display = 'none';
    tips.forEach(a => a.style.display = 'none');
    return;
  }
  const sep = STRIPE_LINK.includes('?') ? '&' : '?';
  const stripeUrl = STRIPE_LINK + sep + 'client_reference_id=' + encodeURIComponent(CLIENT_ID);
  tips.forEach(a => {
    a.href = stripeUrl;
    a.target = '_blank'; a.rel = 'noopener';
    a.addEventListener('click', () => track('support_click', { label: a.dataset.tip, client_id: CLIENT_ID }));
  });
})();

// ===== Google フォーム送信 =====
function postForm(url, data) {
  const body = new URLSearchParams(data).toString();
  fetch(url, {
    method: 'POST', mode: 'no-cors', keepalive: true,
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body
  }).catch(() => {});
}
document.getElementById('surveyForm').addEventListener('submit', e => {
  e.preventDefault();
  if (SURVEY_FORM && ENTRY.impression) {
    const data = {};
    data[ENTRY.impression] = document.getElementById('impression').value;
    if (ENTRY.firsttime) data[ENTRY.firsttime] = document.getElementById('firsttime').value;
    if (ENTRY.nickname) data[ENTRY.nickname] = document.getElementById('nickname').value;
    if (ENTRY.consent) data[ENTRY.consent] = document.getElementById('consent').value;
    if (ENTRY.age) data[ENTRY.age] = document.getElementById('age').value;
    if (ENTRY.clientId) data[ENTRY.clientId] = CLIENT_ID;
    postForm(SURVEY_FORM, data);
  }
  track('survey_submit');
  // 画面をサンクスに切り替え
  const hero = document.querySelector('.hero');
  if (hero) hero.style.display = 'none';
  const speech = document.querySelector('.speech');
  if (speech) (speech.closest('section') || speech).style.display = 'none';
  document.getElementById('surveySection').style.display = 'none';
  // 投げ銭ボタンをサンクス画面に移設
  const support = document.getElementById('support');
  const after = document.getElementById('supportAfter');
  if (support && after && STRIPE_LINK) {
    support.style.marginTop = '34px';
    after.replaceWith(support);
  }
  const thanks = document.getElementById('thanks');
  thanks.style.display = 'flex';
  thanks.classList.add('fade-in');
  window.scrollTo(0, 0);
});

// ===== X共有ボタン =====
(function setupShare() {
  const btn = document.getElementById('shareBtn');
  if (!btn) return;
  const text = encodeURIComponent('『カジュアルなロミオとジュリエット』観てきた! #カクシンハン #カジュアルロミジュリツアー');
  btn.href = 'https://x.com/intent/post?text=' + text;
  btn.addEventListener('click', () => track('share_click'));
})();

// ===== 紙吹雪(ページ側が data-confetti を持つ場合のみ) =====
(function confetti() {
  const conf = document.body.dataset.confetti;
  if (!conf) return;
  const colors = conf.split(',');
  const chars = ['♥', '◆', '●'];
  for (let i = 0; i < 18; i++) {
    const s = document.createElement('span');
    s.className = 'confetti';
    s.textContent = chars[i % chars.length];
    s.style.color = colors[i % colors.length].trim();
    s.style.left = (Math.random() * 100) + 'vw';
    s.style.animationDuration = (7 + Math.random() * 8) + 's';
    s.style.animationDelay = (Math.random() * 8) + 's';
    s.style.fontSize = (9 + Math.random() * 8) + 'px';
    document.body.appendChild(s);
  }
})();

// ===== ▼をヒーロー下端まで敷き詰める =====
(function arrows() {
  const hint = document.getElementById('scrollHint');
  const hero = document.querySelector('.hero');
  if (!hint || !hero) return;
  const fill = () => {
    hint.querySelectorAll('.auto-arrow').forEach(el => el.remove());
    const label = hint.firstElementChild;
    const heroBottom = hero.getBoundingClientRect().bottom + window.scrollY;
    const start = label.getBoundingClientRect().bottom + window.scrollY;
    const step = 26;
    const count = Math.min(20, Math.max(4, Math.floor((heroBottom - start - 20) / step)));
    for (let i = 0; i < count; i++) {
      const s = document.createElement('span');
      s.className = 'auto-arrow';
      s.textContent = '▼';
      s.style.animationDelay = ((i + 1) * 0.16) + 's';
      hint.appendChild(s);
    }
  };
  fill();
  window.addEventListener('resize', fill);
})();
