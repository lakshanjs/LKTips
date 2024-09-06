let dictionary = {};
let tooltip;
let persistentTooltip = false;
let options = {
    fontSize: '14',
    popupColor: '#F5F5B9',
    fontColor: '#222',
    hoverDelay: 1500,
    triggerMethod: 'hover'
};
let hoverTimeout;

chrome.storage.sync.get(options, function(items) {
    options = items;
    injectStyles();
    initializeListeners();
});

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

function initializeListeners() {
    if (options.triggerMethod === 'hover') {
        document.body.addEventListener('mousemove', handleMouseMove);
        document.body.addEventListener('mouseout', handleMouseOut);
    } else if (options.triggerMethod === 'click') {
        document.body.addEventListener('click', function(event) {
            if (persistentTooltip) {
                removeTooltip();
                persistentTooltip = false;
                return;
            }
            let word = getWordUnderCursor(event);
            if (word) {
                let meaning = findMeaning(word);
                if (meaning) {
                    showTooltip(event, word, meaning, true);
                    persistentTooltip = true;
                }
            }
        });
    }

    document.body.addEventListener('dblclick', function(event) {
        persistentTooltip = true;
        let word = getExactWordUnderCursor(event);
        if (word) {
            let meaning = findMeaning(word);
            if (meaning) {
                showTooltip(event, word, meaning, true);
            }
        }
    });

    document.body.addEventListener('click', function(event) {
        if (persistentTooltip) {
            removeTooltip();
            persistentTooltip = false;
        }
    });
}

function handleMouseMove(event) {
    if (persistentTooltip) {
        return;
    }
    clearTimeout(hoverTimeout); // Clear any previous timeout

    hoverTimeout = setTimeout(() => {
        let word = getExactWordUnderCursor(event);
        if (word) {
            let meaning = findMeaning(word);
            if (meaning) {
                showTooltip(event, word, meaning);
            } else {
                removeTooltip(); // Remove tooltip if no meaning is found
            }
        } else {
            removeTooltip(); // Remove tooltip if no word is found
        }
    }, options.hoverDelay);
}

function handleMouseOut(event) {
    if (!persistentTooltip) {
        removeTooltip();
    }
}

function getExactWordUnderCursor(event) {
    let range, textNode, offset;
    if (document.caretPositionFromPoint) {
        let pos = document.caretPositionFromPoint(event.clientX, event.clientY);
        if (pos) {
            textNode = pos.offsetNode;
            offset = pos.offset;
        }
    } else if (document.caretRangeFromPoint) {
        range = document.caretRangeFromPoint(event.clientX, event.clientY);
        if (range) {
            textNode = range.startContainer;
            offset = range.startOffset;
        }
    }

    if (textNode && textNode.nodeType === Node.TEXT_NODE) {
        let data = textNode.data;
        let i = offset;
        while (i > 0 && !/\s/.test(data[i - 1])) i--;
        let j = offset;
        while (j < data.length && !/\s/.test(data[j])) j++;
        const word = data.slice(i, j).toLowerCase();
        
        // Check if the cursor is exactly on the word
        const range = document.createRange();
        range.setStart(textNode, i);
        range.setEnd(textNode, j);
        const wordRect = range.getBoundingClientRect();
        if (event.clientX >= wordRect.left && event.clientX <= wordRect.right && event.clientY >= wordRect.top && event.clientY <= wordRect.bottom) {
            return word;
        }
    }
    return null;
}

function findMeaning(word) {
    return dictionary[word] || dictionary[word.replace(/(ed|ing|s)$/, '')];
}

function showTooltip(event, word, meaning, persistent = false) {
    removeTooltip();
    tooltip = document.createElement('div');
    tooltip.id = 'lktips-bubble-main';
    tooltip.innerHTML = `
        <div id="lktips-bubble-arrow"></div>
        <div id="lktips-bubble-close"></div>
        <div id="lktips-bubble-query-row">
            <div id="lktips-bubble-query"><b>${word}</b></div>
        </div>
        <div id="lktips-bubble-meaning">${meaning}</div>
    `;
    if (persistent) {
        tooltip.classList.add('persistent');
    }
    document.body.appendChild(tooltip);
    
    // Attach event handler for close button
    document.getElementById('lktips-bubble-close').addEventListener('click', removeTooltip);
    
    positionTooltip(event);
}

function positionTooltip(event) {
    let rect = tooltip.getBoundingClientRect();
    let arrow = document.getElementById('lktips-bubble-arrow');

    tooltip.style.left = `${event.pageX - rect.width / 2}px`;
    tooltip.style.top = `${event.pageY - rect.height - 15}px`; // Adjusted to include the arrow height

    arrow.style.left = `${rect.width / 2 - 10}px`; // Center the arrow horizontally
    arrow.style.top = `${rect.height - 2}px`; // Position the arrow at the bottom of the tooltip
}

function removeTooltip() {
    if (tooltip) {
        tooltip.remove();
        tooltip = null;
    }
}

function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
        #lktips-bubble-main {
            background-color: ${options.popupColor};
            z-index: 99997;
            border: 2px solid #DEC94A;
            border-radius: 4px;
            box-shadow: 0 0 20px rgba(0, 0, 0, .5);
            color: ${options.fontColor};
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: ${options.fontSize}px;
            line-height: normal;
            padding: 9px;
            position: absolute;
            width: 300px;
        }

        #lktips-bubble-main:after {
            clear: both;
            content: "";
            display: table;
        }

        #lktips-bubble-arrow {
            width: 0;
            height: 0;
            border-left: 10px solid transparent;
            border-right: 10px solid transparent;
            border-top: 10px solid #DEC94A;
            border-top-color: #DEC94A;
            border-top-width: 12px;
            border-top-style: solid;
            position: absolute;
            z-index: 99998;
        }

        #lktips-bubble-arrow::before {
            content: '';
            position: absolute;
            top: -15px;
            left: -9px;
            width: 0;
            height: 0;
            border-left: 9px solid transparent;
            border-right: 9px solid transparent;
            border-top: 12px solid ${options.popupColor};
        }

        #lktips-bubble-close {
            position: absolute;
            top: 2px;
            right: 2px;
            width: 16px;
            height: 16px;
            background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAYUlEQVQYV12PwQ2AMAwD2w3YBEaAycsIsAkbgC+qowikeyCfHLe31l5xiUM8gm8RQ2x9hmuRECIUNwL2KSwhRCh2BFda4j9CTlbBtQi5ySfy5mzMTXWka3FyEwLPzJv/TR8o8xvGTnBWXwAAAABJRU5ErkJggg==);
            background-position: center;
            background-repeat: no-repeat;
            cursor: pointer;
            opacity: .35;
        }

        #lktips-bubble-close:hover {
            opacity: .8;
        }

        #lktips-bubble-query {
            font-size: ${options.fontSize}px;
            font-weight: bold;
            display: inline-block;
            height: 22px;
            vertical-align: top;
            text-transform: capitalize;
        }

        #lktips-bubble-meaning {
            line-height: 1.3;
        }

        .display-none {
            display: none !important;
        }
    `;
    document.head.appendChild(style);
}
