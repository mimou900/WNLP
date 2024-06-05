// Function to get query parameters from the URL
function getQueryParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Define API URL and query parameter
const urlToAnalyze = getQueryParameter('url');  // Retrieve the 'url' query parameter
const apiUrl = `http://localhost:6000/analyze-url?url=${encodeURIComponent(urlToAnalyze)}`;

// Function to fetch and display data
// Function to fetch and display data
function fetchAndDisplayData() {
    // Log the start of the fetch request
    console.log('Starting fetch request...');

    // Fetch data from the API
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            // Log the raw data to understand its structure
            console.log('API response data:', data);

            // Initialize variables for scores
            let positiveScore = 0;
            let neutralScore = 0;
            let negativeScore = 0;

            // Extract sentiment result from API response
            const sentimentResult = data.sentiment_result;

            // Calculate scores for positive, neutral, and negative labels
            sentimentResult.forEach((item) => {
                const { label, score } = item;
                if (label === 'positive') {
                    positiveScore += score;
                } else if (label === 'neutral') {
                    neutralScore += score;
                } else if (label === 'negative') {
                    negativeScore += score;
                }
            });

            // Total score is the sum of all three sentiment scores
            const totalScore = positiveScore + neutralScore + negativeScore;

            // Log the total scores
            console.log('Total scores:', { positive: positiveScore, neutral: neutralScore, negative: negativeScore });

            // Update progress bars and display percentages
            $(document).ready(function() {
                $('.card-01').eq(0).find('.bar').circleProgress({ value: positiveScore });
                $('.card-01').eq(1).find('.bar').circleProgress({ value: neutralScore });
                $('.card-01').eq(2).find('.bar').circleProgress({ value: negativeScore });

                // Attach the animation progress event handler to each circle progress bar
                $(".circle .bar").on('circle-animation-progress', function(event, progress, stepValue) {
                    $(this).parent().find("span").text(String(stepValue.toFixed(2) * 100) + "%");
                });
            });
        })
        .catch(error => {
            console.error('Error fetching data from API:', error);
        });
}

// Listen for DOM content loaded and execute the function
document.addEventListener('DOMContentLoaded', fetchAndDisplayData);
