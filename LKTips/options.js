document.addEventListener('DOMContentLoaded', function() {
    const saveBtn = document.getElementById('saveBtn');
    const resetBtn = document.getElementById('resetBtn');
    const saveStatus = document.getElementById('saveStatus');
    
    const fontSize = document.getElementById('fontSize');
    const popupColor = document.getElementById('popupColor');
    const fontColor = document.getElementById('fontColor');
    const hoverDelay = document.getElementById('hoverDelay');
    const triggerMethod = document.getElementById('triggerMethod');

    // Load the saved options from storage
    chrome.storage.sync.get({
        fontSize: '14',
        popupColor: '#F5F5B9',
        fontColor: '#222222',
        hoverDelay: 1500,
        triggerMethod: 'hover'
    }, function(items) {
        fontSize.value = items.fontSize;
        popupColor.value = items.popupColor;
        fontColor.value = items.fontColor;
        hoverDelay.value = items.hoverDelay;
        triggerMethod.value = items.triggerMethod;
    });

    // Save the options to storage
    saveBtn.addEventListener('click', function() {
        chrome.storage.sync.set({
            fontSize: fontSize.value,
            popupColor: popupColor.value,
            fontColor: fontColor.value,
            hoverDelay: hoverDelay.value,
            triggerMethod: triggerMethod.value
        }, function() {
            // Update status to let user know options were saved
            saveStatus.style.display = 'inline';
            setTimeout(function() {
                saveStatus.style.display = 'none';
            }, 1000);
        });
    });

    // Reset the options to defaults
    resetBtn.addEventListener('click', function() {
        chrome.storage.sync.set({
            fontSize: '14',
            popupColor: '#F5F5B9',
            fontColor: '#222',
            hoverDelay: 1500,
            triggerMethod: 'hover'
        }, function() {
            fontSize.value = '14';
            popupColor.value = '#F5F5B9';
            fontColor.value = '#222';
            hoverDelay.value = 1500;
            triggerMethod.value = 'hover';
            saveStatus.style.display = 'inline';
            setTimeout(function() {
                saveStatus.style.display = 'none';
            }, 1000);
        });
    });
});
