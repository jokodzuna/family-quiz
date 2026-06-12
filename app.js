// App Entry Point
// Initializes Firebase, handles screen routing

// Splash Screen Transition
function initSplashScreen() {
    const splashScreen = document.getElementById('screen-splash');
    const homeScreen = document.getElementById('screen-home');
    
    // Hide home screen initially
    homeScreen.classList.add('hidden');
    
    // After 2 seconds, start slide away transition
    setTimeout(() => {
        splashScreen.classList.add('slide-away');
        
        // After transition completes, remove splash screen and show home
        setTimeout(() => {
            splashScreen.remove();
            homeScreen.classList.remove('hidden');
        }, 800); // Wait for slide transition to complete
    }, 2000); // 2 second display time
}

// Initialize splash screen
initSplashScreen();

// Initialize Firebase
initFirebase();

// DOM Elements
const btnHost = document.getElementById('btn-host');
const btnJoin = document.getElementById('btn-join');
const btnJoinGame = document.getElementById('btn-join-game');
const btnSaveSet = document.getElementById('btn-save-set');
const btnLoadSaved = document.getElementById('btn-load-saved');
const btnStartGame = document.getElementById('btn-start-game');
const btnBuzz = document.getElementById('btn-buzz');
const btnSubmitAnswer = document.getElementById('btn-submit-answer');
const btnPlayAgain = document.getElementById('btn-play-again');
const btnNewGame = document.getElementById('btn-new-game');
const gameModeSelect = document.getElementById('game-mode');

// Event Listeners
btnHost.addEventListener('click', handleHostGame);
btnJoin.addEventListener('click', showJoinScreen);
btnJoinGame.addEventListener('click', handleJoinGame);
btnSaveSet.addEventListener('click', handleSaveSet);
btnLoadSaved.addEventListener('click', handleLoadSaved);
btnStartGame.addEventListener('click', handleStartGame);
btnBuzz.addEventListener('click', handleBuzz);
btnSubmitAnswer.addEventListener('click', handleSubmitAnswer);
btnPlayAgain.addEventListener('click', handlePlayAgain);
btnNewGame.addEventListener('click', handleNewGame);
gameModeSelect.addEventListener('change', handleGameModeChange);

// File input for upload
const fileUpload = document.getElementById('file-upload');
fileUpload.addEventListener('change', handleFileUpload);

/**
 * Handle host game button
 */
async function handleHostGame() {
    const playerId = generatePlayerId();
    const playerName = await showPrompt('Enter your name');
    
    if (!playerName) return;
    
    setPlayerId(playerId);
    setHostStatus(true);
    
    try {
        const roomCode = await createRoom(playerId, playerName);
        setRoomCode(roomCode);
        
        updateRoomCode(roomCode);
        showScreen('screen-host-lobby');
        
        // Listen to players joining
        onPlayersChanged(updatePlayerList);
        
        // Load saved question sets
        loadSavedQuestionSets();
    } catch (error) {
        console.error('Error hosting game:', error);
        await showAlert(`Failed to create room: ${error.message || error}. Check console for details.`);
    }
}

/**
 * Show join screen
 */
function showJoinScreen() {
    showScreen('screen-join');
}

/**
 * Handle join game button
 */
async function handleJoinGame() {
    const roomCode = document.getElementById('join-room-code').value.trim();
    const playerName = document.getElementById('player-name').value.trim();
    
    if (!roomCode || !playerName) {
        await showAlert('Please enter both room code and your name');
        return;
    }
    
    if (roomCode.length !== 4) {
        await showAlert('Room code must be 4 digits');
        return;
    }
    
    const playerId = generatePlayerId();
    setPlayerId(playerId);
    setHostStatus(false);
    setRoomCode(roomCode);
    
    try {
        await joinRoom(roomCode, playerId, playerName);
        
        updateRoomCode(roomCode);
        showScreen('screen-waiting');
        
        // Listen to game state changes
        onGameStateChanged(handleGameStateChanged);
        
        // Listen to game mode changes
        onGameModeChanged(handleGameModeChanged);
        
        // Set connected status on page unload
        window.addEventListener('beforeunload', () => {
            setPlayerConnected(playerId, false);
        });
    } catch (error) {
        console.error('Error joining game:', error);
        await showAlert('Failed to join room. Please check the room code and try again.');
    }
}

/**
 * Handle game mode change
 */
async function handleGameModeChange(e) {
    const mode = e.target.value;
    setGameMode(mode);
    await setGameMode(mode);
}

/**
 * Handle file upload
 */
async function handleFileUpload(e) {
    const file = e.target.files[0];
    
    if (!file) return;
    
    try {
        const questions = await parseUploadedJSON(file);
        setLocalQuestions(questions);
        
        await setQuestions(questions);
        
        showSaveSetSection();
        
        const uploadStatus = document.getElementById('upload-status');
        uploadStatus.textContent = `✅ ${questions.length} questions loaded`;
    } catch (error) {
        console.error('Error uploading questions:', error);
        const uploadStatus = document.getElementById('upload-status');
        uploadStatus.textContent = '❌ Failed to load questions';
    }
}

/**
 * Handle save set button
 */
async function handleSaveSet() {
    const setName = document.getElementById('set-name-input').value.trim();
    const mode = gameModeSelect.value;
    
    if (!setName) {
        await showAlert('Please enter a name for this set');
        return;
    }
    
    if (!currentQuestions || currentQuestions.length === 0) {
        await showAlert('No questions to save');
        return;
    }
    
    try {
        await saveQuestionSet(setName, 'Custom', mode, currentQuestions);
        await showAlert('Question set saved!');
        hideSaveSetSection();
        loadSavedQuestionSets();
    } catch (error) {
        console.error('Error saving set:', error);
        await showAlert('Failed to save question set');
    }
}

/**
 * Handle load saved button
 */
async function handleLoadSaved() {
    const setId = document.getElementById('load-saved-select').value;
    
    if (!setId) {
        await showAlert('Please select a saved set');
        return;
    }
    
    try {
        const questionSets = await loadQuestionSets();
        const selectedSet = questionSets[setId];
        
        if (selectedSet) {
            setLocalQuestions(selectedSet.questions);
            await setQuestions(selectedSet.questions);
            
            // Update UI
            gameModeSelect.value = selectedSet.mode;
            setGameMode(selectedSet.mode);
            
            showSaveSetSection();
            
            const uploadStatus = document.getElementById('upload-status');
            uploadStatus.textContent = `✅ ${selectedSet.questions.length} questions loaded from "${selectedSet.name}"`;
        }
    } catch (error) {
        console.error('Error loading saved set:', error);
        await showAlert('Failed to load question set');
    }
}

/**
 * Load saved question sets dropdown
 */
async function loadSavedQuestionSets() {
    try {
        const questionSets = await loadQuestionSets();
        updateSavedSetsDropdown(questionSets);
    } catch (error) {
        console.error('Error loading question sets:', error);
    }
}

/**
 * Handle start game button
 */
async function handleStartGame() {
    if (!currentQuestions || currentQuestions.length === 0) {
        await showAlert('Please generate or load questions first');
        return;
    }
    
    console.log('Starting game with', currentQuestions.length, 'questions');
    
    try {
        // Ensure questions are set to Firebase before starting
        await setQuestions(currentQuestions);
        
        await startGame();
        
        // Listen to game state changes
        onGameStateChanged(handleGameStateChanged);
        onBuzzChanged(handleBuzzChanged);
        onLockedOutChanged(handleLockedOutChanged);
    } catch (error) {
        console.error('Error starting game:', error);
        await showAlert('Failed to start game');
    }
}

/**
 * Handle game state changes
 */
function handleGameStateChanged(gameData) {
    if (!gameData) return;
    
    const status = gameData.status;
    
    if (status === 'active') {
        handleActiveGame(gameData);
    } else if (status === 'finished') {
        handleFinishedGame(gameData);
    }
    
    // Update scores display
    if (gameData.players) {
        updateScoresDisplay(gameData.players);
    }
}

/**
 * Handle game mode changes
 */
function handleGameModeChanged(mode) {
    if (mode) {
        setGameMode(mode);
    }
}

/**
 * Handle active game state
 */
function handleActiveGame(gameData) {
    const currentIndex = gameData.currentQuestionIndex || 0;
    const questions = gameData.questions;
    
    if (!questions || currentIndex >= Object.keys(questions).length) {
        // Game over
        endGame();
        return;
    }
    
    const question = questions[currentIndex];
    currentQuestionData = question;
    
    // Update question display
    updateQuestionDisplay(question, currentIndex, Object.keys(questions).length);
    
    // Show question screen
    showScreen('screen-question');
    
    // Reset UI state
    hideBuzzedPlayer();
    hideMultipleChoiceOptions();
    hideTypeAnswerInput();
    hideLockedIndicator();
    
    // Check if player is locked out
    const isLocked = isPlayerLockedOut(currentPlayerId, gameData.lockedOut);
    
    if (isLocked) {
        showLockedIndicator();
        hideBuzzButton();
    } else {
        showBuzzButton(!gameData.buzz);
    }
    
    // If someone buzzed, handle it
    if (gameData.buzz) {
        handleBuzzedPlayer(gameData.buzz, question, gameData);
    }
}

/**
 * Handle buzz changes
 */
function handleBuzzChanged(buzzData) {
    if (!buzzData) {
        hideBuzzedPlayer();
        showBuzzButton(true);
        return;
    }
    
    showBuzzedPlayer(buzzData.playerName);
    
    // Disable buzz button for everyone
    const buzzButton = document.getElementById('btn-buzz');
    if (buzzButton) {
        buzzButton.disabled = true;
    }
    
    // If current player buzzed, show answer options
    if (buzzData.playerId === currentPlayerId && currentQuestionData) {
        showAnswerOptions(currentQuestionData);
    }
}

/**
 * Handle locked out changes
 */
function handleLockedOutChanged(lockedOutData) {
    if (isPlayerLockedOut(currentPlayerId, lockedOutData)) {
        showLockedIndicator();
        hideBuzzButton();
    }
}

/**
 * Handle buzzed player
 */
function handleBuzzedPlayer(buzzData, question, gameData) {
    showBuzzedPlayer(buzzData.playerName);
    
    // Disable buzz button
    const buzzButton = document.getElementById('btn-buzz');
    if (buzzButton) {
        buzzButton.disabled = true;
    }
    
    // If current player buzzed, show answer options
    if (buzzData.playerId === currentPlayerId) {
        showAnswerOptions(question);
    }
}

/**
 * Show answer options based on game mode
 */
function showAnswerOptions(question) {
    const mode = currentGameMode || gameModeSelect.value;
    
    if (mode === 'multipleChoice') {
        const options = getShuffledOptions(question);
        showMultipleChoiceOptions(options, true);
    } else {
        showTypeAnswerInput(true);
    }
}

/**
 * Handle buzz button
 */
async function handleBuzz() {
    if (!currentPlayerId) return;
    
    // Get player name from game state
    let playerName = 'Player';
    const playersSnapshot = await gameRef.child('players').once('value');
    const players = playersSnapshot.val();
    if (players && players[currentPlayerId]) {
        playerName = players[currentPlayerId].name;
    }
    
    try {
        await buzz(currentPlayerId, playerName);
    } catch (error) {
        console.error('Error buzzing:', error);
    }
}

/**
 * Handle submit answer button
 */
async function handleSubmitAnswer() {
    if (!currentQuestionData || !currentPlayerId) return;
    
    const mode = currentGameMode || gameModeSelect.value;
    let answer;
    
    if (mode === 'typeAnswer') {
        answer = document.getElementById('answer-input').value.trim();
    } else {
        // Multiple choice - handled by option buttons
        return;
    }
    
    if (!answer) return;
    
    try {
        const result = await handleAnswer(currentPlayerId, answer, currentQuestionData.answer);
        
        if (result.isCorrect) {
            await showAlert('Correct! +5 points');
        } else {
            await showAlert('Wrong! -2 points');
        }
        
        // Move to next question if needed
        if (result.shouldMoveNext) {
            await nextQuestion();
        }
    } catch (error) {
        console.error('Error submitting answer:', error);
    }
}

/**
 * Handle multiple choice answer (called from ui.js)
 */
async function handleMultipleChoiceAnswer(answer) {
    if (!currentQuestionData || !currentPlayerId) return;
    
    try {
        const result = await handleAnswer(currentPlayerId, answer, currentQuestionData.answer);
        
        // Highlight correct/wrong
        const buttons = document.querySelectorAll('.option-btn');
        buttons.forEach(btn => {
            btn.disabled = true;
            if (btn.textContent === currentQuestionData.answer) {
                btn.classList.add('correct');
            } else if (btn.textContent === answer && !result.isCorrect) {
                btn.classList.add('wrong');
            }
        });
        
        if (result.isCorrect) {
            await showAlert('Correct! +5 points');
        } else {
            await showAlert('Wrong! -2 points');
        }
        
        // Move to next question if needed
        if (result.shouldMoveNext) {
            await nextQuestion();
        }
    } catch (error) {
        console.error('Error submitting answer:', error);
    }
}

/**
 * Handle finished game state
 */
function handleFinishedGame(gameData) {
    showScreen('screen-results');
    
    if (gameData.players) {
        updateLeaderboard(gameData.players);
    }
}

/**
 * Handle play again button
 */
async function handlePlayAgain() {
    try {
        // Reset game state
        await gameRef.child('currentQuestionIndex').set(0);
        await gameRef.child('buzz').set(null);
        await gameRef.child('lockedOut').set({});
        
        // Reset scores
        const playersSnapshot = await gameRef.child('players').once('value');
        const players = playersSnapshot.val();
        
        if (players) {
            Object.keys(players).forEach(async (playerId) => {
                await gameRef.child('players').child(playerId).child('score').set(0);
            });
        }
        
        await gameRef.child('status').set('active');
    } catch (error) {
        console.error('Error restarting game:', error);
        await showAlert('Failed to restart game');
    }
}

/**
 * Handle new game button
 */
async function handleNewGame() {
    try {
        await leaveGame();
        initGameState();
        showScreen('screen-home');
    } catch (error) {
        console.error('Error leaving game:', error);
    }
}

/**
 * Generate a unique player ID
 */
function generatePlayerId() {
    return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Parse uploaded JSON file
 */
function parseUploadedJSON(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const questions = JSON.parse(e.target.result);
                resolve(questions);
            } catch (error) {
                reject(new Error('Invalid JSON file'));
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Error reading file'));
        };
        
        reader.readAsText(file);
    });
}

/**
 * Fuzzy matching for type answer mode
 */
function fuzzyMatch(input, correct) {
    // Case insensitive
    const inputLower = input.toLowerCase().trim();
    const correctLower = correct.toLowerCase().trim();
    
    // Strip leading articles
    const articles = ['a', 'an', 'the'];
    let inputClean = inputLower;
    let correctClean = correctLower;
    
    articles.forEach(article => {
        if (inputClean.startsWith(article + ' ')) {
            inputClean = inputClean.substring(article.length + 1);
        }
        if (correctClean.startsWith(article + ' ')) {
            correctClean = correctClean.substring(article.length + 1);
        }
    });
    
    // Exact match
    if (inputClean === correctClean) {
        return true;
    }
    
    // Levenshtein distance
    const distance = levenshteinDistance(inputClean, correctClean);
    const maxLength = Math.max(inputClean.length, correctClean.length);
    
    // Tolerance: 1 error for up to 5 chars, 2 for 6-10, 3 for 11+
    let tolerance;
    if (maxLength <= 5) {
        tolerance = 1;
    } else if (maxLength <= 10) {
        tolerance = 2;
    } else {
        tolerance = 3;
    }
    
    return distance <= tolerance;
}

/**
 * Calculate Levenshtein distance
 */
function levenshteinDistance(str1, str2) {
    const m = str1.length;
    const n = str2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    for (let i = 0; i <= m; i++) {
        dp[i][0] = i;
    }
    
    for (let j = 0; j <= n; j++) {
        dp[0][j] = j;
    }
    
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = 1 + Math.min(
                    dp[i - 1][j],
                    dp[i][j - 1],
                    dp[i - 1][j - 1]
                );
            }
        }
    }
    
    return dp[m][n];
}
