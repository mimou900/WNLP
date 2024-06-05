from flask import Flask, request, jsonify
from typing import Dict
from playwright.sync_api import sync_playwright
import jmespath
import requests
from flask_cors import CORS


API_URL = "https://api-inference.huggingface.co/models/CAMeL-Lab/bert-base-arabic-camelbert-da-sentiment"
headers = {"Authorization": "Bearer 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"}

app = Flask(__name__)
CORS(app)

# Function to query the Hugging Face API
def query(payload):
    response = requests.post(API_URL, headers=headers, json=payload)
    return response.json()

# Function to scrape a single tweet page
def scrape_tweet(url: str) -> dict:
    _xhr_calls = []

    def intercept_response(response):
        """Capture all background requests and save them."""
        if response.request.resource_type == "xhr":
            _xhr_calls.append(response)
        return response

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)  # Launch headless browser
        context = browser.new_context()
        page = context.new_page()

        # Enable background request intercepting:
        page.on("response", intercept_response)
        # Go to URL and wait for the page to load
        page.goto(url)
        page.wait_for_selector("[data-testid='tweet']")

        # Find all tweet background requests:
        tweet_calls = [f for f in _xhr_calls if "TweetResultByRestId" in f.url]
        for xhr in tweet_calls:
            data = xhr.json()
            return data['data']['tweetResult']['result']

# Function to parse tweet data
def parse_tweet(data: Dict) -> Dict:
    """Parse Twitter tweet JSON dataset for the most important fields."""
    result = jmespath.search(
        """{
        created_at: legacy.created_at,
        attached_urls: legacy.entities.urls[].expanded_url,
        attached_media: legacy.entities.media[].media_url_https,
        tagged_users: legacy.entities.user_mentions[].screen_name,
        tagged_hashtags: legacy.entities.hashtags[].text,
        favorite_count: legacy.favorite_count,
        quote_count: legacy.quote_count,
        reply_count: legacy.reply_count,
        retweet_count: legacy.retweet_count,
        text: legacy.full_text,
        is_quote: legacy.is_quote_status,
        is_retweet: legacy.retweeted,
        language: legacy.lang,
        user_id: legacy.user_id_str,
        id: legacy.id_str,
        conversation_id: legacy.conversation_id_str,
        source: source,
        views: views.count
    }""",
        data,
    )
    # Handle poll data if any
    result["poll"] = {}
    poll_data = jmespath.search("card.legacy.binding_values", data) or []
    for poll_entry in poll_data:
        key, value = poll_entry["key"], poll_entry["value"]
        if "choice" in key:
            result["poll"][key] = value["string_value"]
        elif "end_datetime" in key:
            result["poll"]["end"] = value["string_value"]
        elif "last_updated_datetime" in key:
            result["poll"]["updated"] = value["string_value"]
        elif "counts_are_final" in key:
            result["poll"]["ended"] = value["boolean_value"]
        elif "duration_minutes" in key:
            result["poll"]["duration"] = value["string_value"]
    
    user_data = jmespath.search("core.user_results.result", data)
    if user_data:
        result["user"] = ''
    return result

# Function to scrape Twitter and return the tweet text
def scrape_twitter(url):
    data = parse_tweet(scrape_tweet(url))
    return data['text']

# Function to perform sentiment analysis
def sentiment_analysis(text):
    output = query({"inputs": text})
    return output[0]

# Define the Flask route
@app.route('/analyze-url', methods=['GET'])
def analyze():
    url = request.args.get('url')
    
    # Check if URL parameter is provided
    if not url:
        return jsonify({"error": "No URL provided. Please provide a valid URL."}), 400
    
    # Perform sentiment analysis
    try:
        # Scrape Twitter and analyze sentiment
        text = scrape_twitter(url)
        sentiment = sentiment_analysis(text)
        # Return the result as JSON
        return jsonify({"sentiment_result": sentiment, "tweet_text": text})
    except KeyError:
        # Handle the case where the text could not be extracted or sentiment analysis failed
        return jsonify({
            "sentiment_result": {"label": "neutral", "score": 0},
            "tweet_text": "server is starting, please try again after 20 seconds."
        })
    except Exception as e:
        # Handle any other errors
        return jsonify({
            "error": f"An error occurred: {str(e)}"
        }), 400

if __name__ == '__main__':
    app.run(debug=True, port=6000)  # Change the port to 6000
