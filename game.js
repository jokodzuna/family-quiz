// Game State Logic Module
// Handles rounds, scoring, buzz handling, answer judging

// Game state
let currentRoomCode = null;
let currentPlayerId = null;
let currentGameMode = null;
let currentQuestions = [];
let isHost = false;
let currentQuestionData = null;

/**
 * Initialize game state
 */
function initGameState() {
    currentRoomCode = null;
    currentPlayerId = null;
    currentGameMode = null;
    currentQuestions = [];
    isHost = false;
    currentQuestionData = null;
}

/**
 * Set current room code
 */
function setRoomCode(code) {
    currentRoomCode = code;
}

/**
 * Set current player ID
 */
function setPlayerId(id) {
    currentPlayerId = id;
}

/**
 * Set host status
 */
function setHostStatus(host) {
    isHost = host;
}

/**
 * Set game mode
 */
function setGameMode(mode) {
    currentGameMode = mode;
}

/**
 * Set current questions (local state)
 */
function setLocalQuestions(questions) {
    currentQuestions = questions;
}

/**
 * Get current question data
 */
function getCurrentQuestion(index) {
    if (!currentQuestions || index >= currentQuestions.length) {
        return null;
    }
    return currentQuestions[index];
}

/**
 * Check if answer is correct
 */
function checkAnswer(answer, correctAnswer) {
    if (currentGameMode === 'typeAnswer') {
        return fuzzyMatch(answer, correctAnswer);
    }
    return answer === correctAnswer;
}

/**
 * Calculate score change
 */
function calculateScoreChange(isCorrect) {
    return isCorrect ? 5 : -2;
}

/**
 * Check if player is locked out
 */
function isPlayerLockedOut(playerId, lockedOutData) {
    return lockedOutData && lockedOutData[playerId] === true;
}

/**
 * Check if all players are locked out
 */
function areAllPlayersLockedOut(lockedOutData, playersData) {
    if (!playersData) return false;
    
    const playerIds = Object.keys(playersData);
    if (playerIds.length === 0) return false;
    
    return playerIds.every(id => isPlayerLockedOut(id, lockedOutData));
}

/**
 * Shuffle array (for multiple choice options)
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Get shuffled options for multiple choice
 */
function getShuffledOptions(question) {
    if (!question.wrong) return [question.answer];
    
    const options = [question.answer, ...question.wrong];
    return shuffleArray(options);
}

/**
 * Handle answer submission
 */
async function handleAnswer(playerId, answer, correctAnswer) {
    const isCorrect = checkAnswer(answer, correctAnswer);
    const scoreChange = calculateScoreChange(isCorrect);
    
    await updatePlayerScore(playerId, scoreChange);
    
    if (isCorrect) {
        // Correct answer - caller will handle nextQuestion after alert
        return { isCorrect, shouldMoveNext: true };
    } else {
        // Wrong answer - lock out player
        await lockOutPlayer(playerId);
        
        // Check if all players are locked out
        const snapshot = await gameRef.once('value');
        const gameData = snapshot.val();
        
        if (areAllPlayersLockedOut(gameData.lockedOut, gameData.players)) {
            // Reveal correct answer and caller will handle nextQuestion after alert
            return { isCorrect, shouldMoveNext: true };
        } else {
            // Re-enable buzzers for remaining players
            await clearBuzz();
            return { isCorrect, shouldMoveNext: false };
        }
    }
}
