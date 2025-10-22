// Bingo Game JavaScript
class BingoGame {
    constructor() {
        this.cardSize = 5;
        this.minNumber = 1;
        this.maxNumber = 99;
        this.card = [];
        this.calledNumbers = [];
        this.markedCells = new Set();
        this.bingoLines = [];
        this.gameActive = false;
        this.autoCallInterval = null;
        
        this.initializeElements();
        this.bindEvents();
        this.loadSettings();
        this.generateNewCard();
    }

    initializeElements() {
        this.newGameBtn = document.getElementById('new-game-btn');
        this.callNumberBtn = document.getElementById('call-number-btn');
        this.autoCallBtn = document.getElementById('auto-call-btn');
        this.calledNumberDisplay = document.getElementById('called-number');
        this.calledCountDisplay = document.getElementById('called-count');
        this.bingoCountDisplay = document.getElementById('bingo-count');
        this.bingoCard = document.getElementById('bingo-card');
        this.gameOverModal = document.getElementById('game-over-modal');
        this.playAgainBtn = document.getElementById('play-again-btn');
        this.finalBingoCount = document.getElementById('final-bingo-count');
        this.minNumberInput = document.getElementById('min-number');
        this.maxNumberInput = document.getElementById('max-number');
    }

    bindEvents() {
        this.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.callNumberBtn.addEventListener('click', () => this.callNumber());
        this.autoCallBtn.addEventListener('click', () => this.toggleAutoCall());
        this.playAgainBtn.addEventListener('click', () => this.startNewGame());
        
        // Settings events
        this.minNumberInput.addEventListener('input', () => this.updateCardOnSettingsChange());
        this.maxNumberInput.addEventListener('input', () => this.updateCardOnSettingsChange());
        
        // Close modal when clicking outside
        this.gameOverModal.addEventListener('click', (e) => {
            if (e.target === this.gameOverModal) {
                this.hideGameOverModal();
            }
        });
    }

    updateCardOnSettingsChange() {
        // Validate settings first
        this.validateSettings();
        
        // Update card if game is not active or if game has ended
        if (!this.gameActive) {
            this.generateNewCard();
        }
    }

    loadSettings() {
        this.minNumber = parseInt(this.minNumberInput.value) || 1;
        this.maxNumber = parseInt(this.maxNumberInput.value) || 99;
        this.validateSettings();
    }

    validateSettings() {
        let minVal = parseInt(this.minNumberInput.value) || 1;
        let maxVal = parseInt(this.maxNumberInput.value) || 99;
        
        // Ensure min is at least 1
        if (minVal < 1) {
            minVal = 1;
            this.minNumberInput.value = 1;
        }
        
        // Ensure max is at most 99
        if (maxVal > 99) {
            maxVal = 99;
            this.maxNumberInput.value = 99;
        }
        
        // Ensure min < max
        if (minVal >= maxVal) {
            maxVal = minVal + 1;
            if (maxVal > 99) {
                maxVal = 99;
                minVal = 98;
                this.minNumberInput.value = 98;
            }
            this.maxNumberInput.value = maxVal;
        }
        
        // Ensure we have at least 25 numbers
        if (maxVal - minVal + 1 < 25) {
            maxVal = minVal + 24;
            if (maxVal > 99) {
                maxVal = 99;
                minVal = 75;
                this.minNumberInput.value = 75;
            }
            this.maxNumberInput.value = maxVal;
        }
        
        this.minNumber = minVal;
        this.maxNumber = maxVal;
    }

    generateNewCard() {
        this.card = [];
        this.markedCells.clear();
        this.bingoLines = [];
        
        // Generate 25 unique numbers from min to max
        const availableNumbers = Array.from({length: this.maxNumber - this.minNumber + 1}, (_, i) => i + this.minNumber);
        const shuffledNumbers = this.shuffleArray([...availableNumbers]);
        const cardNumbers = shuffledNumbers.slice(0, 25); // 25 numbers, no free space
        
        // Create 5x5 grid
        for (let row = 0; row < this.cardSize; row++) {
            this.card[row] = [];
            for (let col = 0; col < this.cardSize; col++) {
                this.card[row][col] = cardNumbers.pop();
            }
        }
        
        this.renderCard();
    }

    renderCard() {
        this.bingoCard.innerHTML = '';
        
        for (let row = 0; row < this.cardSize; row++) {
            for (let col = 0; col < this.cardSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'bingo-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                cell.textContent = this.card[row][col];
                
                // Check if this cell is part of a bingo line
                if (this.isCellInBingoLine(row, col)) {
                    cell.classList.add('bingo-line');
                }
                
                // Only add click listener if cell is not already marked
                const cellKey = `${row}-${col}`;
                if (!this.markedCells.has(cellKey)) {
                    cell.addEventListener('click', () => this.markCell(row, col));
                } else {
                    cell.classList.add('marked');
                }
                
                this.bingoCard.appendChild(cell);
            }
        }
    }

    startNewGame() {
        this.gameActive = true;
        this.calledNumbers = [];
        this.markedCells.clear();
        this.bingoLines = [];
        
        // Reset displays
        this.calledNumberDisplay.textContent = '--';
        this.calledCountDisplay.textContent = '0';
        this.bingoCountDisplay.textContent = '0';
        
        // Reset buttons
        this.callNumberBtn.disabled = false;
        this.autoCallBtn.textContent = 'Tự động gọi';
        this.autoCallBtn.classList.remove('active');
        
        // Stop auto call if running
        if (this.autoCallInterval) {
            clearInterval(this.autoCallInterval);
            this.autoCallInterval = null;
        }
        
        // Hide modal
        this.hideGameOverModal();
        
        // Generate new card with current settings
        this.generateNewCard();
    }

    callNumber() {
        if (!this.gameActive) return;
        
        // Get available numbers (not yet called)
        const availableNumbers = Array.from({length: this.maxNumber - this.minNumber + 1}, (_, i) => i + this.minNumber)
            .filter(num => !this.calledNumbers.includes(num));
        
        if (availableNumbers.length === 0) {
            this.endGame();
            return;
        }
        
        // Pick random number
        const randomIndex = Math.floor(Math.random() * availableNumbers.length);
        const calledNumber = availableNumbers[randomIndex];
        
        // Add to called numbers
        this.calledNumbers.push(calledNumber);
        
        // Update display
        this.calledNumberDisplay.textContent = calledNumber;
        this.calledCountDisplay.textContent = this.calledNumbers.length;
        
        // Check for bingo
        this.checkForBingo();
        
        // Animate called number
        this.animateCalledNumber();
    }


    markCell(row, col) {
        if (!this.gameActive) return;
        
        const cellKey = `${row}-${col}`;
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        
        // Only allow marking if not already marked
        if (!this.markedCells.has(cellKey)) {
            // Mark cell
            this.markedCells.add(cellKey);
            cell.classList.add('marked');
            
            // Remove click event listener to prevent further clicks
            const newCell = cell.cloneNode(true);
            cell.parentNode.replaceChild(newCell, cell);
            
            // Check for bingo after marking
            this.checkForBingo();
        }
    }

    checkForBingo() {
        const newBingoLines = this.findBingoLines();
        
        if (newBingoLines.length > this.bingoLines.length) {
            // New bingo lines found
            const newLines = newBingoLines.slice(this.bingoLines.length);
            this.bingoLines = newBingoLines;
            
            // Update display
            this.bingoCountDisplay.textContent = this.bingoLines.length;
            this.renderCard(); // Re-render to show bingo lines
            
            // Show celebration
            this.celebrateBingo();
            
            // Check if player has won (5 bingo lines)
            if (this.bingoLines.length >= 5) {
                setTimeout(() => this.endGame(), 300);
            }
        }
    }

    findBingoLines() {
        const lines = [];
        
        // Check rows
        for (let row = 0; row < this.cardSize; row++) {
            if (this.isRowComplete(row)) {
                lines.push({type: 'row', index: row});
            }
        }
        
        // Check columns
        for (let col = 0; col < this.cardSize; col++) {
            if (this.isColumnComplete(col)) {
                lines.push({type: 'column', index: col});
            }
        }
        
        // Check diagonals
        if (this.isDiagonalComplete(true)) {
            lines.push({type: 'diagonal', index: 0}); // Main diagonal
        }
        
        if (this.isDiagonalComplete(false)) {
            lines.push({type: 'diagonal', index: 1}); // Anti-diagonal
        }
        
        return lines;
    }

    isRowComplete(row) {
        for (let col = 0; col < this.cardSize; col++) {
            if (!this.markedCells.has(`${row}-${col}`)) {
                return false;
            }
        }
        return true;
    }

    isColumnComplete(col) {
        for (let row = 0; row < this.cardSize; row++) {
            if (!this.markedCells.has(`${row}-${col}`)) {
                return false;
            }
        }
        return true;
    }

    isDiagonalComplete(mainDiagonal) {
        for (let i = 0; i < this.cardSize; i++) {
            const row = i;
            const col = mainDiagonal ? i : this.cardSize - 1 - i;
            if (!this.markedCells.has(`${row}-${col}`)) {
                return false;
            }
        }
        return true;
    }

    isCellInBingoLine(row, col) {
        return this.bingoLines.some(line => {
            if (line.type === 'row') return line.index === row;
            if (line.type === 'column') return line.index === col;
            if (line.type === 'diagonal') {
                if (line.index === 0) return row === col; // Main diagonal
                if (line.index === 1) return row + col === this.cardSize - 1; // Anti-diagonal
            }
            return false;
        });
    }


    toggleAutoCall() {
        if (this.autoCallInterval) {
            // Stop auto call
            clearInterval(this.autoCallInterval);
            this.autoCallInterval = null;
            this.autoCallBtn.textContent = 'Tự động gọi';
            this.autoCallBtn.classList.remove('active');
        } else {
            // Start auto call
            this.autoCallBtn.textContent = 'Dừng tự động';
            this.autoCallBtn.classList.add('active');
            this.autoCallInterval = setInterval(() => {
                this.callNumber();
            }, 2000); // Call every 2 seconds
        }
    }

    endGame() {
        this.gameActive = false;
        this.callNumberBtn.disabled = true;
        
        // Stop auto call
        if (this.autoCallInterval) {
            clearInterval(this.autoCallInterval);
            this.autoCallInterval = null;
        }
        
        // Show game over modal
        this.finalBingoCount.textContent = this.bingoLines.length;
        this.showGameOverModal();
    }

    showGameOverModal() {
        this.gameOverModal.classList.add('show');
    }

    hideGameOverModal() {
        this.gameOverModal.classList.remove('show');
    }

    animateCalledNumber() {
        const calledNumber = this.calledNumberDisplay;
        calledNumber.style.animation = 'none';
        calledNumber.offsetHeight; // Trigger reflow
        calledNumber.style.animation = 'pulse 0.6s ease-in-out';
    }

    celebrateBingo() {
        // Add celebration effect to bingo lines
        const bingoCells = document.querySelectorAll('.bingo-line');
        bingoCells.forEach(cell => {
            cell.style.animation = 'bingo-glow 2s ease-in-out infinite alternate';
        });
    }


    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}

// Utility functions
function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new BingoGame();
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            if (game.gameActive && !game.callNumberBtn.disabled) {
                game.callNumber();
            }
        } else if (e.key === 'n' || e.key === 'N') {
            game.startNewGame();
        } else if (e.key === 'a' || e.key === 'A') {
            game.toggleAutoCall();
        } else if (e.key === 'Escape') {
            game.hideGameOverModal();
        }
    });
    
    // Add touch support for mobile
    let touchStartY = 0;
    document.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    });
    
    document.addEventListener('touchend', (e) => {
        const touchEndY = e.changedTouches[0].clientY;
        const diff = touchStartY - touchEndY;
        
        // Swipe up to call number
        if (diff > 50 && game.gameActive && !game.callNumberBtn.disabled) {
            game.callNumber();
        }
    });
    
    // Add service worker for offline support (optional)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            // Service worker registration failed, but that's okay
        });
    }
});

// Export for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BingoGame;
}
