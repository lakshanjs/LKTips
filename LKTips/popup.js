let dictionary = {};
let selectedIndex = -1; // To track the currently selected suggestion

document.addEventListener('DOMContentLoaded', function() {
    // Load the dictionary
    fetch(chrome.runtime.getURL('dictionary.json'))
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            dictionary = data;
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });

    const wordInput = document.getElementById('wordInput');
    const suggestionsList = document.getElementById('suggestions');
    const lookupButton = document.getElementById('lookupButton');
    const resultDiv = document.getElementById('result');

    // Event listener for input field to show suggestions
    wordInput.addEventListener('input', function() {
        const input = wordInput.value.trim().toLowerCase();
        suggestionsList.innerHTML = ''; // Clear previous suggestions
        selectedIndex = -1; // Reset selected index on new input

        if (input.length > 0) {
            // Filter dictionary words
            const filteredWords = Object.keys(dictionary)
                .filter(word => word.startsWith(input))
                .slice(0, 10); // Limit to top 10 suggestions

            if (filteredWords.length > 0) {
                filteredWords.forEach(word => {
                    const suggestionItem = document.createElement('li');
                    suggestionItem.textContent = word;
                    suggestionItem.classList.add('suggestion-item');
                    suggestionItem.addEventListener('click', function() {
                        wordInput.value = word; // Set clicked word to input field
                        suggestionsList.innerHTML = ''; // Clear suggestions
                        lookupWord(); // Trigger lookup for the selected word
                    });
                    suggestionsList.appendChild(suggestionItem);
                });
            }
        }
    });

    // Event listener for keyboard navigation and selection
    wordInput.addEventListener('keydown', function(event) {
        const suggestions = document.querySelectorAll('.suggestion-item');
        if (event.key === 'ArrowDown') {
            // Move down the suggestion list
            selectedIndex = (selectedIndex + 1) % suggestions.length;
            updateSelection(suggestions);
        } else if (event.key === 'ArrowUp') {
            // Move up the suggestion list
            selectedIndex = (selectedIndex - 1 + suggestions.length) % suggestions.length;
            updateSelection(suggestions);
        } else if (event.key === 'Enter') {
            // Select the highlighted suggestion or look up the word
            if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                wordInput.value = suggestions[selectedIndex].textContent;
            }
            suggestionsList.innerHTML = ''; // Clear suggestions
            lookupWord(); // Look up the word
        }
    });

    // Event listener for lookup button
    lookupButton.addEventListener('click', function() {
        suggestionsList.innerHTML = ''; // Clear suggestions on lookup
        lookupWord();
    });

    // Function to lookup word meaning
    function lookupWord() {
        const word = wordInput.value.trim().toLowerCase();
        const meaning = dictionary[word] || dictionary[word.replace(/(ed|ing|s)$/, '')];

        if (meaning) {
            resultDiv.textContent = `${word}: ${meaning}`;
        } else {
            resultDiv.textContent = 'Meaning not found.';
        }
    }

    // Function to update the highlighted suggestion
    function updateSelection(suggestions) {
        // Remove highlight from all suggestions
        suggestions.forEach((suggestion, index) => {
            suggestion.classList.remove('highlighted');
            if (index === selectedIndex) {
                suggestion.classList.add('highlighted'); // Highlight the current selection
                suggestion.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); // Scroll the selected item into view
            }
        });
    }
});
