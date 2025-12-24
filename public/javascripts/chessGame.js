const socket = io();
const chess = new Chess();

const boardElement = document.querySelector(".chessboard");
const currentTurnElement = document.getElementById("current-turn");
const gameStatusElement = document.getElementById("game-status");
const moveListElement = document.getElementById("move-list");
const whitePlayerCard = document.getElementById("white-player-card");
const blackPlayerCard = document.getElementById("black-player-card");
const whiteCapturedElement = document.getElementById("white-captured");
const blackCapturedElement = document.getElementById("black-captured");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;
let gameId = "game1";
let selectedSquare = null;
let capturedPieces = { white: [], black: [] };

// Piece Unicode mapping
const getPieceUnicode = (piece) => {
    const unicodePieces = {
        k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙",
        K: "♚", Q: "♛", R: "♜", B: "♝", N: "♞", P: "♟",
    };
    return unicodePieces[piece.type] || "";
};

// Sound effects (placeholder - will work when audio files are added)
const playSound = (soundType) => {
    // Placeholder for sound effects
    // const audio = new Audio(`/sounds/${soundType}.mp3`);
    // audio.play().catch(e => console.log('Sound play failed:', e));
};

// Render the chess board
const renderBoard = () => {
    boardElement.innerHTML = "";
    const board = chess.board();
    
    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const squareElement = document.createElement("div");
            const squareName = `${String.fromCharCode(97 + squareIndex)}${8 - rowIndex}`;
            
            squareElement.classList.add("square", (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark");
            squareElement.dataset.square = squareName;

            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add("piece", square.color === "w" ? "white" : "black");
                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener("dragstart", handleDragStart);
                pieceElement.addEventListener("dragend", handleDragEnd);
                pieceElement.addEventListener("click", () => handlePieceClick(squareName));

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener("dragover", handleDragOver);
            squareElement.addEventListener("drop", handleDrop);
            squareElement.addEventListener("click", () => handleSquareClick(squareName));
            
            boardElement.appendChild(squareElement);
        });
    });

    if (playerRole === "b") {
        boardElement.classList.add("flipped");
    } else {
        boardElement.classList.remove("flipped");
    }

    updateGameInfo();
    updatePlayerCards();
};

// Handle piece click for move selection
const handlePieceClick = (square) => {
    if (!playerRole) return;
    
    const piece = chess.get(square);
    if (piece && piece.color === playerRole) {
        clearHighlights();
        selectedSquare = square;
        highlightSquare(square, 'selected');
        showLegalMoves(square);
    }
};

// Handle square click for move completion
const handleSquareClick = (square) => {
    if (selectedSquare && selectedSquare !== square) {
        handleMove(selectedSquare, square);
        clearHighlights();
        selectedSquare = null;
    }
};

// Show legal moves for a piece
const showLegalMoves = (square) => {
    const moves = chess.moves({ square: square, verbose: true });
    moves.forEach(move => {
        const targetSquare = document.querySelector(`[data-square="${move.to}"]`);
        if (targetSquare) {
            targetSquare.classList.add('legal-move');
            if (targetSquare.querySelector('.piece')) {
                targetSquare.classList.add('has-piece');
            }
        }
    });
};

// Clear all highlights
const clearHighlights = () => {
    document.querySelectorAll('.square').forEach(sq => {
        sq.classList.remove('legal-move', 'has-piece', 'selected');
    });
};

// Highlight a specific square
const highlightSquare = (square, className) => {
    const squareElement = document.querySelector(`[data-square="${square}"]`);
    if (squareElement) {
        squareElement.classList.add(className);
    }
};

// Drag and drop handlers
const handleDragStart = (e) => {
    if (e.target.draggable) {
        draggedPiece = e.target;
        sourceSquare = e.target.parentElement.dataset.square;
        e.dataTransfer.setData("text/plain", "");
        setTimeout(() => {
            e.target.classList.add("dragging");
            clearHighlights();
            selectedSquare = sourceSquare;
            highlightSquare(sourceSquare, 'selected');
            showLegalMoves(sourceSquare);
        }, 0);
    }
};

const handleDragEnd = (e) => {
    draggedPiece = null;
    e.target.classList.remove("dragging");
    setTimeout(() => {
        clearHighlights();
        selectedSquare = null;
    }, 100);
};

const handleDragOver = (e) => {
    e.preventDefault();
};

const handleDrop = (e) => {
    e.preventDefault();
    if (draggedPiece && sourceSquare) {
        const targetSquare = e.target.dataset.square || e.target.parentElement.dataset.square;
        if (targetSquare) {
            handleMove(sourceSquare, targetSquare);
        }
    }
};

// Handle move execution
const handleMove = (from, to) => {
    // Check if move is a pawn promotion
    const piece = chess.get(from);
    if (piece && piece.type === 'p') {
        const toRank = to[1];
        if ((piece.color === 'w' && toRank === '8') || (piece.color === 'b' && toRank === '1')) {
            showPromotionModal(from, to);
            return;
        }
    }
    
    const move = { from, to, promotion: 'q' };
    socket.emit("move", { gameId, move });
};

// Promotion modal
const showPromotionModal = (from, to) => {
    const modal = document.getElementById('promotion-modal');
    const optionsContainer = document.getElementById('promotion-options');
    optionsContainer.innerHTML = '';
    
    const pieces = ['q', 'r', 'b', 'n'];
    const pieceSymbols = { q: '♕', r: '♖', b: '♗', n: '♘' };
    
    pieces.forEach(pieceType => {
        const pieceElement = document.createElement('div');
        pieceElement.className = 'promotion-piece';
        pieceElement.innerText = pieceSymbols[pieceType];
        pieceElement.onclick = () => {
            modal.classList.add('hidden');
            const move = { from, to, promotion: pieceType };
            socket.emit("move", { gameId, move });
        };
        optionsContainer.appendChild(pieceElement);
    });
    
    modal.classList.remove('hidden');
};

// Update game information
const updateGameInfo = () => {
    const turn = chess.turn();
    currentTurnElement.textContent = `Current Turn: ${turn === 'w' ? 'White' : 'Black'}`;
    
    // Update game status
    gameStatusElement.className = '';
    if (chess.in_checkmate()) {
        gameStatusElement.textContent = "Checkmate!";
        gameStatusElement.className = 'checkmate';
    } else if (chess.in_check()) {
        gameStatusElement.textContent = "Check!";
        gameStatusElement.className = 'check';
        playSound('check');
    } else if (chess.in_draw()) {
        gameStatusElement.textContent = "Draw";
    } else if (chess.in_stalemate()) {
        gameStatusElement.textContent = "Stalemate";
    } else {
        gameStatusElement.textContent = "";
    }
};

// Update player cards with active state
const updatePlayerCards = () => {
    const turn = chess.turn();
    if (turn === 'w') {
        whitePlayerCard.classList.add('active');
        blackPlayerCard.classList.remove('active');
    } else {
        blackPlayerCard.classList.add('active');
        whitePlayerCard.classList.remove('active');
    }
};

// Track captured pieces
const updateCapturedPieces = (move) => {
    if (move.captured) {
        const capturedPiece = {
            type: move.captured,
            color: move.color === 'w' ? 'b' : 'w'
        };
        
        if (move.color === 'w') {
            capturedPieces.white.push(capturedPiece);
        } else {
            capturedPieces.black.push(capturedPiece);
        }
        
        renderCapturedPieces();
    }
};

// Render captured pieces
const renderCapturedPieces = () => {
    whiteCapturedElement.innerHTML = '';
    blackCapturedElement.innerHTML = '';
    
    capturedPieces.white.forEach(piece => {
        const pieceElement = document.createElement('span');
        pieceElement.className = 'captured-piece';
        pieceElement.innerText = getPieceUnicode({ type: piece.type, color: piece.color });
        whiteCapturedElement.appendChild(pieceElement);
    });
    
    capturedPieces.black.forEach(piece => {
        const pieceElement = document.createElement('span');
        pieceElement.className = 'captured-piece';
        pieceElement.innerText = getPieceUnicode({ type: piece.type, color: piece.color });
        blackCapturedElement.appendChild(pieceElement);
    });
};

// Update move list
const updateMoveList = (moveHistory) => {
    moveListElement.innerHTML = "";
    moveHistory.forEach((move, index) => {
        const li = document.createElement("li");
        const moveNumber = Math.floor(index / 2) + 1;
        const isWhite = index % 2 === 0;
        li.textContent = isWhite ? `${moveNumber}. ${move}` : `${moveNumber}... ${move}`;
        moveListElement.appendChild(li);
    });
    
    // Auto-scroll to bottom
    moveListElement.scrollTop = moveListElement.scrollHeight;
};

// Highlight last move
const highlightLastMove = (move) => {
    document.querySelectorAll('.square').forEach(sq => {
        sq.classList.remove('last-move');
    });
    
    if (move.from) highlightSquare(move.from, 'last-move');
    if (move.to) highlightSquare(move.to, 'last-move');
};

// Socket event handlers
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
    const result = chess.move(move);
    if (result) {
        updateCapturedPieces(result);
        highlightLastMove(move);
        playSound(result.captured ? 'capture' : 'move');
    }
    renderBoard();
});

socket.on("moveHistory", (moveHistory) => {
    updateMoveList(moveHistory);
});

socket.on("invalidMove", (move) => {
    console.log("Invalid move:", move);
    playSound('error');
});

socket.on("gameOver", (reason) => {
    playSound('game-end');
    setTimeout(() => {
        showGameOverModal(reason);
    }, 500);
});

socket.on("playerLeft", (color) => {
    showInfoModal('Player Left', `${color} player has left the game.`);
});

// Player name events
socket.on('playerNames', ({ white, black }) => {
    if (typeof updatePlayerNames === 'function') {
        updatePlayerNames(white, black);
    }
    
    // Store opponent name
    if (playerRole === 'w') {
        opponentName = black;
    } else if (playerRole === 'b') {
        opponentName = white;
    }
    
    // Hide waiting modal when both players are ready
    if (white && black && typeof hideWaitingModal === 'function') {
        hideWaitingModal();
    }
});

socket.on('waitingForOpponent', () => {
    if (typeof showWaitingModal === 'function') {
        showWaitingModal();
    }
});

socket.on('gameReady', () => {
    if (typeof hideWaitingModal === 'function') {
        hideWaitingModal();
    }
});


// Chat functionality
const chatMessagesElement = document.getElementById('chat-messages');
const chatInputElement = document.getElementById('chat-input');
const chatSendButton = document.getElementById('chat-send');

function sendChatMessage() {
    const message = chatInputElement.value.trim();
    if (message !== '') {
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

socket.on('chatMessage', ({ sender, message, senderName }) => {
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    
    // Determine if this is the current player's message (sender) or receiver's message
    // Sender's messages go on RIGHT, receiver's messages go on LEFT (like WhatsApp)
    const isSenderMessage = 
        (playerRole === 'w' && sender === 'White') || 
        (playerRole === 'b' && sender === 'Black');
    
    if (isSenderMessage) {
        // My message - align right
        messageElement.classList.add('sender-message');
    } else {
        // Other person's message - align left
        messageElement.classList.add('receiver-message');
    }
    
    // Add color class for styling
    if (sender === 'White') {
        messageElement.classList.add('white');
    } else if (sender === 'Black') {
        messageElement.classList.add('black');
    } else {
        messageElement.classList.add('spectator');
    }
    
    // Create message structure
    const senderElement = document.createElement('div');
    senderElement.className = 'sender';
    // Use senderName from server if available, otherwise use sender
    senderElement.textContent = senderName || sender;
    
    const messageText = document.createElement('div');
    messageText.className = 'message-text';
    messageText.textContent = message;
    
    messageElement.appendChild(senderElement);
    messageElement.appendChild(messageText);
    
    chatMessagesElement.appendChild(messageElement);
    chatMessagesElement.scrollTop = chatMessagesElement.scrollHeight;
});

// Flip board functionality
document.addEventListener('DOMContentLoaded', () => {
    const flipBoardButton = document.getElementById('flip-board');
    const chessboard = document.querySelector('.chessboard');
    
    flipBoardButton.addEventListener('click', () => {
        chessboard.classList.toggle('flipped');
        
        // Update pieces rotation
        document.querySelectorAll('.piece').forEach(piece => {
            if (chessboard.classList.contains('flipped')) {
                piece.style.transform = 'rotate(180deg)';
            } else {
                piece.style.transform = 'rotate(0deg)';
            }
        });
    });
    
    // Resign button
    const resignButton = document.getElementById('resign-btn');
    resignButton.addEventListener('click', () => {
        showResignModal(() => {
            socket.emit('resign', { gameId });
        });
    });
});

// Initial render
renderBoard();