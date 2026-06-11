// UI Module
// All DOM manipulation and screen transitions

/**
 * Show a specific screen
 */
function showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    
    // Show target screen
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
    }
}

/**
 * Update room code display
 */
function updateRoomCode(code) {
    const elements = document.querySelectorAll('#room-code, #waiting-room-code');
    elements.forEach(el => {
        if (el) el.textContent = code;
    });
}

/**
 * Update player list in host lobby
 */
function updatePlayerList(players) {
    const list = document.getElementById('host-player-list');
    if (!list) return;
    
    list.innerHTML = '';
    
    if (!players) return;
    
    Object.entries(players).forEach(([playerId, playerData]) => {
        const li = document.createElement('li');
        li.textContent = `${playerData.name} ${playerData.connected ? '' : '(disconnected)'}`;
        list.appendChild(li);
    });
    
    // Enable/disable start game button based on player count
    const playerCount = Object.keys(players).length;
    const startButton = document.getElementById('btn-start-game');
    if (startButton) {
        startButton.disabled = playerCount < 2;
    }
}

/**
 * Update scores display
 */
function updateScoresDisplay(players) {
    const container = document.getElementById('scores-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!players) return;
    
    Object.entries(players).forEach(([playerId, playerData]) => {
        const scoreItem = document.createElement('div');
        scoreItem.className = 'score-item';
        scoreItem.textContent = `${playerData.name}: ${playerData.score}`;
        container.appendChild(scoreItem);
    });
}

/**
 * Update question display
 */
function updateQuestionDisplay(question, index, total) {
    const questionText = document.getElementById('question-text');
    const questionProgress = document.getElementById('question-progress');
    
    if (questionText) {
        questionText.textContent = question.question;
    }
    
    if (questionProgress) {
        questionProgress.textContent = `Question ${index + 1} of ${total}`;
    }
}

/**
 * Show buzz button
 */
function showBuzzButton(enabled) {
    const buzzSection = document.getElementById('buzz-section');
    const buzzButton = document.getElementById('btn-buzz');
    
    if (buzzSection) {
        buzzSection.classList.remove('hidden');
    }
    
    if (buzzButton) {
        buzzButton.disabled = !enabled;
    }
}

/**
 * Hide buzz button
 */
function hideBuzzButton() {
    const buzzSection = document.getElementById('buzz-section');
    if (buzzSection) {
        buzzSection.classList.add('hidden');
    }
}

/**
 * Show buzzed player
 */
function showBuzzedPlayer(playerName) {
    const buzzedPlayer = document.getElementById('buzzed-player');
    const buzzedPlayerName = document.getElementById('buzzed-player-name');
    
    if (buzzedPlayer && buzzedPlayerName) {
        buzzedPlayerName.textContent = playerName;
        buzzedPlayer.classList.remove('hidden');
    }
}

/**
 * Hide buzzed player
 */
function hideBuzzedPlayer() {
    const buzzedPlayer = document.getElementById('buzzed-player');
    if (buzzedPlayer) {
        buzzedPlayer.classList.add('hidden');
    }
}

/**
 * Show multiple choice options
 */
function showMultipleChoiceOptions(options, enabled) {
    const optionsContainer = document.getElementById('multiple-choice-options');
    const answerSection = document.getElementById('answer-section');
    
    if (!optionsContainer || !answerSection) return;
    
    optionsContainer.innerHTML = '';
    optionsContainer.classList.remove('hidden');
    answerSection.classList.remove('hidden');
    
    options.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = option;
        btn.disabled = !enabled;
        btn.onclick = () => handleMultipleChoiceAnswer(option);
        optionsContainer.appendChild(btn);
    });
}

/**
 * Hide multiple choice options
 */
function hideMultipleChoiceOptions() {
    const optionsContainer = document.getElementById('multiple-choice-options');
    const answerSection = document.getElementById('answer-section');
    
    if (optionsContainer) {
        optionsContainer.classList.add('hidden');
    }
    
    if (answerSection) {
        answerSection.classList.add('hidden');
    }
}

/**
 * Show type answer input
 */
function showTypeAnswerInput(enabled) {
    const typeInput = document.getElementById('type-answer-input');
    const answerSection = document.getElementById('answer-section');
    
    if (!typeInput || !answerSection) return;
    
    typeInput.classList.remove('hidden');
    answerSection.classList.remove('hidden');
    
    const input = document.getElementById('answer-input');
    const submitBtn = document.getElementById('btn-submit-answer');
    
    if (input) {
        input.disabled = !enabled;
        input.value = '';
    }
    
    if (submitBtn) {
        submitBtn.disabled = !enabled;
    }
}

/**
 * Hide type answer input
 */
function hideTypeAnswerInput() {
    const typeInput = document.getElementById('type-answer-input');
    const answerSection = document.getElementById('answer-section');
    
    if (typeInput) {
        typeInput.classList.add('hidden');
    }
    
    if (answerSection) {
        answerSection.classList.add('hidden');
    }
}

/**
 * Show locked indicator
 */
function showLockedIndicator() {
    const lockedIndicator = document.getElementById('locked-indicator');
    if (lockedIndicator) {
        lockedIndicator.classList.remove('hidden');
    }
}

/**
 * Hide locked indicator
 */
function hideLockedIndicator() {
    const lockedIndicator = document.getElementById('locked-indicator');
    if (lockedIndicator) {
        lockedIndicator.classList.add('hidden');
    }
}

/**
 * Update leaderboard
 */
function updateLeaderboard(players) {
    const leaderboard = document.getElementById('leaderboard');
    if (!leaderboard) return;
    
    leaderboard.innerHTML = '';
    
    if (!players) return;
    
    // Sort players by score
    const sortedPlayers = Object.entries(players)
        .sort(([, a], [, b]) => b.score - a.score);
    
    sortedPlayers.forEach(([playerId, playerData], index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        item.innerHTML = `
            <span>${index + 1}. ${playerData.name}</span>
            <span>${playerData.score}</span>
        `;
        leaderboard.appendChild(item);
    });
}

/**
 * Update saved sets dropdown
 */
function updateSavedSetsDropdown(questionSets) {
    const select = document.getElementById('load-saved-select');
    if (!select) return;
    
    select.innerHTML = '<option value="">Load Saved Set...</option>';
    
    if (!questionSets) return;
    
    Object.entries(questionSets).forEach(([setId, setData]) => {
        const option = document.createElement('option');
        option.value = setId;
        option.textContent = `${setData.name} (${setData.theme})`;
        select.appendChild(option);
    });
}

/**
 * Show save set section
 */
function showSaveSetSection() {
    const section = document.getElementById('save-set-section');
    if (section) {
        section.classList.remove('hidden');
    }
}

/**
 * Hide save set section
 */
function hideSaveSetSection() {
    const section = document.getElementById('save-set-section');
    if (section) {
        section.classList.add('hidden');
    }
}

/**
 * Handle multiple choice answer click
 */
function handleMultipleChoiceAnswer(answer) {
    // This will be implemented in app.js
    console.log('Selected answer:', answer);
}
