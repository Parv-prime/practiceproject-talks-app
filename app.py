import os
import re
import urllib.request
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template

app = Flask(__name__)

# Cache variables to avoid hammering the Google API on every page load
cached_releases = None

def parse_content_html(html, date_str):
    """
    Parses the BigQuery release note entry's HTML content, which typically consists
    of multiple H3 tags (e.g., Feature, Change, Issue, Announcement, Breaking)
    and their corresponding descriptions.
    """
    if not html:
        return []

    # Find all h3 headings and the content between them
    # We use a regex split to find all <h3> headings and their following content.
    parts = re.split(r'<h3>(.*?)</h3>', html)
    updates = []
    
    if len(parts) > 1:
        # parts will be [prefix_text_before_first_h3, type1, content1, type2, content2, ...]
        for i in range(1, len(parts), 2):
            update_type = parts[i].strip()
            update_content = parts[i+1].strip()
            
            # Create a unique ID for this update
            clean_date = date_str.replace(' ', '_').replace(',', '')
            clean_type = update_type.replace(' ', '_')
            update_id = f"{clean_date}_{clean_type}_{i//2}"
            
            # Create a clean text snippet for social sharing (Twitter)
            # Remove all HTML tags
            clean_text = re.sub(r'<[^>]+>', '', update_content)
            # Replace multiple spaces/newlines with a single space
            clean_text = re.sub(r'\s+', ' ', clean_text).strip()
            
            # Format Twitter tweet text
            tweet_text = f"BigQuery Release ({date_str}) - {update_type}:\n\n{clean_text}"
            if len(tweet_text) > 240:
                tweet_text = tweet_text[:237] + "..."
            tweet_text += " #GoogleCloud #BigQuery"

            updates.append({
                'id': update_id,
                'type': update_type,
                'content': update_content,
                'clean_text': clean_text,
                'tweet_text': tweet_text
            })
    else:
        # Fallback if there are no H3 tags (single entry)
        clean_text = re.sub(r'<[^>]+>', '', html)
        clean_text = re.sub(r'\s+', ' ', clean_text).strip()
        tweet_text = f"BigQuery Release ({date_str}):\n\n{clean_text} #GoogleCloud #BigQuery"
        if len(tweet_text) > 240:
            tweet_text = tweet_text[:237] + "..."
            
        updates.append({
            'id': f"{date_str.replace(' ', '_').replace(',', '')}_General_0",
            'type': 'General',
            'content': html,
            'clean_text': clean_text,
            'tweet_text': tweet_text
        })
        
    return updates

def fetch_release_notes():
    """
    Fetches the Atom XML feed from Google Cloud and parses it.
    """
    url = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
    req = urllib.request.Request(
        url,
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AntigravityFeedReader/1.0'}
    )
    
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            xml_data = response.read()
            
        root = ET.fromstring(xml_data)
        # Atom feed namespace
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        
        feed_title = root.find('atom:title', ns).text
        feed_updated = root.find('atom:updated', ns).text
        
        entries = []
        for entry in root.findall('atom:entry', ns):
            title = entry.find('atom:title', ns).text  # Usually the date, e.g., "June 30, 2026"
            updated = entry.find('atom:updated', ns).text
            
            link_elem = entry.find("atom:link[@rel='alternate']", ns)
            link = link_elem.attrib['href'] if link_elem is not None else ""
            
            content_elem = entry.find('atom:content', ns)
            content_html = content_elem.text if content_elem is not None else ""
            
            updates = parse_content_html(content_html, title)
            
            entries.append({
                'date': title,
                'updated_time': updated,
                'link': link,
                'updates': updates
            })
            
        return {
            'success': True,
            'title': feed_title,
            'last_updated': feed_updated,
            'entries': entries
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    global cached_releases
    # Try fetching fresh data
    data = fetch_release_notes()
    if data['success']:
        cached_releases = data
        return jsonify(data)
    else:
        # If fetch fails, return cached if exists, otherwise return error
        if cached_releases:
            # Append warning to cached data
            response_data = dict(cached_releases)
            response_data['warning'] = f"Failed to fetch live data ({data['error']}). Showing cached version."
            return jsonify(response_data)
        return jsonify(data), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
