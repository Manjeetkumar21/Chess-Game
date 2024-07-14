const socket = io();
const chess = new Chess();

const boardElement = document.querySelector(".chessboard");
const currentTurnElement = document.getElementById("current-turn");
const gameStatusElement = document.getElementById("game-status");
const moveListElement = document.getElementById("move-list");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;
let gameId = "game1";

const getPieceUnicode = (piece) => {
    const unicodePieces = {
        k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙",
        K: "♚", Q: "♛", R: "♜", B: "♝", N: "♞", P: "♟",
    };
    return unicodePieces[piece.type] || "";
};

const renderBoard = () => {
    boardElement.innerHTML = "";
    const board = chess.board();
    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add("square", (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark");
            squareElement.dataset.square = `${String.fromCharCode(97 + squareIndex)}${8 - rowIndex}`;

            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add("piece", square.color === "w" ? "white" : "black");
                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener("dragstart", handleDragStart);
                pieceElement.addEventListener("dragend", handleDragEnd);

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener("dragover", handleDragOver);
            squareElement.addEventListener("drop", handleDrop);
            
            boardElement.appendChild(squareElement);
        });
    });

    if (playerRole === "b") {
        boardElement.classList.add("flipped");
    } else {
        boardElement.classList.remove("flipped");
    }

    updateGameInfo();
};

const handleDragStart = (e) => {
    if (e.target.draggable) {
        draggedPiece = e.target;
        sourceSquare = e.target.parentElement.dataset.square;
        e.dataTransfer.setData("text/plain", "");
        setTimeout(() => e.target.classList.add("dragging"), 0);
    }
};

const handleDragEnd = (e) => {
    draggedPiece = null;
    sourceSquare = null;
    e.target.classList.remove("dragging");
};

const handleDragOver = (e) => {
    e.preventDefault();
};

const handleDrop = (e) => {
    e.preventDefault();
    if (draggedPiece) {
        const targetSquare = e.target.dataset.square || e.target.parentElement.dataset.square;
        handleMove(sourceSquare, targetSquare);
    }
};

const handleMove = (from, to) => {
    const move = { from, to, promotion: 'q' }; // Default promotion to queen
    socket.emit("move", { gameId, move });
};

const updateGameInfo = () => {
    currentTurnElement.textContent = `Current Turn: ${chess.turn() === 'w' ? 'White' : 'Black'}`;
    if (chess.in_check()) {
        gameStatusElement.textContent = "Check!";
        
    } else if (chess.in_checkmate()) {
        gameStatusElement.textContent = "Checkmate!";
    } else if (chess.in_draw()) {
        gameStatusElement.textContent = "Draw";
    } else {
        gameStatusElement.textContent = "";
    }
};
const updateMoveList = (moveHistory) => {
    moveListElement.innerHTML = "";
    moveHistory.forEach((move, index) => {
        const li = document.createElement("li");
        li.textContent = `${Math.floor(index/2) + 1}. ${move}`;
        moveListElement.appendChild(li);
    });
};

socket.emit("joinGame", gameId);

socket.on("playerRole", (role) => {
    playerRole = role;
    renderBoard();
});

socket.on("spectatorRole", () => {
    playerRole = null;
    renderBoard();
});

socket.on("boardState", (fen) => {
    chess.load(fen);
    renderBoard();
});

socket.on("move", (move) => {
    chess.move(move);
    renderBoard();
});

socket.on("moveHistory", (moveHistory) => {
    updateMoveList(moveHistory);
});

socket.on("invalidMove", (move) => {
    console.log("Invalid move:", move);
});

socket.on("gameOver", (reason) => {
    alert(`Game Over: ${reason}`);
});

socket.on("playerLeft", (color) => {
    alert(`${color} player has left the game.`);
});

renderBoard();

// Chat functionality
const chatMessagesElement = document.getElementById('chat-messages');
const chatInputElement = document.getElementById('chat-input');
const chatSendButton = document.getElementById('chat-send');

function sendChatMessage() {
    const message = chatInputElement.value.trim();
    if (message !== '') {
        console.log('Sending message:', message); // Debug log
        socket.emit('chatMessage', { gameId, message });
        chatInputElement.value = '';
    }
}

chatInputElement.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendChatMessage();
    }
});

chatSendButton.addEventListener('click', sendChatMessage);

socket.on('chatMessage', ({ sender, message }) => {
    console.log('Received message:', sender, message); // Debug log
    const messageElement = document.createElement('div');
    messageElement.textContent = `${sender}: ${message}`;
    chatMessagesElement.appendChild(messageElement);
    chatMessagesElement.scrollTop = chatMessagesElement.scrollHeight;
});


document.addEventListener('DOMContentLoaded', () => {
    const flipBoardButton = document.getElementById('flip-board');
    const chessboard = document.querySelector('.chessboard');
    let boardFlipped = false;

    // Flip board
    flipBoardButton.addEventListener('click', () => {
        boardFlipped = !boardFlipped;
        chessboard.style.transform = boardFlipped ? 'rotate(180deg)' : 'rotate(0deg)';
        document.querySelectorAll('.piece').forEach(piece => {
            piece.style.transform = boardFlipped ? 'rotate(180deg)' : 'rotate(0deg)';
        });
    });
});