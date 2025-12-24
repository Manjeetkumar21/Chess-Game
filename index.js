const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");
const port = 3000;

const app = express();
const server = http.createServer(app);
const io = socket(server);

const games = {};

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("index.ejs", { title: "Chess Game" });
});

io.on("connection", (socket) => {
    console.log("Connected:", socket.id);

    socket.on("joinGame", (gameId) => {
        console.log(`Player ${socket.id} joining game ${gameId}`);
        if (!games[gameId]) {
            games[gameId] = {
                chess: new Chess(),
                players: {},
                playerNames: {},
                spectators: [],
                moveHistory: []
            };
        }

        const game = games[gameId];

        if (!game.players.white) {
            game.players.white = socket.id;
            socket.emit("playerRole", "w");
        } else if (!game.players.black) {
            game.players.black = socket.id;
            socket.emit("playerRole", "b");
        } else {
            game.spectators.push(socket.id);
            socket.emit("spectatorRole");
        }

        socket.join(gameId);
        socket.emit("boardState", game.chess.fen());
        socket.emit("moveHistory", game.moveHistory);
    });

    socket.on("setPlayerName", ({ gameId, name }) => {
        const game = games[gameId];
        if (!game) return;
        
        // Store player name
        if (socket.id === game.players.white) {
            game.playerNames.white = name;
        } else if (socket.id === game.players.black) {
            game.playerNames.black = name;
        }
        
        // Send player names to all clients
        io.to(gameId).emit("playerNames", {
            white: game.playerNames.white || null,
            black: game.playerNames.black || null
        });
        
        // If both players have names, notify that game is ready
        if (game.playerNames.white && game.playerNames.black) {
            io.to(gameId).emit("gameReady");
        } else {
            // Still waiting for the other player
            socket.emit("waitingForOpponent");
        }
    });

    socket.on("move", ({ gameId, move }) => {
        const game = games[gameId];
        if (!game) return;

        try {
            if (game.chess.turn() === "w" && socket.id !== game.players.white) return;
            if (game.chess.turn() === "b" && socket.id !== game.players.black) return;

            const result = game.chess.move(move);
            if (result) {
                game.moveHistory.push(result.san);
                io.to(gameId).emit("move", move);
                io.to(gameId).emit("boardState", game.chess.fen());
                io.to(gameId).emit("moveHistory", game.moveHistory);

                if (game.chess.isGameOver()) {
                    let gameOverReason;
                    if (game.chess.isCheckmate()) gameOverReason = "Checkmate";
                    else if (game.chess.isDraw()) gameOverReason = "Draw";
                    else if (game.chess.isStalemate()) gameOverReason = "Stalemate";
                    else if (game.chess.isThreefoldRepetition()) gameOverReason = "Threefold Repetition";
                    else if (game.chess.isInsufficientMaterial()) gameOverReason = "Insufficient Material";

                    io.to(gameId).emit("gameOver", gameOverReason);
                }
            }
        } catch (err) {
            console.log(err);
            socket.emit("invalidMove", move);
        }
    });

    socket.on("chatMessage", ({ gameId, message }) => {
        console.log('Received chat message:', gameId, message);
        const game = games[gameId];
        if (game) {
            let sender = "Spectator";
            let senderName = "Spectator";
            
            if (socket.id === game.players.white) {
                sender = "White";
                senderName = game.playerNames.white || "White Player";
            }
            if (socket.id === game.players.black) {
                sender = "Black";
                senderName = game.playerNames.black || "Black Player";
            }
            
            console.log('Broadcasting message:', senderName, message);
            io.to(gameId).emit("chatMessage", { sender, message, senderName });
        } else {
            console.log('Game not found:', gameId);
        }
    });

    socket.on("resign", ({ gameId }) => {
        const game = games[gameId];
        if (!game) return;

        let winner = null;
        if (socket.id === game.players.white) {
            winner = "Black";
        } else if (socket.id === game.players.black) {
            winner = "White";
        }

        if (winner) {
            io.to(gameId).emit("gameOver", `${winner} wins by resignation`);
        }
    });

    socket.on("disconnect", () => {
        for (const gameId in games) {
            const game = games[gameId];
            if (socket.id === game.players.white) {
                delete game.players.white;
                io.to(gameId).emit("playerLeft", "White");
            } else if (socket.id === game.players.black) {
                delete game.players.black;
                io.to(gameId).emit("playerLeft", "Black");
            } else {
                game.spectators = game.spectators.filter(id => id !== socket.id);
            }
            if (!game.players.white && !game.players.black && game.spectators.length === 0) {
                delete games[gameId];
            }
        }
    });
});

server.listen(port, () => {
    console.log(`Server is running at port ${port}`);
});