"""
Прокси-агрегатор для militaryland.net.
Получает данные через rss2json.com (публичный RSS→JSON конвертер) и прямой RSS.
"""

import json
import urllib3
import requests
from bs4 import BeautifulSoup
from datetime import datetime

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

RSS_URL  = "https://militaryland.net/feed/"
RSS2JSON = f"https://api.rss2json.com/v1/api.json?rss_url={RSS_URL}&count=30"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
}


def normalize_item(item: dict) -> dict:
    title    = item.get("title", "")
    link     = item.get("link", "") or item.get("url", "") or item.get("guid", "")
    desc_raw = item.get("description", "") or item.get("summary", "") or item.get("content", "")
    desc     = BeautifulSoup(desc_raw, "lxml").get_text(strip=True)[:300] if desc_raw else ""
    date_str = item.get("pubDate", "") or item.get("published", "")

    image = ""
    enc = item.get("enclosure")
    if isinstance(enc, dict):
        image = enc.get("link", "")
    if not image:
        image = item.get("thumbnail", "")
    if not image and desc_raw:
        isoup = BeautifulSoup(desc_raw, "lxml")
        itag  = isoup.find("img")
        if itag:
            image = itag.get("src", "")

    category = "Новости"
    cats = item.get("categories", [])
    if isinstance(cats, list) and cats:
        first = cats[0]
        if isinstance(first, str) and first:
            category = first

    return {
        "title":       title,
        "description": desc,
        "link":        link,
        "date":        date_str,
        "image":       image,
        "category":    category,
    }


def fetch_via_rss2json() -> list:
    resp = requests.get(RSS2JSON, timeout=15)
    data = resp.json()
    if data.get("status") == "ok":
        return [normalize_item(i) for i in data.get("items", []) if i.get("title")]
    return []


def fetch_direct_rss() -> list:
    resp = requests.get(RSS_URL, headers=HEADERS, timeout=15, verify=False)
    if resp.status_code != 200:
        return []
    soup     = BeautifulSoup(resp.text, "lxml-xml")
    articles = []
    for item in soup.select("item")[:30]:
        title_el = item.find("title")
        link_el  = item.find("link")
        desc_el  = item.find("description")
        pub_el   = item.find("pubDate")
        cat_el   = item.find("category")

        title = title_el.get_text(strip=True) if title_el else ""
        if not title:
            continue

        desc_raw  = desc_el.get_text() if desc_el else ""
        desc_text = BeautifulSoup(desc_raw, "lxml").get_text(strip=True)[:300]

        image = ""
        enc   = item.find("enclosure")
        if enc:
            image = enc.get("url", "")
        if not image and desc_raw:
            isoup = BeautifulSoup(desc_raw, "lxml")
            itag  = isoup.find("img")
            if itag:
                image = itag.get("src", "")

        articles.append({
            "title":       title,
            "description": desc_text,
            "link":        link_el.get_text(strip=True) if link_el else "",
            "date":        pub_el.get_text(strip=True) if pub_el else "",
            "image":       image,
            "category":    cat_el.get_text(strip=True) if cat_el else "Новости",
        })
    return articles


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    params = event.get("queryStringParameters") or {}
    page   = int(params.get("page", 1))

    articles = []
    source   = ""
    last_err = None

    # Способ 1: rss2json.com — обходит Cloudflare
    try:
        articles = fetch_via_rss2json()
        source   = "rss2json"
    except Exception as e:
        last_err = str(e)

    # Способ 2: прямой RSS с Googlebot UA
    if not articles:
        try:
            articles = fetch_direct_rss()
            source   = "direct_rss"
        except Exception as e:
            last_err = str(e)

    if not articles and last_err:
        return {
            "statusCode": 502,
            "headers": CORS,
            "body": json.dumps({
                "error":    f"Не удалось получить данные: {last_err}",
                "articles": [],
            }, ensure_ascii=False),
        }

    per_page = 20
    start    = (page - 1) * per_page
    paged    = articles[start:start + per_page]

    return {
        "statusCode": 200,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps({
            "articles":   paged,
            "total":      len(articles),
            "page":       page,
            "per_page":   per_page,
            "source_url": source,
            "fetched_at": datetime.utcnow().isoformat() + "Z",
        }, ensure_ascii=False),
    }
