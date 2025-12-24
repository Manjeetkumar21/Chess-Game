let playerName = '';
let opponentName = '';

document.addEventListener('DOMContentLoaded', () => {
    const nameModal = document.getElementById('name-input-modal');
    const nameInput = document.getElementById('player-name-input');
    const submitBtn = document.getElementById('name-submit-btn');
    
    setTimeout(() => {
        if (nameInput) nameInput.focus();
    }, 500);
    
    const submitName = () => {
        const name = nameInput.value.trim();
        if (name.length > 0) {
            playerName = name;
            nameModal.classList.add('hidden');
            
            const waitForSocket = setInterval(() => {
                if (typeof socket !== 'undefined' && typeof gameId !== 'undefined') {
                    clearInterval(waitForSocket);
                    socket.emit('setPlayerName', { gameId, name: playerName });
                    showWaitingModal();
                }
            }, 100);
        } else {
            nameInput.style.borderColor = 'var(--accent-danger)';
            setTimeout(() => {
                nameInput.style.borderColor = '';
            }, 1000);
        }
    };
    
    submitBtn.addEventListener('click', submitName);
    
    nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitName();
        }
    });
});

function showWaitingModal() {
    const waitingModal = document.getElementById('waiting-modal');
    waitingModal.classList.remove('hidden');
}

function hideWaitingModal() {
    const waitingModal = document.getElementById('waiting-modal');
    waitingModal.classList.add('hidden');
}
function updatePlayerNames(whiteName, blackName) {
    const whitePlayerCard = document.getElementById('white-player-card');
    const blackPlayerCard = document.getElementById('black-player-card');
    
    if (whiteName) {
        const whiteNameElement = whitePlayerCard.querySelector('.player-name span:last-child');
        whiteNameElement.textContent = whiteName;
    }
    
    if (blackName) {
        const blackNameElement = blackPlayerCard.querySelector('.player-name span:last-child');
        blackNameElement.textContent = blackName;
    }
}

function getPlayerNameForChat(sender) {
    if (sender === 'White') {
        return playerRole === 'w' ? playerName : opponentName;
    } else if (sender === 'Black') {
        return playerRole === 'b' ? playerName : opponentName;
    }
    return sender;
}
