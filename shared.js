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
// 金額別リンク(事前設定金額入り・Stripe側で変更も可)
const TIP_LINKS = {
  clap:    'https://buy.stripe.com/14AbJ3e7S8Yr6frbMd0x209', // ¥100 拍手
  bravo:   'https://buy.stripe.com/8x2bJ3bZK7Un47jcQh0x20a', // ¥500 ブラボー!
  bouquet: 'https://buy.stripe.com/dRm8wR4xib6z5bn6rT0x20b', // ¥1,000 花束
  ovation: 'https://buy.stripe.com/aFacN7aVGgqT33f2bD0x20c', // ¥3,000 スタンディングオベーション
  patron:  'https://buy.stripe.com/5kQ4gB7Ju2A347j8A10x20d'  // ¥10,000 パトロン
};
// 金額自由リンク(mainボタン・フォールバック)
const STRIPE_LINK = 'https://buy.stripe.com/3cIdRb0h22A36fr03v0x20e';

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
  const withId = (url) => url + (url.includes('?') ? '&' : '?') + 'client_reference_id=' + encodeURIComponent(CLIENT_ID);
  tips.forEach(a => {
    a.href = withId(TIP_LINKS[a.dataset.tip] || STRIPE_LINK);
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

// ===== SNS共有ボタン(ハッシュタグ投稿) =====
// モバイルでは navigator.share(OSの共有シート)を優先。
// X公式アプリの投稿画面に直接渡るので、アプリ内Webのログイン要求を回避できる。
(function setupSns() {
  const btn = document.getElementById('snsShareBtn');
  if (!btn) return;
  const text = '#カクシンハン #ロミジュリツアー2026';
  const intentUrl = 'https://x.com/intent/post?text=' + encodeURIComponent(text);
  btn.href = intentUrl;
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  btn.addEventListener('click', (e) => {
    track('share_click');
    if (isAndroid) {
      // Android: intent:// 構文。アプリがあれば直接起動、
      // なければ browser_fallback_url へブラウザが自動で遷移
      e.preventDefault();
      window.location.href = 'intent://post?message=' + encodeURIComponent(text) +
        '#Intent;scheme=twitter;package=com.twitter.android;S.browser_fallback_url=' +
        encodeURIComponent(intentUrl) + ';end';
      return;
    }
    if (isIOS) {
      // iOS: twitter:// でXアプリの投稿画面を開く(X重視・共有シートは使わない)。
      // アプリ未インストールの場合のみ、5秒後にブラウザ版Xの投稿画面へ。
      // アプリが起動すれば(画面が隠れる/フォーカスが外れる)タイマーを即キャンセル。
      e.preventDefault();
      const timer = setTimeout(() => { window.location.href = intentUrl; }, 5000);
      const cancel = () => clearTimeout(timer);
      window.addEventListener('pagehide', cancel, { once: true });
      window.addEventListener('blur', cancel, { once: true });
      document.addEventListener('visibilitychange', () => { if (document.hidden) cancel(); }, { once: true });
      window.location.href = 'twitter://post?message=' + encodeURIComponent(text);
    }
    // PC: x.comのintentをそのまま開く(リダイレクトなし)
  });
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

