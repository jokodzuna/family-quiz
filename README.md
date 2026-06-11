# Family Quiz App

A real-time multiplayer family quiz app for home WiFi use. Built with plain HTML, CSS, and vanilla JavaScript using Firebase Realtime Database.

## Features

- **Real-time multiplayer**: 2-4 players on the same WiFi
- **Two game modes**: Multiple Choice and Type Answer
- **AI question generation**: Uses Gemini API to generate questions
- **Manual upload**: Support for JSON question files
- **Buzzer system**: First to buzz wins the right to answer
- **Fuzzy matching**: Tolerates typos in Type Answer mode
- **Scoring**: +5 for correct, -2 for wrong answers
- **Save/Load**: Save question sets to Firebase for reuse
- **Capacitor-ready**: Can be packaged as Android APK

## Setup

### 1. Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Realtime Database:
   - Go to Database → Create Database
   - Choose "Start in Test Mode" (for development)
   - Select a location
4. Get your Firebase config:
   - Go to Project Settings → General → Your apps
   - Add a Web app
   - Copy the config object
5. Update `config.js` with your Firebase credentials:
   ```javascript
   const firebaseConfig = {
       apiKey: "YOUR_API_KEY",
       authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
       databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_PROJECT_ID.appspot.com",
       messagingSenderId: "YOUR_SENDER_ID",
       appId: "YOUR_APP_ID"
   };
   ```

### 2. Gemini API Configuration

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Update `config.js` with your Gemini API key:
   ```javascript
   const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY";
   ```

**Note**: In production, the Gemini API key should be server-side to protect it.

## Running the App

Simply open `index.html` in a web browser. No build tools or npm required.

For Capacitor packaging (Android APK):
```bash
npm install -g @capacitor/cli
capacitor init
capacitor add android
capacitor sync android
capacitor open android
```

## How to Play

### Hosting a Game

1. Click "Host Game"
2. Enter your name
3. Share the 4-digit room code with other players
4. Wait for at least 2 players to join
5. Select game mode (Multiple Choice or Type Answer)
6. Generate questions:
   - Enter a theme (e.g., "Star Wars", "Animals")
   - Set quantity (1-50)
   - Click "Generate" to use AI
   - Or upload a JSON file
7. Optionally save the question set for later
8. Click "Start Game" when ready

### Joining a Game

1. Click "Join Game"
2. Enter the 4-digit room code
3. Enter your name
4. Wait for the host to start the game

### Gameplay

**Multiple Choice Mode:**
- All players see the question and 4 options
- First to buzz gets to answer
- Tap the correct option
- Correct: +5 points, Wrong: -2 points (locked out)

**Type Answer Mode:**
- All players see the question
- First to buzz gets to type their answer
- Type your answer and submit
- Fuzzy matching tolerates typos
- Correct: +5 points, Wrong: -2 points (locked out)

### Winning

The game ends after all questions are answered. The leaderboard shows final scores.

## JSON Question Format

**Multiple Choice:**
```json
[
  {
    "question": "What colour is the sky?",
    "answer": "Blue",
    "wrong": ["Red", "Green", "Yellow"],
    "image": null
  }
]
```

**Type Answer:**
```json
[
  {
    "question": "What colour is the sky?",
    "answer": "Blue",
    "image": null
  }
]
```

## File Structure

- `index.html` - Main HTML with all screens
- `styles.css` - Mobile-first responsive styling
- `app.js` - Entry point, screen routing, event handlers
- `game.js` - Game state logic
- `ui.js` - DOM manipulation and screen transitions
- `firebase.js` - Firebase operations and listeners
- `ai.js` - Gemini API integration and fuzzy matching
- `config.js` - Firebase and Gemini configuration

## Technical Notes

- Uses Firebase Realtime Database for real-time sync
- Uses `ServerValue.TIMESTAMP` for buzz ordering
- All Firebase writes wrapped in try/catch
- Listeners cleaned up on screen transitions
- Handles player disconnection gracefully
- No build tools required
- Capacitor-compatible for mobile packaging
