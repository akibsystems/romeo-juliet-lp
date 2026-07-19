#!/usr/bin/env python3
"""Stripe Checkout Sessions を client_reference_id 付きでCSVエクスポート。

アンケート回答(クライアントID列)との突合用。

使い方:
  export STRIPE_SECRET_KEY=sk_live_...   # ダッシュボード > 開発者 > APIキー
  python3 tools/export_sessions.py > sessions.csv

出力列: created(JST), client_reference_id, amount_total, payment_status,
        customer_email, session_id, payment_intent
"""
import csv
import os
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

KEY = os.environ.get('STRIPE_SECRET_KEY')
if not KEY:
    sys.exit('環境変数 STRIPE_SECRET_KEY を設定してください')

JST = timezone(timedelta(hours=9))
BASE = 'https://api.stripe.com/v1/checkout/sessions'


def fetch(params):
    url = BASE + '?' + urllib.parse.urlencode(params)
    req = urllib.request.Request(url)
    req.add_header('Authorization', 'Bearer ' + KEY)
    with urllib.request.urlopen(req) as r:
        import json
        return json.load(r)


w = csv.writer(sys.stdout)
w.writerow(['created_jst', 'client_reference_id', 'amount_total',
            'payment_status', 'customer_email', 'session_id', 'payment_intent'])

params = {'limit': 100}
while True:
    page = fetch(params)
    for s in page['data']:
        created = datetime.fromtimestamp(s['created'], JST).strftime('%Y-%m-%d %H:%M:%S')
        email = (s.get('customer_details') or {}).get('email') or ''
        w.writerow([created, s.get('client_reference_id') or '',
                    s.get('amount_total') or 0, s.get('payment_status'),
                    email, s['id'], s.get('payment_intent') or ''])
    if not page.get('has_more'):
        break
    params['starting_after'] = page['data'][-1]['id']
