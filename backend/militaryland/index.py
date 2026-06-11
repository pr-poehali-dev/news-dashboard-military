"""
Агрегатор военных новостей.
Источники: АрміяInform (armyinform.com.ua) — официальное агентство Минобороны Украины.
Получает данные через rss2json.com и прямой RSS.
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

SOURCES = [
    {
        "name":  "АрміяInform",
        "rss":   "https://armyinform.com.ua/feed/",
        "label": "armyinform.com.ua",
    },
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
}


def normalize_item(item: dict, source_name: str) -> dict:
    title    = item.get("title", "")
    link     = item.get("link", "") or item.get("guid", "")
    desc_raw = item.get("description", "") or item.get("content", "")
    desc     = BeautifulSoup(desc_raw, "lxml").get_text(strip=True)[:300] if desc_raw else ""
    date_str = item.get("pubDate", "") or item.get("published", "")

    image = item.get("thumbnail", "")
    enc   = item.get("enclosure")
    if isinstance(enc, dict) and not image:
        image = enc.get("link", "") or enc.get("url", "")
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
        "source":      source_name,
    }


def fetch_rss2json(rss_url: str, source_name: str, count: int = 30) -> list:
    url  = f"https://api.rss2json.com/v1/api.json?rss_url={rss_url}&count={count}"
    resp = requests.get(url, timeout=15)
    data = resp.json()
    if data.get("status") == "ok":
        return [normalize_item(i, source_name) for i in data.get("items", []) if i.get("title")]
    return []


def fetch_direct_rss(rss_url: str, source_name: str) -> list:
    resp = requests.get(rss_url, headers=HEADERS, timeout=15, verify=False)
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
            "source":      source_name,
        })
    return articles


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    params = event.get("queryStringParameters") or {}
    page   = int(params.get("page", 1))

    all_articles = []

    for src in SOURCES:
        items = []
        # Способ 1: rss2json
        try:
            items = fetch_rss2json(src["rss"], src["name"])
        except Exception:
            pass
        # Способ 2: прямой RSS
        if not items:
            try:
                items = fetch_direct_rss(src["rss"], src["name"])
            except Exception:
                pass
        all_articles.extend(items)

    # Сортируем по дате (новые первыми)
    def parse_date(d: str):
        try:
            return datetime.strptime(d[:25], "%a, %d %b %Y %H:%M:%S")
        except Exception:
            try:
                return datetime.fromisoformat(d[:19])
            except Exception:
                return datetime.min

    all_articles.sort(key=lambda a: parse_date(a.get("date", "")), reverse=True)

    per_page = 20
    start    = (page - 1) * per_page
    paged    = all_articles[start:start + per_page]

    return {
        "statusCode": 200,
        "headers":    {**CORS, "Content-Type": "application/json"},
        "body":       json.dumps({
            "articles":   paged,
            "total":      len(all_articles),
            "page":       page,
            "per_page":   per_page,
            "fetched_at": datetime.utcnow().isoformat() + "Z",
        }, ensure_ascii=False),
    }
