const GameBoard = (() => {
    // X always goes first. True when it's X's turn.
    let _isPlayerOneTurn = true;
    let _waitForComputerTurn = false;
    let _isGameOver = false;
    let boardState = [];
    const _turnTextElement = document.getElementById("turn-text");
    const _cells = Array.from(document.querySelectorAll(".grid-cell"));
    const _winConditions = [
      [0,1,2],
      [3,4,5],
      [6,7,8],
      [0,3,6],
      [1,4,7],
      [2,5,8],
      [0,4,8],
      [2,4,6]  
    ];
    let _turnText1 = "X to play.";
    let _turnText2 = "O to play.";
    let _winText1 = "X won!";
    let _winText2 = "O won!";
    let _root = document.documentElement.style;

    function initialize() {
        _isGameOver = false;
        boardState = [];
        _isPlayerOneTurn = true;
        _waitForComputerTurn = false;
        _cells.forEach(cell => {
            boardState.push('none');
            cell.addEventListener('click', () => _selectCell(cell))
            cell.classList.add("selectable");
            cell.classList.remove("highlighted-cell");

            if (cell.firstChild) {
                cell.removeChild(cell.firstChild);
            }

            let symbolContainer = document.createElement('div');
            symbolContainer.classList.add("symbol-container");
            symbolContainer.classList.add("hidden");
            cell.appendChild(symbolContainer);
         });
         AI.cancel();
         _displayPlayerTurn();
    }

    function restartGame() {
        restartButton.classList.remove("prevent-spin");
        restartButton.classList.add("spin");
        initialize();
    }

    function setTurnText(player1TurnText, player2TurnText, player1WinText, player2WinText) {
        _turnText1 = player1TurnText;
        _turnText2 = player2TurnText;
        _winText1 = player1WinText;
        _winText2 = player2WinText;
    }

    function _displayPlayerTurn() {
        _turnTextElement.textContent = _isPlayerOneTurn ? _turnText1 : _turnText2;
        let textColor = _isPlayerOneTurn ? "rgb(72, 196, 159)" : "rgb(197, 82, 130)";
        _root.setProperty("--turn-text-color", textColor);
    }

    function _selectCell(cell) {
        let cellIndex = _cells.indexOf(cell);
        if (_waitForComputerTurn || _isGameOver || boardState[cellIndex] != "none") {
            return; 
        }

        boardState[cellIndex] = _isPlayerOneTurn ? "x" : "o";

        let symbolContainer = cell.firstChild;
        symbolContainer.innerHTML = _isPlayerOneTurn ? pathX : pathO;
        symbolContainer.classList.remove("hidden");
        cell.classList.remove("selectable");

        restartButton.classList.add("prevent-spin");
        restartButton.classList.remove("spin");

        _checkWin();
    }

    function computerPlay(cellIndex) {
        _waitForComputerTurn = false;
        _selectCell(_cells[cellIndex]);
    }

    function _checkWin() {
        for (let i = 0; i < _winConditions.length; i++) {
            let condition = _winConditions[i];
            let check1 = boardState[condition[0]];
            if (check1 === "none") continue;
            let check2 = boardState[condition[1]];
            let check3 = boardState[condition[2]];
            
            if (check1 === check2 && check2 === check3) {
                _isGameOver = true;
                _highlightWin(condition);
                break;
            }
        }

        if (_isGameOver) {
            _turnTextElement.textContent = _isPlayerOneTurn ? _winText1 : _winText2;
            return;
        }

        if (boardState.indexOf("none") === -1) {
            _isGameOver = true;
            _root.setProperty("--turn-text-color", "black");
            _turnTextElement.textContent = "Cat's game!";
            return;
        }
        
        _isPlayerOneTurn = !_isPlayerOneTurn;
        if (DifficultySelector.currentDifficulty !== 0 && !_isPlayerOneTurn) {
            _waitForComputerTurn = true;
            AI.play();
        }
        _displayPlayerTurn();
    }

    function _highlightWin(winCells) {
        winCells.forEach(cellIndex => _cells[cellIndex].classList.add("highlighted-cell"));
    }

    return {
        initialize,
        restartGame,
        setTurnText,
        computerPlay,
        get boardState() { return boardState; }
    };
})();

const DifficultySelector = (() => {

    let currentDifficulty = 0;

    let playFriendButton = document.getElementById("play-friend-button");
    let easyButton = document.getElementById("ai-easy-button");
    let mediumButton = document.getElementById("ai-medium-button");
    let impossibleButton = document.getElementById("ai-impossible-button");

    let difficultyButtons = [playFriendButton, easyButton, mediumButton, impossibleButton];

    for (let i = 0; i < difficultyButtons.length; i++) {
        let button = difficultyButtons[i];
        button.addEventListener('click', () => {
            selectDifficulty(i);
        });
    }

    function selectDifficulty(difficultyIndex) {

        if ([0,1,2,3].indexOf(difficultyIndex) === -1) {
            throw `Invalid difficulty ${difficultyIndex}`;
        }

        // 0 = play friend, 1 = easy, 2 = medium, 3 = impossible
        difficultyButtons.forEach(button => button.classList.remove("selected-button"));
        difficultyButtons[difficultyIndex].classList.add("selected-button");

        switch (difficultyIndex) {
            case 0:
                GameBoard.setTurnText("X to play.", "O to play.", "X won!", "O won!");
                break;
            case 1:
                GameBoard.setTurnText("Your turn.", "🐵 is thinking...", "You won!", "🐵 beat you!")
                break;
            case 2:
                GameBoard.setTurnText("Your turn.", "🤖 is thinking...", "You won!", "🤖 beat you!")
                break;
            case 3: 
                GameBoard.setTurnText("Your turn.", "🌞 is thinking...", "You won!", "🌞 beat you!")
                break;
        }

        if (currentDifficulty != difficultyIndex) {
            GameBoard.initialize();
        }

        currentDifficulty = difficultyIndex;
    }

    return {
        get currentDifficulty() { return currentDifficulty;},
        selectDifficulty
    };
})();

const AI = (()=> {
    let _turnDelay;

    function play() {
        _turnDelay = setTimeout(() => {
            GameBoard.computerPlay(_chooseMove());
        }, 800 + Math.floor(Math.random() * 1000));
    }

    function cancel() {
        clearTimeout(_turnDelay);
    }

    function _chooseMove() {
        // Monkey chooses randomly.
        if (DifficultySelector.currentDifficulty === 1) {
            let randomIndex = -1;
            do {
                randomIndex = Math.floor(Math.random() * 9);
            }
            while (GameBoard.boardState[randomIndex] !== "none");

            return randomIndex;
        }
        
    }

    return {
        play,
        cancel
    };
})();

GameBoard.initialize();
DifficultySelector.selectDifficulty(0);

let restartButton = document.getElementById("restart-button");
restartButton.addEventListener('click', GameBoard.restartGame);



// X and O svg paths
const pathX = `<svg class="symbol" viewBox="0 0 128 128">
<path class="x-stroke" d="M20,20L108,108"></path>
<path class="x-stroke" d="M108,20L20,108"></path>
</svg>`;
const pathO = `<svg class="symbol" viewBox="0 0 128 128">
<path class="o-stroke" d="M64,16A48,48 0 1,0 64,112A48,48 0 1,0 64,16"></path>
</svg>`;
