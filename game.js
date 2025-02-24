let currentPlayer = 'X';
let gameBoard = ['', '', '', '', '', '', '', '', ''];
let gameActive = true;
let gameMode = 'user'; // 'user' or 'computer'
let isPlayerX = true; // Add this new variable
let moveHistory = [];
let redoStack = [];

const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6] // Diagonals
];

function setGameMode(mode) {
    gameMode = mode;
    isPlayerX = true;
    restartGame();
    
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Reset the game state
    currentPlayer = 'X';
    gameActive = true;
    updatePlayerIndicator();
    enableBoard();
    addCellHoverEffects();

    // Only start computer's turn if in computer mode and it's O's turn
    if (mode === 'computer' && currentPlayer === 'O') {
        disableBoard();
        makeComputerMove();
    }
}

function updatePlayerIndicator() {
    const indicator = document.getElementById('playerIndicator');
    if (gameMode === 'computer') {
        indicator.textContent = currentPlayer === 'X' ? 'Your Turn (X)' : 'Computer\'s Turn (O)';
    } else {
        indicator.textContent = `Player ${currentPlayer}'s Turn`;
    }
}

function addCellHoverEffects() {
    document.querySelectorAll('.cell').forEach(cell => {
        if (cell.textContent === '') {
            cell.classList.add(currentPlayer.toLowerCase() === 'x' ? 'x-hover' : 'o-hover');
        }
    });
}

function removeCellHoverEffects() {
    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('x-hover', 'o-hover');
    });
}

function makeMove(cellIndex) {
    if (gameBoard[cellIndex] === '' && gameActive) {
        // Don't allow player to move during computer's turn
        if (gameMode === 'computer' && currentPlayer === 'O') return;

        const previousState = {
            board: [...gameBoard],
            player: currentPlayer
        };
        moveHistory.push(previousState);
        redoStack = [];
        updateControlButtons();

        gameBoard[cellIndex] = currentPlayer;
        const cell = document.getElementsByClassName('cell')[cellIndex];
        cell.textContent = currentPlayer;
        cell.classList.add('animate__animated', 'animate__bounceIn');
        cell.classList.add(currentPlayer.toLowerCase());
        removeCellHoverEffects();

        if (checkWinner()) {
            highlightWinningCombination();
            let winMessage;
            if (gameMode === 'computer') {
                winMessage = currentPlayer === 'X' ? 'You Win! 🎉' : 'You Lose! 😔';
            } else {
                winMessage = `Player ${currentPlayer} Wins! 🎉`;
            }
            showWinner(winMessage);
            gameActive = false;
            return;
        }

        if (checkDraw()) {
            showWinner("It's a Draw! 🤝");
            gameActive = false;
            return;
        }

        // Switch players
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        updatePlayerIndicator();

        // Only make computer move in computer mode
        if (gameMode === 'computer' && currentPlayer === 'O' && gameActive) {
            disableBoard();
            setTimeout(() => {
                makeComputerMove();
            }, 500);
        } else {
            addCellHoverEffects();
            enableBoard();
        }
    }
}

function makeComputerMove() {
    if (!gameActive) return;

    // Add a small delay to make it feel more natural
    setTimeout(() => {
        // Try to win
        let moveIndex = findBestMove('O');
        
        // If no winning move, try to block player
        if (moveIndex === -1) {
            moveIndex = findBestMove('X');
        }
        
        // If no blocking move needed, try center if available
        if (moveIndex === -1 && gameBoard[4] === '') {
            moveIndex = 4;
        }
        
        // If still no move found, choose a random corner or side
        if (moveIndex === -1) {
            const emptyCells = gameBoard.reduce((acc, cell, index) => {
                if (cell === '') acc.push(index);
                return acc;
            }, []);
            
            if (emptyCells.length > 0) {
                moveIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            }
        }

        // Make the move if a valid position was found
        if (moveIndex !== -1 && gameBoard[moveIndex] === '') {
            gameBoard[moveIndex] = 'O';
            const cell = document.getElementsByClassName('cell')[moveIndex];
            cell.textContent = 'O';
            cell.classList.add('animate__animated', 'animate__bounceIn');
            cell.classList.add('o');

            if (checkWinner()) {
                highlightWinningCombination();
                showWinner('You Lose! 😔');
                gameActive = false;
                return;
            }

            if (checkDraw()) {
                showWinner("It's a Draw! 🤝");
                gameActive = false;
                return;
            }

            currentPlayer = 'X';
            updatePlayerIndicator();
            enableBoard();
            addCellHoverEffects();
        }
    }, 500);
}

function findBestMove(player) {
    // Check for winning moves
    for (let combination of winningCombinations) {
        const cells = combination.map(index => gameBoard[index]);
        const playerCells = cells.filter(cell => cell === player).length;
        const emptyCells = cells.filter(cell => cell === '').length;

        if (playerCells === 2 && emptyCells === 1) {
            return combination[cells.indexOf('')];
        }
    }
    return -1;
}

function checkWinner() {
    return winningCombinations.some(combination => {
        return combination.every(index => {
            return gameBoard[index] === currentPlayer;
        });
    });
}

function checkDraw() {
    return gameBoard.every(cell => cell !== '');
}

function showWinner(message) {
    const modal = document.querySelector('.winner-modal');
    const winnerText = document.getElementById('winner-text');
    modal.style.display = 'flex';
    winnerText.textContent = message;
    createConfetti();
}

function createConfetti() {
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti');
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.animationDelay = Math.random() * 3 + 's';
        confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 3000);
    }
}

function undoMove() {
    if (moveHistory.length === 0) return;
    
    const previousState = moveHistory.pop();
    redoStack.push({
        board: [...gameBoard],
        player: currentPlayer
    });
    
    gameBoard = previousState.board;
    currentPlayer = previousState.player;
    gameActive = true;
    
    updateBoard();
    updatePlayerIndicator();
    updateControlButtons();
}

function redoMove() {
    if (redoStack.length === 0) return;
    
    const nextState = redoStack.pop();
    moveHistory.push({
        board: [...gameBoard],
        player: currentPlayer
    });
    
    gameBoard = nextState.board;
    currentPlayer = nextState.player === 'X' ? 'O' : 'X';
    gameActive = true;
    
    updateBoard();
    updatePlayerIndicator();
    updateControlButtons();
}

function updateBoard() {
    const cells = document.getElementsByClassName('cell');
    for (let i = 0; i < cells.length; i++) {
        cells[i].textContent = gameBoard[i];
        cells[i].classList.remove('animate__animated', 'animate__bounceIn', 'x', 'o', 'winner');
        if (gameBoard[i] === 'X') {
            cells[i].classList.add('x');
        } else if (gameBoard[i] === 'O') {
            cells[i].classList.add('o');
        }
    }
    removeCellHoverEffects();
    addCellHoverEffects();
}

function updateControlButtons() {
    document.getElementById('undoBtn').disabled = moveHistory.length === 0;
    document.getElementById('redoBtn').disabled = redoStack.length === 0;
}

function restartGame() {
    gameBoard = ['', '', '', '', '', '', '', '', ''];
    gameActive = true;
    currentPlayer = 'X';
    moveHistory = [];
    redoStack = [];
    
    document.querySelectorAll('.cell').forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('animate__animated', 'animate__bounceIn', 'x', 'o', 'winner', 'x-hover', 'o-hover');
        cell.style.pointerEvents = 'auto';
    });
    document.querySelector('.winner-modal').style.display = 'none';
    updatePlayerIndicator();
    updateControlButtons();
    addCellHoverEffects();
    enableBoard();

    // Only make computer move if in computer mode and it's O's turn
    if (gameMode === 'computer' && currentPlayer === 'O') {
        disableBoard();
        setTimeout(() => {
            makeComputerMove();
        }, 500);
    }
}

function highlightWinningCombination() {
    const winningCombo = winningCombinations.find(combination => {
        return combination.every(index => gameBoard[index] === currentPlayer);
    });

    if (winningCombo) {
        winningCombo.forEach(index => {
            document.getElementsByClassName('cell')[index].classList.add('winner');
        });
    }
}

// Add these new functions to handle board state
function disableBoard() {
    document.querySelectorAll('.cell').forEach(cell => {
        cell.style.pointerEvents = 'none';
    });
}

function enableBoard() {
    document.querySelectorAll('.cell').forEach(cell => {
        cell.style.pointerEvents = 'auto';
    });
}

// Initialize the game
restartGame();

// Initialize hover effects when the game starts
addCellHoverEffects(); 