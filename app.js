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
    let _turnText1 = "";
    let _turnText2 = "";
    let _winText1 = "";
    let _winText2 = "";
    let _root = document.documentElement.style;

    function initialize() {
        _isGameOver = false;
        boardState = [];
        _isPlayerOneTurn = true;
        _waitForComputerTurn = false;
        
        _cells.forEach(cell => {
            boardState.push('none');
            cell.addEventListener('click', () => _selectCell(cell));
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
         AI.cancelTurn();
         _displayTurnText();
    }

    function restartGame() {
        restartButton.classList.remove("prevent-spin");
        restartButton.classList.add("spin");
        initialize();
    }

    function computerPlay(cellIndex) {
        _waitForComputerTurn = false;
        _selectCell(_cells[cellIndex]);
    }

    // Takes a representation of the board and returns 1 (X wins), -1 (O wins) or 0 (no winner).
    function winStatus(board, doHighlight=false) {
        let winningSymbol = "none";
        for (let i = 0; i < _winConditions.length; i++) {
            let condition = _winConditions[i];
            let check1 = board[condition[0]];
            if (check1 === "none") continue;
            let check2 = board[condition[1]];
            let check3 = board[condition[2]];
            
            if (check1 === check2 && check2 === check3) {
                winningSymbol = check1;
                if (doHighlight) _highlightWin(condition);
                break;
            }
        }

        switch (winningSymbol) {
            case "none":
                return 0;
            case "x":
                return 1;
            case "o":
                return -1;
        }
    }

    function setPossibleStatusText(player1TurnText, player2TurnText, player1WinText, player2WinText) {
        _turnText1 = player1TurnText;
        _turnText2 = player2TurnText;
        _winText1 = player1WinText;
        _winText2 = player2WinText;
    }

    function _displayTurnText() {
        _turnTextElement.textContent = _isPlayerOneTurn ? _turnText1 : _turnText2;
        let textColor = _isPlayerOneTurn ? "rgb(61, 173, 140)" : "rgb(197, 82, 130)";
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

    function _checkWin() {
        if (winStatus(boardState, true) !== 0) {
            _isGameOver = true;
            _turnTextElement.textContent = _isPlayerOneTurn ? _winText1 : _winText2;
            return;
        }
        if (boardState.indexOf("none") === -1) {
            _isGameOver = true;
            _root.setProperty("--turn-text-color", "black");
            _turnTextElement.textContent = "Cat's game!";
            return;
        }
        
        _nextTurn();
    }

    function _nextTurn() {
        _isPlayerOneTurn = !_isPlayerOneTurn;
        if (DifficultySelector.currentDifficulty !== 0 && !_isPlayerOneTurn) {
            _waitForComputerTurn = true;
            AI.play();
        }
        _displayTurnText();
    }

    function _highlightWin(winCells) {
        winCells.forEach(cellIndex => _cells[cellIndex].classList.add("highlighted-cell"));
    }

    return {
        initialize,
        restartGame,
        winStatus,
        setPossibleStatusText,
        computerPlay,
        get boardState() { return boardState; }
    };
})();

const DifficultySelector = (() => {
    let currentDifficulty = -1;
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
        // 0 = play friend, 1 = easy, 2 = medium, 3 = impossible
        difficultyButtons.forEach(button => button.classList.remove("selected-button"));
        difficultyButtons[difficultyIndex].classList.add("selected-button");

        switch (difficultyIndex) {
            case 0:
                GameBoard.setPossibleStatusText("X to play.", "O to play.", "X won!", "O won!");
                break;
            case 1:
                GameBoard.setPossibleStatusText("Your turn.", "🐵 is thinking...", "You won!", "🐵 beat you!")
                break;
            case 2:
                GameBoard.setPossibleStatusText("Your turn.", "🤖 is processing...", "You won!", "🤖 beat you!")
                break;
            case 3: 
                GameBoard.setPossibleStatusText("Your turn.", "🌞 is amused.", "You won!", "🌞 beat you!")
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
    let _turnTimeout;

    function play() {
        _turnTimeout = setTimeout(() => {
            GameBoard.computerPlay(_calculateNextMove());
        }, 850 + Math.floor(Math.random() * 1000));
    }

    function cancelTurn() {
        clearTimeout(_turnTimeout);
    }

    function _calculateNextMove() {
        switch (DifficultySelector.currentDifficulty) {
            case 1:
                return _randomMove();
            case 2:
                return Math.random() > 0.8 ? _randomMove() : _perfectMove();
            case 3:
                return _perfectMove();
        }
    }

    function _randomMove() {
        let availableCells = _availableCellIndexes(GameBoard.boardState);
        return availableCells[Math.floor(Math.random() * availableCells.length)];
    }

    function _perfectMove() {
        let availableCells = _availableCellIndexes(GameBoard.boardState);
        let possibleOutcomes = [];

        availableCells.forEach(cellIndex => {
            let tempBoard = [...GameBoard.boardState];
            tempBoard[cellIndex] = "o";
            possibleOutcomes.push(_minimax(tempBoard, true));
        })

        let bestOutcome = Math.min(...possibleOutcomes);
        let perfectCellIndexes = [];
        for (let i = 0; i < possibleOutcomes.length; i++) {
            if (possibleOutcomes[i] === bestOutcome) {
                perfectCellIndexes.push(availableCells[i]);
            }
        }

        let randomIndex = Math.floor(Math.random() * perfectCellIndexes.length);
        return perfectCellIndexes[randomIndex];
    }

    function _minimax(boardPosition, isMaximizing) {
        let availableCells = _availableCellIndexes(boardPosition);
        let possibleOutcomes = [];

        let winStatusBeforeTest = GameBoard.winStatus(boardPosition);
        if (winStatusBeforeTest !== 0) return winStatusBeforeTest;

        for (let i = 0; i < availableCells.length; i++) {
            let cellIndex = availableCells[i];

            let tempBoard = [...boardPosition];
            tempBoard[cellIndex] = isMaximizing ? "x" : "o";
            let isBoardFull = tempBoard.indexOf("none") === -1;
            let winStatus = GameBoard.winStatus(tempBoard);

            if (isBoardFull) return winStatus;

            if (winStatus === 0) {
                possibleOutcomes.push(_minimax(tempBoard, !isMaximizing));
            } else {
                possibleOutcomes.push(winStatus);
            }
        }
    
        return isMaximizing ? Math.max(...possibleOutcomes) : Math.min(...possibleOutcomes);
    }

    function _availableCellIndexes(board) {
        let available = [];
        for (let i = 0; i < board.length; i++) {
            if (board[i] === "none") available.push(i);
        } 
        return available;
    }

    return {
        play,
        cancelTurn
    };
})();

// Program

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
