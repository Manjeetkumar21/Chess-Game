// Modal and Confetti Functions

// Show game over modal with confetti
function showGameOverModal(reason) {
    const modal = document.getElementById('game-over-modal');
    const title = document.getElementById('modal-title');
    const message = document.getElementById('modal-message');
    const icon = document.getElementById('modal-icon');
    
    // Determine if current player won
    const isWinner = 
        (reason.includes('White wins') && playerRole === 'w') ||
        (reason.includes('Black wins') && playerRole === 'b');
    
    const isDraw = reason.includes('Draw') || reason.includes('Stalemate');
    
    // Set modal content
    if (isWinner) {
        title.textContent = '🎉 Victory!';
        message.textContent = reason;
        icon.innerHTML = '👑';
        icon.className = 'modal-icon winner';
        
        // Trigger confetti
        triggerConfetti();
    } else if (isDraw) {
        title.textContent = 'Draw';
        message.textContent = reason;
        icon.innerHTML = '🤝';
        icon.className = 'modal-icon draw';
    } else {
        title.textContent = 'Game Over';
        message.textContent = reason;
        icon.innerHTML = '😔';
        icon.className = 'modal-icon loser';
    }
    
    modal.classList.remove('hidden');
}

// Show info modal
function showInfoModal(title, message) {
    const modal = document.getElementById('game-over-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const icon = document.getElementById('modal-icon');
    
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    icon.innerHTML = 'ℹ️';
    icon.className = 'modal-icon';
    
    modal.classList.remove('hidden');
}

// Confetti animation
function triggerConfetti() {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 2000 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        // Confetti from left
        confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        
        // Confetti from right
        confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
    }, 250);
}

// Show resign confirmation modal
function showResignModal(onConfirm) {
    const modal = document.getElementById('resign-modal');
    modal.classList.remove('hidden');
    
    // Store the callback
    window.resignCallback = onConfirm;
}

// Close modal handler
document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('modal-close-btn');
    const modal = document.getElementById('game-over-modal');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
    }
    
    // Close modal when clicking outside
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });
    
    // Resign modal handlers
    const resignModal = document.getElementById('resign-modal');
    const resignConfirmBtn = document.getElementById('resign-confirm-btn');
    const resignCancelBtn = document.getElementById('resign-cancel-btn');
    
    if (resignConfirmBtn) {
        resignConfirmBtn.addEventListener('click', () => {
            resignModal.classList.add('hidden');
            if (window.resignCallback) {
                window.resignCallback();
                window.resignCallback = null;
            }
        });
    }
    
    if (resignCancelBtn) {
        resignCancelBtn.addEventListener('click', () => {
            resignModal.classList.add('hidden');
            window.resignCallback = null;
        });
    }
    
    // Close resign modal when clicking outside
    resignModal?.addEventListener('click', (e) => {
        if (e.target === resignModal) {
            resignModal.classList.add('hidden');
            window.resignCallback = null;
        }
    });
});
