// UI Helper Functions for Professional Chess Game

// Theme Management
const themes = {
    classic: {
        light: '#f0d9b5',
        dark: '#b58863',
        border: '#754c24'
    },
    modern: {
        light: '#e8edf9',
        dark: '#7b8fa3',
        border: '#4a5f7a'
    },
    wooden: {
        light: '#d4a574',
        dark: '#8b5a3c',
        border: '#5c3a21'
    },
    neon: {
        light: '#1a1a2e',
        dark: '#16213e',
        border: '#0f3460'
    }
};

let currentTheme = 'classic';

// Apply theme to board
function applyTheme(themeName) {
    if (!themes[themeName]) return;
    
    currentTheme = themeName;
    const theme = themes[themeName];
    
    document.documentElement.style.setProperty('--light-square', theme.light);
    document.documentElement.style.setProperty('--dark-square', theme.dark);
    document.documentElement.style.setProperty('--board-border', theme.border);
    
    localStorage.setItem('chessTheme', themeName);
}

// Load saved theme
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('chessTheme');
    if (savedTheme && themes[savedTheme]) {
        applyTheme(savedTheme);
    }
}

// Timer Management
class ChessTimer {
    constructor(initialTime = 600) { // 10 minutes default
        this.whiteTime = initialTime;
        this.blackTime = initialTime;
        this.currentTurn = 'w';
        this.isRunning = false;
        this.interval = null;
        
        this.whiteTimerElement = document.getElementById('white-timer');
        this.blackTimerElement = document.getElementById('black-timer');
    }
    
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        
        this.interval = setInterval(() => {
            if (this.currentTurn === 'w') {
                this.whiteTime--;
                if (this.whiteTime <= 0) {
                    this.whiteTime = 0;
                    this.stop();
                    this.onTimeOut('white');
                }
            } else {
                this.blackTime--;
                if (this.blackTime <= 0) {
                    this.blackTime = 0;
                    this.stop();
                    this.onTimeOut('black');
                }
            }
            
            this.updateDisplay();
        }, 1000);
    }
    
    stop() {
        this.isRunning = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
    
    switchTurn() {
        this.currentTurn = this.currentTurn === 'w' ? 'b' : 'w';
    }
    
    updateDisplay() {
        // Check if timer elements exist before updating
        if (this.whiteTimerElement) {
            this.whiteTimerElement.textContent = this.formatTime(this.whiteTime);
        }
        if (this.blackTimerElement) {
            this.blackTimerElement.textContent = this.formatTime(this.blackTime);
        }
        
        // Add warning class if time is low
        if (this.whiteTime <= 60 && this.whiteTimerElement) {
            this.whiteTimerElement.style.color = 'var(--accent-danger)';
        } else if (this.whiteTimerElement) {
            this.whiteTimerElement.style.color = 'var(--accent-primary)';
        }
        
        if (this.blackTime <= 60 && this.blackTimerElement) {
            this.blackTimerElement.style.color = 'var(--accent-danger)';
        } else if (this.blackTimerElement) {
            this.blackTimerElement.style.color = 'var(--accent-primary)';
        }
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    onTimeOut(color) {
        alert(`${color} ran out of time!`);
    }
    
    reset(initialTime = 600) {
        this.stop();
        this.whiteTime = initialTime;
        this.blackTime = initialTime;
        this.currentTurn = 'w';
        this.updateDisplay();
    }
}

// Initialize timer
const gameTimer = new ChessTimer(600); // 10 minutes

// Notification System
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'error' ? 'var(--accent-danger)' : 'var(--accent-primary)'};
        color: white;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Settings Panel (Future Enhancement)
function createSettingsPanel() {
    // This can be expanded in the future
    console.log('Settings panel placeholder');
}

// Game Statistics
class GameStats {
    constructor() {
        this.moves = 0;
        this.captures = 0;
        this.checks = 0;
    }
    
    incrementMoves() {
        this.moves++;
    }
    
    incrementCaptures() {
        this.captures++;
    }
    
    incrementChecks() {
        this.checks++;
    }
    
    reset() {
        this.moves = 0;
        this.captures = 0;
        this.checks = 0;
    }
    
    getStats() {
        return {
            moves: this.moves,
            captures: this.captures,
            checks: this.checks
        };
    }
}

const gameStats = new GameStats();

// Export functions for use in main game file
window.ChessUI = {
    applyTheme,
    loadSavedTheme,
    gameTimer,
    showNotification,
    gameStats,
    themes
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    loadSavedTheme();
    gameTimer.updateDisplay();
});
