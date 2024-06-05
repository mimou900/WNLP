// Function to get query parameters from the URL
function getQueryParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }
  
  // Define API URL and query parameter
  const text = getQueryParameter('text');
  const apiUrl = `http://localhost:5000/analyze-text?text=${encodeURIComponent(text)}`;
  
  function fetchAndDisplayData() {
    // Log the start of the fetch request
    console.log('Starting fetch request...');

    // Fetch data from the API
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            // Log the raw data to understand its structure
            console.log('API response data:', data);

            // Since data is an array of arrays, handle it accordingly
            data.forEach((subArray) => {
                subArray.forEach((item) => {
                    const { label, score } = item;

                    // Log the individual items
                    console.log('Label:', label, 'Score:', score);

                    // Initialize circular progress bar
                    $(document).ready(function() {
                        if (label === 'Positive') {
                            $('.card-01').eq(2).find('.bar').circleProgress({ value: score });
                            $('.card-01').eq(1).find('.bar').circleProgress({ value: 0 });
                            $('.card-01').eq(0).find('.bar').circleProgress({ value: 1 - score });
                        } else if (label === 'Negative') {
                            $('.card-01').eq(0).find('.bar').circleProgress({ value: score });
                            $('.card-01').eq(1).find('.bar').circleProgress({ value: 0 });
                            $('.card-01').eq(2).find('.bar').circleProgress({ value: 1 - score });
                        } else if (label === 'Neutral') {
                            $('.card-01').eq(0).find('.bar').circleProgress({ value: 0 });
                            $('.card-01').eq(1).find('.bar').circleProgress({ value: 1 });
                            $('.card-01').eq(2).find('.bar').circleProgress({ value: 0 });
                        }

                        // Circle progress animation event
                        $(".circle .bar").on('circle-animation-progress', function(event, progress, stepValue) {
                            $(this).parent().find(".box span").text(String(stepValue.toFixed(2) * 100) + "%");
                        });
                    });
                });
            });
        })
        .catch(error => {
            console.error('Error fetching data from API:', error);
        });
}

// Listen for DOM content loaded and execute the function
document.addEventListener('DOMContentLoaded', fetchAndDisplayData);
