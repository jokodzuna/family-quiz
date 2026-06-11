// Firebase Operations Module
// All Firebase reads/writes and real-time listeners

let db = null;
let gameRef = null;
let playersRef = null;
let questionsRef = null;
let buzzRef = null;
let lockedOutRef = null;
let questionSetsRef = null;

// Firebase listeners for cleanup
const listeners = [];

/**
 * Initialize Firebase
 */
function initFirebase() {
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.database();
        questionSetsRef = db.ref('questionSets');
        console.log('Firebase initialized successfully');
    } catch (error) {
        console.error('Firebase initialization error:', error);
        throw error;
    }
}

/**
 * Generate a random 4-digit room code
 */
async function generateRoomCode() {
    let code;
    let exists = true;
    
    while (exists) {
        code = Math.floor(1000 + Math.random() * 9000).toString();
        // Check if room already exists
        const snapshot = await db.ref(`games/${code}`).once('value');
        exists = snapshot.exists();
    }
    
    return code;
}

/**
 * Create a new game room
 */
async function createRoom(hostId, hostName) {
    try {
        const roomCode = await generateRoomCode();
        gameRef = db.ref(`games/${roomCode}`);
        
        await gameRef.set({
            status: 'lobby',
            hostId: hostId,
            mode: 'multipleChoice',
            currentQuestionIndex: 0,
            buzz: null,
            lockedOut: {},
            players: {
                [hostId]: {
                    name: hostName,
                    score: 0,
                    connected: true
                }
            },
            questions: {}
        });
        
        return roomCode;
    } catch (error) {
        console.error('Error creating room:', error);
        throw error;
    }
}

/**
 * Join an existing game room
 */
async function joinRoom(roomCode, playerId, playerName) {
    try {
        gameRef = db.ref(`games/${roomCode}`);
        playersRef = gameRef.child('players');
        
        await playersRef.child(playerId).set({
            name: playerName,
            score: 0,
            connected: true
        });
        
        return true;
    } catch (error) {
        console.error('Error joining room:', error);
        throw error;
    }
}

/**
 * Set player connection status
 */
async function setPlayerConnected(playerId, connected) {
    try {
        if (!playersRef) return;
        await playersRef.child(playerId).child('connected').set(connected);
    } catch (error) {
        console.error('Error setting player connection:', error);
    }
}

/**
 * Listen to game state changes
 */
function onGameStateChanged(callback) {
    if (!gameRef) return;
    
    const listener = gameRef.on('value', (snapshot) => {
        const data = snapshot.val();
        callback(data);
    });
    
    listeners.push({ ref: gameRef, listener });
}

/**
 * Listen to players list changes
 */
function onPlayersChanged(callback) {
    if (!playersRef) playersRef = gameRef.child('players');
    
    const listener = playersRef.on('value', (snapshot) => {
        const data = snapshot.val();
        callback(data);
    });
    
    listeners.push({ ref: playersRef, listener });
}

/**
 * Listen to buzz changes
 */
function onBuzzChanged(callback) {
    if (!buzzRef) buzzRef = gameRef.child('buzz');
    
    const listener = buzzRef.on('value', (snapshot) => {
        const data = snapshot.val();
        callback(data);
    });
    
    listeners.push({ ref: buzzRef, listener });
}

/**
 * Listen to locked out changes
 */
function onLockedOutChanged(callback) {
    if (!lockedOutRef) lockedOutRef = gameRef.child('lockedOut');
    
    const listener = lockedOutRef.on('value', (snapshot) => {
        const data = snapshot.val();
        callback(data);
    });
    
    listeners.push({ ref: lockedOutRef, listener });
}

/**
 * Set game mode
 */
async function setGameMode(mode) {
    try {
        if (!gameRef) return;
        await gameRef.child('mode').set(mode);
    } catch (error) {
        console.error('Error setting game mode:', error);
    }
}

/**
 * Set questions for the game
 */
async function setQuestions(questions) {
    console.log('setQuestions called, gameRef:', gameRef);
    try {
        if (!gameRef) {
            console.error('gameRef is null in setQuestions');
            return;
        }
        console.log('Setting questions to Firebase, count:', questions.length);
        await gameRef.child('questions').set(questions);
        console.log('Questions set successfully to Firebase');
    } catch (error) {
        console.error('Error setting questions:', error);
        throw error;
    }
}

/**
 * Start the game
 */
async function startGame() {
    try {
        if (!gameRef) {
            console.error('gameRef is null in startGame');
            return;
        }
        console.log('Setting game status to active');
        await gameRef.child('status').set('active');
        console.log('Setting currentQuestionIndex to 0');
        await gameRef.child('currentQuestionIndex').set(0);
        console.log('Game started successfully');
    } catch (error) {
        console.error('Error starting game:', error);
        throw error;
    }
}

/**
 * Buzz in
 */
async function buzz(playerId, playerName) {
    try {
        if (!buzzRef) buzzRef = gameRef.child('buzz');
        await buzzRef.set({
            playerId: playerId,
            playerName: playerName,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
    } catch (error) {
        console.error('Error buzzing:', error);
    }
}

/**
 * Clear buzz
 */
async function clearBuzz() {
    try {
        if (!buzzRef) buzzRef = gameRef.child('buzz');
        await buzzRef.set(null);
    } catch (error) {
        console.error('Error clearing buzz:', error);
    }
}

/**
 * Lock out a player
 */
async function lockOutPlayer(playerId) {
    try {
        if (!lockedOutRef) lockedOutRef = gameRef.child('lockedOut');
        await lockedOutRef.child(playerId).set(true);
    } catch (error) {
        console.error('Error locking out player:', error);
    }
}

/**
 * Clear all locked out players
 */
async function clearLockedOut() {
    try {
        if (!lockedOutRef) lockedOutRef = gameRef.child('lockedOut');
        await lockedOutRef.set({});
    } catch (error) {
        console.error('Error clearing locked out:', error);
    }
}

/**
 * Update player score
 */
async function updatePlayerScore(playerId, scoreChange) {
    try {
        if (!playersRef) playersRef = gameRef.child('players');
        await playersRef.child(playerId).child('score').transaction((currentScore) => {
            return (currentScore || 0) + scoreChange;
        });
    } catch (error) {
        console.error('Error updating score:', error);
    }
}

/**
 * Move to next question
 */
async function nextQuestion() {
    try {
        if (!gameRef) return;
        await gameRef.child('currentQuestionIndex').transaction((currentIndex) => {
            return (currentIndex || 0) + 1;
        });
        await clearBuzz();
        await clearLockedOut();
    } catch (error) {
        console.error('Error moving to next question:', error);
    }
}

/**
 * End the game
 */
async function endGame() {
    try {
        if (!gameRef) return;
        await gameRef.child('status').set('finished');
    } catch (error) {
        console.error('Error ending game:', error);
    }
}

/**
 * Save question set
 */
async function saveQuestionSet(name, theme, mode, questions) {
    try {
        const newSetRef = questionSetsRef.push();
        await newSetRef.set({
            name: name,
            theme: theme,
            mode: mode,
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            questions: questions
        });
        return newSetRef.key;
    } catch (error) {
        console.error('Error saving question set:', error);
        throw error;
    }
}

/**
 * Load all question sets
 */
async function loadQuestionSets() {
    try {
        const snapshot = await questionSetsRef.once('value');
        return snapshot.val();
    } catch (error) {
        console.error('Error loading question sets:', error);
        throw error;
    }
}

/**
 * Clean up all Firebase listeners
 */
function cleanupListeners() {
    listeners.forEach(({ ref, listener }) => {
        ref.off('value', listener);
    });
    listeners.length = 0;
}

/**
 * Leave the current game
 */
async function leaveGame() {
    try {
        cleanupListeners();
        if (playersRef && currentPlayerId) {
            await playersRef.child(currentPlayerId).child('connected').set(false);
        }
        gameRef = null;
        playersRef = null;
        questionsRef = null;
        buzzRef = null;
        lockedOutRef = null;
    } catch (error) {
        console.error('Error leaving game:', error);
    }
}
