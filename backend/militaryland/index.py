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
    {"name": "ArmiyaInform",   "rss": "https://armyinform.com.ua/feed/"},
    {"name": "Ukrinform",      "rss": "https://www.ukrinform.ua/rss/block-war"},
    {"name": "Censor.NET",     "rss": "https://censor.net/ru/rss/news"},
    {"name": "Mil.in.ua",      "rss": "https://mil.in.ua/uk/feed/"},
    {"name": "Defence Ukraine","rss": "https://defence-ua.com/feed/"},
    {"name": "Pravda Ukraine", "rss": "https://www.pravda.com.ua/rss/view_news/"},
    {"name": "UNIAN War",      "rss": "https://www.unian.net/rss/war.xml"},
    {"name": "Interfax UA",    "rss": "https://ua.interfax.com.ua/news/military/rss.xml"},
    {"name": "Suspilne",       "rss": "https://suspilne.media/rss.xml"},
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "application/rss+xml, application/xml, text/xml, */*",
}


def get_image(item_dict, desc_raw):
    image = item_dict.get("thumbnail", "")
    enc = item_dict.get("enclosure")
    if isinstance(enc, dict) and not image:
        image = enc.get("link", "") or enc.get("url", "")
    if not image and desc_raw:
        s = BeautifulSoup(desc_raw, "lxml")
        t = s.find("img")
        if t:
            image = t.get("src", "")
    return image or ""


def normalize_item(item, source_name):
    title    = item.get("title", "")
    link     = item.get("link", "") or item.get("guid", "")
    desc_raw = item.get("description", "") or item.get("content", "")
    desc     = BeautifulSoup(desc_raw, "lxml").get_text(strip=True)[:300] if desc_raw else ""
    date_str = item.get("pubDate", "") or item.get("published", "")
    image    = get_image(item, desc_raw)
    category = "News"
    cats = item.get("categories", [])
    if isinstance(cats, list) and cats and isinstance(cats[0], str):
        category = cats[0]
    return {
        "title": title, "description": desc, "link": link,
        "date": date_str, "image": image, "category": category,
        "source": source_name,
    }


def via_rss2json(rss_url, source_name):
    url  = "https://api.rss2json.com/v1/api.json?rss_url=" + rss_url + "&count=20"
    resp = requests.get(url, timeout=6)
    data = resp.json()
    if data.get("status") == "ok" and data.get("items"):
        return [normalize_item(i, source_name) for i in data["items"] if i.get("title")]
    return []


def via_direct(rss_url, source_name):
    resp = requests.get(rss_url, headers=HEADERS, timeout=6, verify=False)
    if resp.status_code != 200:
        return []
    soup = BeautifulSoup(resp.text, "lxml-xml")
    out  = []
    for item in soup.select("item")[:20]:
        te = item.find("title")
        le = item.find("link")
        de = item.find("description")
        pe = item.find("pubDate")
        ce = item.find("category")
        title = te.get_text(strip=True) if te else ""
        if not title:
            continue
        draw  = de.get_text() if de else ""
        dtext = BeautifulSoup(draw, "lxml").get_text(strip=True)[:300]
        img   = ""
        enc   = item.find("enclosure")
        if enc:
            img = enc.get("url", "")
        if not img and draw:
            s = BeautifulSoup(draw, "lxml")
            t = s.find("img")
            if t:
                img = t.get("src", "")
        out.append({
            "title": title, "description": dtext,
            "link": le.get_text(strip=True) if le else "",
            "date": pe.get_text(strip=True) if pe else "",
            "image": img,
            "category": ce.get_text(strip=True) if ce else "News",
            "source": source_name,
        })
    return out


def fetch_one(src):
    result = []
    try:
        result = via_rss2json(src["rss"], src["name"])
    except BaseException:
        result = []
    if not result:
        try:
            result = via_direct(src["rss"], src["name"])
        except BaseException:
            result = []
    return result


def safe_date(d):
    if not d:
        return datetime.min
    for fmt in ("%a, %d %b %Y %H:%M:%S %z", "%a, %d %b %Y %H:%M:%S"):
        try:
            return datetime.strptime(d.strip()[:30], fmt)
        except ValueError:
            pass
    try:
        return datetime.fromisoformat(d[:19])
    except ValueError:
        return datetime.min


def handler(event, context):
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    params = event.get("queryStringParameters") or {}
    page   = int(params.get("page", 1))

    all_articles    = []
    active_sources  = []

    for src in SOURCES:
        items = fetch_one(src)
        if items:
            all_articles.extend(items)
            active_sources.append(src["name"])

    all_articles.sort(key=lambda a: safe_date(a.get("date", "")), reverse=True)

    seen  = set()
    dedup = []
    for a in all_articles:
        if a["link"] not in seen:
            seen.add(a["link"])
            dedup.append(a)

    per_page = 20
    start    = (page - 1) * per_page
    paged    = dedup[start:start + per_page]

    return {
        "statusCode": 200,
        "headers":    {**CORS, "Content-Type": "application/json"},
        "body":       json.dumps({
            "articles":       paged,
            "total":          len(dedup),
            "page":           page,
            "per_page":       per_page,
            "active_sources": active_sources,
            "fetched_at":     datetime.utcnow().isoformat() + "Z",
        }, ensure_ascii=False),
    }
