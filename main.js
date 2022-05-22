document.addEventListener("DOMContentLoaded", () => {
    let guessedWords =[[]]; //array of words with arrays of letters inside
    let availableSpace = 1;
    let guessedWordCount = 0;
    let currentWordIndex = 0;
    

    const words = ["inception", "halloween", "hairspray", "footloose", "pinocchio"];
    let currentWord = words[currentWordIndex];

    initHelpModal();
    initStatsModal();
    initLocalStorage();
    createSquares();
    addKeyboardClicks();
    loadLocalStorage()
 
    // initializes storing words in local storage
    function initLocalStorage(){
        const storedCurrentWordIndex = window.localStorage.getItem('currentWordIndex');
        if (!storedCurrentWordIndex){
            window.localStorage.setItem('currentWordIndex', currentWordIndex)
        } else {        
            currentWordIndex = Number(storedCurrentWordIndex);
            currentWord = words[currentWordIndex];
        }
    }

    // fetching data from local storage
    function loadLocalStorage(){
        currentWordIndex = Number(window.localStorage.getItem('currentWordIndex')) || currentWordIndex;
        guessedWordCount = Number(window.localStorage.getItem('guessedWordCount')) || guessedWordCount;
        availableSpace = Number(window.localStorage.getItem('availableSpace')) || availableSpace;
        guessedWords = JSON.parse(window.localStorage.getItem('guessedWords')) || guessedWords; //convert back to array
        currentWord = words[currentWordIndex];

        const storedBoardContainer = window.localStorage.getItem("boardContainer");
        const storedKeyboardContainer = window.localStorage.getItem("keyboardContainer");
        if (storedBoardContainer){
            document.getElementById("board-container").innerHTML = storedBoardContainer;
        }
        if (storedKeyboardContainer){
            document.getElementById("keyboard-container").innerHTML = storedKeyboardContainer;
            addKeyboardClicks();
        }
    }

    // returns current letters in word
    function getCurrentWordArr(){
        const numberOfGuessedWords = guessedWords.length;
        return guessedWords[numberOfGuessedWords-1];
    }

    function updateGuessedLetters(letter){
        const currentWordArr = getCurrentWordArr();
        // if word not full yet, add letter to next available space
        if (currentWordArr && currentWordArr.length < 9) {
            currentWordArr.push(letter); //puts letter into end of array
            const availableSpaceEl = document.getElementById(availableSpace); //get square with index at current available space
            availableSpace = availableSpace + 1; //update available space after new letter added
            availableSpaceEl.textContent = letter; //show letter entered in current available space
        }
    }
    
    function getTileClass(letter, index, currentWordArr){
        const isCorrectLetter = currentWord.toUpperCase().includes(letter.toUpperCase());
        // returns grey if letter not in word at all
        if (!isCorrectLetter){
            return "incorrect-letter";
        }

        const letterInThatPos = currentWord.charAt(index);
        const isCorrectPos = letter.toLowerCase() === letterInThatPos.toLowerCase();
        
        // returns green if letter is in correct position
        if (isCorrectPos){
            return "correct-letter-in-place";
        }
        // if letter is not already guessed in word, returns yellow
        const isGuessedMoreThanOnce = currentWordArr.filter((l) => l === letter).length > 1;
        if (!isGuessedMoreThanOnce){
            return "correct-letter";
        }

        // if letter is guessed more than once and exists more than once, returns yellow
        const existsMoreThanOnce = currentWord.split("").filter((l) => l === letter).length > 1;
        if (existsMoreThanOnce){
            return "correct-letter";
        }

        const hasBeenGuessedAlready = currentWordArr.indexOf(letter) < index;

        const indices = getIndicesOfLetter(letter, currentWord.split(""));
        const otherIndices = indices.filter((i) => i !== index);
        const isGuessedCorrectlyLater = otherIndices.some((i) => i > index && currentWordArr[i] === letter);

        // if letter is in word and is not guessed multiple times, return yellow
        if (!hasBeenGuessedAlready && !isGuessedCorrectlyLater){
            return "correct-letter";
        }
        // returns yellow
        return "incorrect-letter";
    }

    function updateWordIndex(){
        window.localStorage.setItem('currentWordIndex', currentWordIndex+1);
    }
 
    function getIndicesOfLetter(letter,arr){
        const indices = [];
        let idx = arr.indexOf(letter);
        while (idx !== -1){
            indices.push(idx);
            idx = arr.indexOf(letter,idx+1);
        }
        return indices;
    }

    // user clicks enter word
    function handleSubmitWord() {
        const currentWordArr = getCurrentWordArr();

        const guessedWord = currentWordArr.join(''); //converts array of letters to string

        // prevents user from trying to submit word less than 9 letters
        if (guessedWord.length !== 9){
            return;
        }

        // changes letter colors based on accuracy + animates flip
        const firstLetterId = guessedWordCount * 9 + 1;

        localStorage.setItem("availableSpace", availableSpace);

        const interval = 200;
        currentWordArr.forEach((letter, index) => {
            setTimeout(() => {
                const tileClass = getTileClass(letter, index, currentWordArr);
                if (tileClass){
                    const letterId = firstLetterId + index;
                    const letterEl = document.getElementById(letterId);
                    letterEl.classList.add("animate__flipInX");
                    letterEl.classList.add(tileClass);
                    const keyboardEl = document.querySelector(`[data-key=${letter}]`);
                    keyboardEl.classList.add(tileClass);
                }
                if (index === 8){
                    preserveGameState();
                }
            }, index * interval);
        });
                
        guessedWordCount += 1;
        window.localStorage.setItem('guessedWordCount', guessedWordCount);

        // user correctly guesses word
        if (currentWord === guessedWord){
            setTimeout(() => {
                const okSelected = window.confirm("Well done!");
                if (okSelected){
                    clearBoard();
                    showResult();
                    updateWordIndex();
                    updateTotalGames();
                    resetGameState();
                }
                return;
            }, 1800);
        }

        // user has run out of guesses without guessing word correctly
        if (guessedWords.length === 6 && guessedWord !== currentWord){
            setTimeout(() => {
                const okSelected = window.confirm(`Out of guesses! The movie is "${currentWord.toUpperCase()}".`);
                if (okSelected){
                    clearBoard();
                    showLosingResult();
                    updateWordIndex();
                    updateTotalGames();
                    resetGameState();
                }
                return;
            }, 1800);
        }
        guessedWords.push([]); //pushes new array in so user can start guessing next word
    }

    // resets board so user can play next word
    function resetGameState(){
        window.localStorage.removeItem('guessedWordCount');
        window.localStorage.removeItem('guessedWords');
        window.localStorage.removeItem('keyboardContainer');
        window.localStorage.removeItem('boardContainer');
        window.localStorage.removeItem('availableSpace');
    }

    // creates 54 squares for letters
    function createSquares(){
        const gameBoard = document.getElementById("board");
        for (let index = 0; index < 54; index++){
            let square = document.createElement("div");
            square.classList.add("square");
            square.classList.add("animate__animated");
            square.setAttribute("id", index + 1);
            gameBoard.appendChild(square);
        }
    }

    // prevents current game from being reset if page is refreshed
    function preserveGameState(){
        window.localStorage.setItem('guessedWords', JSON.stringify(guessedWords));
        const keyboardContainer = document.getElementById('keyboard-container');
        window.localStorage.setItem('keyboardContainer', keyboardContainer.innerHTML);
        const boardContainer = document.getElementById('board-container');
        window.localStorage.setItem('boardContainer', boardContainer.innerHTML);
    }

    // user clicks delete letter
    function handleDeleteLetter(){
        const currentWordArr = getCurrentWordArr();
        if (!currentWordArr.length){
            return;
        }
        currentWordArr.pop(); //removes last letter from array
        guessedWords[guessedWords.length - 1] = currentWordArr; //update var
        const lastLetterEl = document.getElementById(availableSpace - 1); 
        lastLetterEl.innerHTML = ''; //removes letter from word in current space
        availableSpace = availableSpace - 1; //update var
    }

    // when user wins
    function showResult(){
        const finalResultEl = document.getElementById("final-score");
        finalResultEl.textContent = "You win!"
        const totalWins = window.localStorage.getItem('totalWins') || 0;
        window.localStorage.setItem('totalWins', Number(totalWins) + 1);
        const currentStreak = window.localStorage.getItem('currentStreak') || 0;
        window.localStorage.setItem('currentStreak', Number(currentStreak) + 1);
    }

    // when user loses
    function showLosingResult(){
        const finalResultEl = document.getElementById("final-score");
        finalResultEl.textContent = "Unsuccessful today!";
        window.localStorage.setItem('currentStreak', 0)
    }

    function updateTotalGames(){
        const totalGames = window.localStorage.getItem('totalGames') || 0;
        window.localStorage.setItem('totalGames', Number(totalGames) + 1);
    }

    // clears letters from board
    function clearBoard(){
        for (let i = 0; i < 54; i++) {
            let square = document.getElementById(i+1);
            square.textContent = "";
        }
        const keys = document.getElementsByClassName("keyboard-button");
        for (var key of keys){
            key.disabled = true;
        }
    }

    // actions when key is clicked
    function addKeyboardClicks(){
        const keys = document.querySelectorAll('.keyboard-row button'); //keyboard buttons
        for (let i = 0; i < keys.length; i++) {
            keys[i].addEventListener("click", ({ target }) => {
                const key = target.getAttribute("data-key");
    
                if (key === 'enter'){
                    handleSubmitWord();
                    return;
                }
    
                if (key === "del"){
                    handleDeleteLetter();
                    return;
                }
                updateGuessedLetters(key);
            });
           }
    }

    // update stats
    function updateStatsModal(){
        const currentStreak = window.localStorage.getItem("currentStreak");
        const totalWins = window.localStorage.getItem("totalWins");
        const totalGames = window.localStorage.getItem("totalGames");
        document.getElementById('total-played').textContent = totalGames;
        document.getElementById('total-wins').textContent = totalWins;
        document.getElementById('current-streak').textContent = currentStreak;
        const winPct = Math.round((totalWins / totalGames * 100)) || 0;
        document.getElementById('win-pct').textContent = winPct;
    }

    // initialize stats feature 
    function initStatsModal(){
        const modal = document.getElementById("stats-modal");
        const btn = document.getElementById("stats");
        const span = document.getElementById("close-stats");
        btn.addEventListener("click", function(){
            updateStatsModal();
            modal.style.display = "block";
        });
        span.addEventListener("click", function(){
            modal.style.display = "none";
        });
        window.addEventListener("click", function(event) {
            if (event.target == modal){
                modal.style.display = "none";
            }
        });
    }

    // initialize help feature
    function initHelpModal(){
        const modal = document.getElementById("help-modal");
        const btn = document.getElementById("help");
        const span = document.getElementById("close-help");
        btn.addEventListener("click", function(){
            modal.style.display = "block";
        });
        span.addEventListener("click", function(){
            modal.style.display = "none";
        });
        window.addEventListener("click", function(event) {
            if (event.target == modal){
                modal.style.display = "none";
            }
        });
    }


});