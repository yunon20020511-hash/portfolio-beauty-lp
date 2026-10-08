"""Google Fonts から「index.html で使っている文字だけ」のフォントを取得し、fonts/ に保存する。

- Noto Sans JP は通常 40 前後のファイルに分割配信され、モバイルで表示が遅くなる。
  Google Fonts API の text パラメータで使用文字だけに絞り、1 ウェイト 1 ファイルにする。
- 自サイトから配信することで外部ドメインへの接続待ちをなくし、preload もできる。
- フォントのライセンスは SIL Open Font License 1.1（fonts/OFL.txt）。

使い方: python tools/build_fonts.py   （文言を変更したら再実行する）
"""
import html
import re
import string
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FONT_DIR = ROOT / "fonts"
CSS_OUT = ROOT / "css" / "fonts.css"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"

FAMILIES = [
    # (Google Fonts の family 指定, 保存名の接頭辞, 対象文字)
    ("Noto+Sans+JP:wght@400;500", "noto-sans-jp", "page"),
    ("Cormorant+Garamond:ital,wght@0,500;0,600;1,500", "cormorant-garamond", "ascii"),
]


def page_chars() -> str:
    src = (ROOT / "index.html").read_text(encoding="utf-8")
    body = src[src.index("<body"):]
    body = re.sub(r"<(script|style|svg)\b.*?</\1>", " ", body, flags=re.S)
    body = re.sub(r"<!--.*?-->", " ", body, flags=re.S)
    text = html.unescape(re.sub(r"<[^>]+>", " ", body))
    # CSS の content で出している文字と英数字・記号は常に含める
    text += "※AQ" + string.printable
    return "".join(sorted({c for c in text if not c.isspace()}))


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req) as res:
        return res.read()


def main() -> None:
    FONT_DIR.mkdir(exist_ok=True)
    chars = {"page": page_chars(), "ascii": string.printable.strip()}
    out = ["/* tools/build_fonts.py で生成。直接編集しない */"]
    saved = {}  # 取得元 URL -> 保存名（可変フォントは複数ウェイトで同じファイルになる）
    for family, prefix, target in FAMILIES:
        query = urllib.parse.quote(chars[target], safe="")
        css = fetch(f"https://fonts.googleapis.com/css2?family={family}&display=swap&text={query}").decode()
        for block in re.findall(r"@font-face\s*{.*?}", css, flags=re.S):
            weight = re.search(r"font-weight:\s*(\d+)", block).group(1)
            style = re.search(r"font-style:\s*(\w+)", block).group(1)
            src_url = re.search(r"url\((.*?)\)", block).group(1)
            name = saved.get(src_url)
            if name is None:
                name = f"{prefix}{'-italic' if style == 'italic' else ''}.woff2"
                if name in saved.values():
                    name = name.replace(".woff2", f"-{weight}.woff2")
                (FONT_DIR / name).write_bytes(fetch(src_url))
                saved[src_url] = name
            block = re.sub(r"src:.*?;", f"src: url(../fonts/{name}) format('woff2');", block, flags=re.S)
            out.append(block)
            print(f"{name}: {(FONT_DIR / name).stat().st_size // 1024} KB")
    CSS_OUT.write_text("\n".join(out) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
