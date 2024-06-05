from flask import Flask, request, jsonify
import praw
from transformers import pipeline
from flask_cors import CORS
import re

app = Flask(__name__)
CORS(app)

# Set up Reddit API client
reddit = praw.Reddit(
    client_id='LChxVKKanHy2xEOwKnpDxQ',
    client_secret='RgtMN6iE-bkUi8wd6QbaQEiCM2SYCg',
    user_agent='Competitive-Judge236'
)

# Load the sentiment analysis model and tokenizer
sentiment_model = pipeline(
    "sentiment-analysis",
    model="PRAli22/AraBert-Arabic-Sentiment-Analysis"
)

def normalize_text(text):
    """Normalize text: convert to lowercase and remove punctuation."""
    text = text.lower()
    # Use regex to remove non-Arabic characters
    text = re.sub(r'[^\u0600-\u06FF\s]', '', text)
    return text

@app.route('/analyze', methods=['GET'])
def analyze():
    # Get query parameter from request
    search_query = request.args.get('query')
    if not search_query:
        return jsonify({
            'error': 'No query provided. Please specify a query.'
        }), 400

    # Get the limit parameter from request (default to 20)
    limit = request.args.get('limit', default=20, type=int)
    if limit < 1:
        return jsonify({
            'error': 'Invalid limit value. Please specify a positive integer.'
        }), 400

    # Get the type parameter from request (e.g., "sport")
    search_type = request.args.get('type')

    # Determine the subreddit or keyword to search based on the specified type
    subreddit_to_search = None
    if search_type == 'sport':
        subreddit_to_search = 'sports'
    else:
        subreddit_to_search = 'all'  # Default to all subreddits if no specific type is provided

    # Fetch submissions based on the specified query, type, and limit
    if subreddit_to_search == 'all':
        submissions = reddit.subreddit(subreddit_to_search).search(search_query, limit=limit, time_filter='week')
    else:
        submissions = reddit.subreddit(subreddit_to_search).search(search_query, limit=limit, time_filter='week')

    # Initialize lists and counters for sentiment analysis results
    title_ratings = []
    recent_titles = []
    total_rating = {
        'positive': 0,
        'negative': 0,
        'neutral': 0
    }

    # Process each submission
    for submission in submissions:
        title = submission.title
        normalized_title = normalize_text(title)
        result = sentiment_model(normalized_title)
        label = result[0]['label'].lower()  # Convert label to lowercase

        # Increment the count for the corresponding label
        total_rating[label] += 1

        # Get author information
        author_username = submission.author.name if submission.author else 'Unknown'
        author_profile_picture = submission.author.icon_img if submission.author and submission.author.icon_img else ''

        # Add title rating to the list
        title_ratings.append({
            'title': title,
            'label': label,
            'score': result[0]['score'],
            'author': {
                'username': author_username,
                'profile_picture': author_profile_picture
            }
        })

        # Add title to the recent titles list
        recent_titles.append(title)

    # Prepare the JSON response
    response = {
        'title_ratings': title_ratings,
        'total_rating': total_rating,
        'recent_titles': recent_titles
    }

    return jsonify(response)

@app.route('/analyze-text', methods=['GET'])
def analyze_text():
    text = request.args.get('text')
    if not text:
        return jsonify({'error': 'No text provided. Please provide text for sentiment analysis.'}), 400

    # Normalize the text
    normalized_text = normalize_text(text)

    # Analyze the sentiment of the normalized text
    result = sentiment_model(normalized_text)

    # Prepare the JSON response with sentiment analysis results
    sentiment_scores = []

    # Iterate through the list of sentiment results and add each to sentiment_scores
    for sentiment in result:
        sentiment_scores.append({
            'label': sentiment['label'].capitalize(),
            'score': sentiment['score']
        })

    # Wrap the sentiment_scores list in a list to match the desired output format
    response = [sentiment_scores]

    # Return the response as JSON
    return jsonify(response)



if __name__ == '__main__':
    app.run(debug=True)
