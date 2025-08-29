import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import chromadb
from chromadb.config import Settings
from datetime import datetime
import json
import logging
import os
import random
import time

# -----------------------------
# Logging
# -----------------------------
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("W3SchoolsScraper")

# -----------------------------
# ChromaDB setup
# -----------------------------
db_path = "./w3schools_chroma_db"
chroma_client = chromadb.PersistentClient(path=db_path, settings=Settings())
collection = chroma_client.get_or_create_collection(name="w3schools_tutorials")

# -----------------------------
# Scraper function
# -----------------------------
def scrape_w3schools_tutorial(start_url, tutorial_name, max_pages=10):
    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                      "AppleWebKit/537.36 (KHTML, like Gecko) "
                      "Chrome/91.0.4472.124 Safari/537.36"
    })

    results = []
    url = start_url
    count = 0
    base_url = "/".join(start_url.split("/")[:-1]) + "/"  # e.g., https://www.w3schools.com/java/
    visited_urls = set()

    while url and count < max_pages:
        if url in visited_urls:
            logger.info(f"Already visited {url}, stopping to avoid loop.")
            break

        visited_urls.add(url)
        count += 1
        logger.info(f"[{tutorial_name}] Scraping page {count}: {url}")

        try:
            response = session.get(url, timeout=15)
            response.raise_for_status()
        except Exception as e:
            logger.error(f"❌ Error fetching {url}: {e}")
            break

        soup = BeautifulSoup(response.text, "html.parser")

        # Extract main tutorial content
        main_div = soup.select_one("div#w3-main") or soup.select_one("div#main.w3-col.l10.m12")

        content_parts = []
        if main_div:
            # Remove unwanted sections
            for junk in main_div.select("div#mainLeaderboard, div#adngin-main_leaderboard-0, div.user-profile-bottom-wrapper, iframe, script, style"):
                junk.decompose()

            # Collect headings, paragraphs, lists, and code examples
            for tag in main_div.find_all(["h1", "h2", "h3", "p", "li", "pre", "code"]):
                text = tag.get_text(" ", strip=True)
                if text:
                    content_parts.append(text)

        content_text = "\n".join(content_parts).strip()

        # Page title
        title = soup.title.string.strip() if soup.title else f"{tutorial_name} Page {count}"

        # Save to results
        resource = {
            "tutorial": tutorial_name,
            "title": title,
            "url": url,
            "content": content_text,
            "scraped_at": datetime.now().isoformat()
        }
        results.append(resource)

        # Save to ChromaDB
        collection.upsert(
            documents=[content_text],
            metadatas=[resource],
            ids=[f"{tutorial_name}_{count}"]
        )

        # Find "Next ❯" button
        next_btn = soup.find("a", string=lambda s: s and "Next" in s)
        if next_btn and next_btn.get("href"):
            next_url = urljoin(url, next_btn["href"])

            # Skip reference pages
            if "ref_" in next_url:
                logger.info(f"Next page is a reference page: {next_url}. Stopping.")
                break

            # Only follow pages inside the tutorial base URL
            if next_url.startswith(base_url) and next_url not in visited_urls:
                url = next_url
            else:
                logger.info(f"Next page is outside base URL or already visited: {next_url}. Stopping.")
                break
        else:
            logger.info(f"No next page found for {url}. Stopping.")
            break

        # Random sleep to avoid throttling
        time.sleep(random.uniform(1, 2))

    return results

# -----------------------------
# Run scraper for multiple tutorials
# -----------------------------
if __name__ == "__main__":
    tutorials = {
        "Python": "https://www.w3schools.com/python/default.asp",
        "Java": "https://www.w3schools.com/java/java_intro.asp",
        "JavaScript": "https://www.w3schools.com/js/default.asp",
        "C": "https://www.w3schools.com/c/c_intro.php",
        "C++": "https://www.w3schools.com/cpp/default.asp",
        "C#": "https://www.w3schools.com/cs/default.asp",
        "SQL": "https://www.w3schools.com/sql/default.asp",
        "PHP": "https://www.w3schools.com/php/default.asp",
        "HTML": "https://www.w3schools.com/html/default.asp",
        "CSS": "https://www.w3schools.com/css/default.asp"
    }

    all_results = []
    os.makedirs("w3schools_data", exist_ok=True)

    for name, url in tutorials.items():
        results = scrape_w3schools_tutorial(url, name)
        all_results.extend(results)
        logger.info(f"Finished scraping {name}, pages collected: {len(results)}")

    # Save all data in one JSON file
    output_file = "w3schools_data/all_tutorials.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(all_results, f, indent=2, ensure_ascii=False)

    logger.info(f"✅ All tutorials saved to {output_file}")
