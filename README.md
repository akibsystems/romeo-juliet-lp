# カジュアルなロミオとジュリエット 感想・応援LP

Theatre Company カクシンハン『カジュアルなロミオとジュリエット』徳島ツアー
(HRWC 2026 | 2026.7.19(日) 12:00 アスティとくしま テレコメディア ホール)
終演時にQRコードで案内する感想・投げ銭ページ。
[natsuyume-lp](https://github.com/tokuo/natsuyume-lp) と同構造。

- Peatix: https://peatix.com/event/5072716

## 内容

- アンケート: 感想(自由記述)+観劇回数・ニックネーム・紹介許諾・年代(任意)
- 投げ銭: Stripe Payment Link(入場無料・投げ銭制のため主要導線)
- サンクス画面: X共有(#カクシンハン #カジュアルロミジュリツアー)・フォロー導線

## デザイン検討用パス

| パス | パターン |
|---|---|
| `/` | **本番(B案採用)** |
| `/a/` | A: ヴェローナの午後 — クリーム×テラコッタ、半券チケット風・明朝 |
| `/b/` | B: ポップ・二家カラー — モンタギュー青×キャピュレット赤(採用・ルートへリダイレクト) |
| `/c/` | C: ネオンナイト — 夜のバルコニー、ネオンピンク×紫 |

## 設定(`shared.js` 冒頭)

- `SURVEY_FORM` / `ENTRY.*` — Google フォームの formResponse URL と entry ID
- `STRIPE_LINK` — 投げ銭の Stripe Payment Link
- `GA_ID` / `CLARITY_ID` — 設定すると GA4 / Microsoft Clarity が有効化。
  投げ銭クリック `support_click`・アンケート送信 `survey_submit`・X共有 `share_click` をイベント送信

## アーキテクチャ

- 配信: GitHub Pages(静的・CDN)— 終演直後のアクセス集中はページ側で吸収
- 感想の保存: Google フォーム formResponse へJSから no-cors 送信
- 決済: Stripe Payment Link(外部リンク)
