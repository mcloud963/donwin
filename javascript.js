// Система пользователей
class UserSystem {
    constructor() {
        this.currentUser = null;
        this.users = JSON.parse(localStorage.getItem('donwin_users')) || {};
        this.loadCurrentUser();
    }
    
    loadCurrentUser() {
        const savedUser = localStorage.getItem('donwin_current_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.updateUI();
        }
    }
    
    register(username, email, password) {
        for (const id in this.users) {
            if (this.users[id].username === username) {
                return { success: false, message: 'Имя пользователя уже занято' };
            }
            if (this.users[id].email === email) {
                return { success: false, message: 'Email уже используется' };
            }
        }
        
        const userId = Date.now().toString();
        const newUser = {
            id: userId,
            username: username,
            email: email,
            password: this.simpleHash(password),
            balance: 1000,
            registered: new Date().toISOString(),
            gamesPlayed: 0,
            totalWins: 0,
            lastLogin: new Date().toISOString()
        };
        
        this.users[userId] = newUser;
        this.saveUsers();
        
        return this.login(username, password);
    }
    
    login(username, password) {
        for (const id in this.users) {
            const user = this.users[id];
            if ((user.username === username || user.email === username) && 
                user.password === this.simpleHash(password)) {
                
                this.currentUser = { ...user };
                this.currentUser.lastLogin = new Date().toISOString();
                this.users[id].lastLogin = this.currentUser.lastLogin;
                this.saveUsers();
                
                localStorage.setItem('donwin_current_user', JSON.stringify(this.currentUser));
                this.updateUI();
                
                return { 
                    success: true, 
                    user: {
                        username: this.currentUser.username,
                        balance: this.currentUser.balance
                    }
                };
            }
        }
        
        return { success: false, message: 'Неверное имя пользователя или пароль' };
    }
    
    logout() {
        this.currentUser = null;
        localStorage.removeItem('donwin_current_user');
        this.updateUI();
    }
    
    updateBalance(amount) {
        if (!this.currentUser) return false;
        
        this.currentUser.balance += amount;
        this.currentUser.balance = Math.max(0, this.currentUser.balance);
        
        this.users[this.currentUser.id].balance = this.currentUser.balance;
        
        if (amount > 0) {
            this.currentUser.totalWins += amount;
            this.users[this.currentUser.id].totalWins = this.currentUser.totalWins;
        }
        
        this.currentUser.gamesPlayed++;
        this.users[this.currentUser.id].gamesPlayed = this.currentUser.gamesPlayed;
        
        this.saveUsers();
        localStorage.setItem('donwin_current_user', JSON.stringify(this.currentUser));
        this.updateUI();
        
        return true;
    }
    
    simpleHash(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            hash = ((hash << 5) - hash) + password.charCodeAt(i);
            hash = hash & hash;
        }
        return hash.toString();
    }
    
    saveUsers() {
        localStorage.setItem('donwin_users', JSON.stringify(this.users));
    }
    
    updateUI() {
        const userPanel = document.getElementById('userPanel');
        const authButtons = document.getElementById('authButtons');
        const playButtons = document.querySelectorAll('.play-btn');
        
        if (this.currentUser) {
            userPanel.style.display = 'flex';
            authButtons.style.display = 'none';
            
            document.getElementById('displayUsername').textContent = this.currentUser.username;
            document.getElementById('displayBalance').textContent = this.currentUser.balance;
            
            playButtons.forEach(btn => {
                btn.disabled = false;
            });
        } else {
            userPanel.style.display = 'none';
            authButtons.style.display = 'flex';
            
            playButtons.forEach(btn => {
                btn.disabled = true;
            });
        }
    }
}

const userSystem = new UserSystem();

// Игровая система
class GameSystem {
    constructor() {
        this.currentGame = null;
        this.currentBet = 10;
        this.selectedMines = 3;
        this.gameState = {};
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.querySelectorAll('.play-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (!userSystem.currentUser) {
                    alert('Для игры необходимо войти в систему!');
                    document.getElementById('loginModal').style.display = 'flex';
                    return;
                }
                
                const gameType = e.target.closest('.play-btn').dataset.game;
                this.startGame(gameType);
            });
        });
    }
    
    startGame(gameType) {
        this.currentGame = gameType;
        this.currentBet = 10;
        
        const gameTitle = document.getElementById('gameTitle');
        const gameContainer = document.getElementById('gameContainer');
        
        const gameNames = {
            'mine': '🔥 ОГНЕННЫЕ МИНЫ',
            'rocket': '🚀 ОГНЕННАЯ РАКЕТА',
            'dice': '🎲 ОГНЕННЫЕ КОСТИ',
            'coin': '🪙 ЗОЛОТАЯ МОНЕТКА'
        };
        
        gameTitle.textContent = gameNames[gameType];
        
        switch(gameType) {
            case 'mine':
                this.loadMineGame(gameContainer);
                break;
            default:
                this.loadOtherGame(gameContainer, gameType);
        }
        
        document.getElementById('gameModal').style.display = 'flex';
    }
    
    loadMineGame(container) {
        const multipliers = {
            3: { base: 1.5, max: 50, risk: 'Низкий' },
            5: { base: 2.0, max: 100, risk: 'Средний' },
            7: { base: 2.5, max: 200, risk: 'Высокий' },
            10: { base: 3.0, max: 500, risk: 'Экстрим' },
            15: { base: 4.0, max: 1000, risk: 'Максимум' }
        };
        
        const currentMulti = multipliers[this.selectedMines];
        
        container.innerHTML = `
            <div class="game-stats-bar">
                <div class="stats-item">
                    <div class="stats-label">Баланс</div>
                    <div class="stats-value">${userSystem.currentUser.balance} ₽</div>
                </div>
                <div class="stats-item">
                    <div class="stats-label">Ставка</div>
                    <div class="stats-value" id="currentBet">${this.currentBet} ₽</div>
                </div>
            </div>
            
            <div style="margin: 15px 0;">
                <div style="color: #ffcc00; font-weight: 600; margin-bottom: 10px; text-align: center;">
                    <i class="fas fa-bomb"></i> Выбери количество мин:
                </div>
                <div class="mine-selector">
                    ${Object.entries(multipliers).map(([mines, data]) => `
                        <div class="mine-option ${parseInt(mines) === this.selectedMines ? 'active' : ''}" 
                             data-mines="${mines}">
                            <div class="mine-count">${mines}</div>
                            <div class="mine-risk">${data.risk}</div>
                            <div class="mine-multiplier">x${data.base}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="game-stats-bar">
                <div class="stats-item">
                    <div class="stats-label">Мин</div>
                    <div class="stats-value" id="selectedMinesCount">${this.selectedMines}</div>
                </div>
                <div class="stats-item">
                    <div class="stats-label">Множитель</div>
                    <div class="stats-value" id="mineMultiplier">1.0x</div>
                </div>
                <div class="stats-item">
                    <div class="stats-label">Макс</div>
                    <div class="stats-value">x${currentMulti.max}</div>
                </div>
                <div class="stats-item">
                    <div class="stats-label">Базовый</div>
                    <div class="stats-value">x${currentMulti.base}</div>
                </div>
            </div>
            
            <div class="bet-controls">
                <button class="bet-btn" id="betMinus">-10</button>
                <div class="bet-amount">${this.currentBet} ₽</div>
                <button class="bet-btn" id="betPlus">+10</button>
            </div>
            
            <div style="text-align: center; margin: 15px 0; color: #ff9500; font-size: 0.9rem;">
                <i class="fas fa-info-circle"></i> Больше мин = выше риск = больше выигрыш!
            </div>
            
            <div class="mine-grid" id="mineGrid">
                ${Array(25).fill().map((_, i) => 
                    `<div class="mine-cell" data-cell="${i}">?</div>`
                ).join('')}
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
                <button class="btn" id="cashOutBtn" style="background: linear-gradient(45deg, #33cc33, #006600); padding: 12px 25px; width: 48%; margin-right: 4%;">
                    <i class="fas fa-coins"></i> Забрать
                </button>
                <button class="btn" id="resetMineBtn" style="background: #666; padding: 12px 25px; width: 48%;">
                    <i class="fas fa-redo"></i> Заново
                </button>
            </div>
            
            <div id="mineResult" style="text-align: center; margin-top: 15px; font-size: 1.1rem;"></div>
        `;
        
        this.setupMineGame();
    }
    
    setupMineGame() {
        const multipliers = {
            3: { base: 1.5, max: 50 },
            5: { base: 2.0, max: 100 },
            7: { base: 2.5, max: 200 },
            10: { base: 3.0, max: 500 },
            15: { base: 4.0, max: 1000 }
        };
        
        document.querySelectorAll('.mine-option').forEach(option => {
            option.addEventListener('click', () => {
                const mines = parseInt(option.dataset.mines);
                this.selectedMines = mines;
                
                document.querySelectorAll('.mine-option').forEach(opt => {
                    opt.classList.remove('active');
                });
                option.classList.add('active');
                
                document.getElementById('selectedMinesCount').textContent = mines;
                const currentMulti = multipliers[mines];
                document.querySelector('.game-stats-bar .stats-item:nth-child(4) .stats-value').textContent = 
                    `x${currentMulti.base}`;
                document.querySelector('.game-stats-bar .stats-item:nth-child(3) .stats-value').textContent = 
                    `x${currentMulti.max}`;
            });
        });
        
        const cells = document.querySelectorAll('.mine-cell');
        const minePositions = new Set();
        
        while (minePositions.size < this.selectedMines) {
            minePositions.add(Math.floor(Math.random() * 25));
        }
        
        this.gameState = {
            minePositions: minePositions,
            multiplier: 1.0,
            gameActive: true,
            revealedCells: new Set(),
            canChangeBet: true,
            currentMultiplier: multipliers[this.selectedMines].base
        };
        
        const clickedCells = new Set();
        
        document.getElementById('betMinus').addEventListener('click', () => {
            if (!this.gameState.canChangeBet) return;
            this.changeBet(-10);
        });
        
        document.getElementById('betPlus').addEventListener('click', () => {
            if (!this.gameState.canChangeBet) return;
            this.changeBet(10);
        });
        
        cells.forEach(cell => {
            cell.addEventListener('click', () => {
                if (!this.gameState.gameActive) return;
                
                const cellIndex = parseInt(cell.dataset.cell);
                
                if (clickedCells.has(cellIndex)) {
                    return;
                }
                
                clickedCells.add(cellIndex);
                
                this.gameState.canChangeBet = false;
                document.getElementById('betMinus').disabled = true;
                document.getElementById('betPlus').disabled = true;
                
                if (this.gameState.minePositions.has(cellIndex)) {
                    cell.innerHTML = '<i class="fas fa-bomb"></i>';
                    cell.classList.add('mine');
                    this.gameState.gameActive = false;
                    
                    userSystem.updateBalance(-this.currentBet);
                    document.getElementById('mineResult').innerHTML = `
                        <div style="color: #ff3333;">
                            <i class="fas fa-fire"></i> ВЗРЫВ! Потеряно ${this.currentBet} ₽
                        </div>
                    `;
                    
                    this.gameState.minePositions.forEach(pos => {
                        const mineCell = document.querySelector(`.mine-cell[data-cell="${pos}"]`);
                        if (!mineCell.classList.contains('mine')) {
                            mineCell.innerHTML = '<i class="fas fa-bomb"></i>';
                            mineCell.classList.add('mine');
                        }
                    });
                } else {
                    this.gameState.revealedCells.add(cellIndex);
                    
                    cell.innerHTML = '<i class="fas fa-gem"></i>';
                    cell.classList.add('revealed');
                    
                    this.gameState.multiplier *= this.gameState.currentMultiplier;
                    document.getElementById('mineMultiplier').textContent = 
                        this.gameState.multiplier.toFixed(1) + 'x';
                    
                    const maxMultiplier = multipliers[this.selectedMines].max;
                    if (this.gameState.multiplier >= maxMultiplier) {
                        this.gameState.gameActive = false;
                        const winAmount = Math.floor(this.currentBet * maxMultiplier);
                        userSystem.updateBalance(winAmount);
                        
                        document.getElementById('mineResult').innerHTML = `
                            <div style="color: #33cc33; font-size: 1.3rem;">
                                <i class="fas fa-trophy"></i> ДЖЕКПОТ! ${winAmount} ₽
                            </div>
                        `;
                    }
                }
            });
        });
        
        document.getElementById('cashOutBtn').addEventListener('click', () => {
            if (this.gameState.gameActive && this.gameState.multiplier > 1.0) {
                const winAmount = Math.floor(this.currentBet * this.gameState.multiplier);
                userSystem.updateBalance(winAmount);
                this.gameState.gameActive = false;
                
                document.getElementById('mineResult').innerHTML = `
                    <div style="color: #33cc33; font-size: 1.3rem;">
                        <i class="fas fa-trophy"></i> Выигрыш ${winAmount} ₽
                    </div>
                `;
                
                this.gameState.minePositions.forEach(pos => {
                    const cell = document.querySelector(`.mine-cell[data-cell="${pos}"]`);
                    if (!cell.classList.contains('mine') && !cell.classList.contains('revealed')) {
                        cell.innerHTML = '<i class="fas fa-bomb"></i>';
                        cell.classList.add('mine');
                    }
                });
            } else if (this.gameState.multiplier <= 1.0) {
                alert('Сначала откройте несколько клеток!');
            }
        });
        
        document.getElementById('resetMineBtn').addEventListener('click', () => {
            this.loadMineGame(document.getElementById('gameContainer'));
        });
    }
    
    changeBet(amount) {
        const newBet = this.currentBet + amount;
        if (newBet >= 10 && newBet <= 10000 && newBet <= userSystem.currentUser.balance) {
            this.currentBet = newBet;
            const betElement = document.getElementById('currentBet');
            if (betElement) {
                betElement.textContent = this.currentBet + ' ₽';
            }
            
            document.querySelector('.bet-amount').textContent = this.currentBet + ' ₽';
        }
    }
    
    loadOtherGame(container, gameType) {
        const gameNames = {
            'rocket': 'Огненная Ракета',
            'dice': 'Огненные Кости',
            'coin': 'Золотая Монетка'
        };
        
        container.innerHTML = `
            <div style="text-align: center; padding: 30px 15px;">
                <h3 style="color: #ffcc00; margin-bottom: 20px;">🚀 ${gameNames[gameType]}</h3>
                <p style="color: #ff9500; margin-bottom: 25px;">
                    Игра в разработке. Скоро будет доступна!
                </p>
                <div style="background: rgba(255, 107, 0, 0.1); padding: 15px; border-radius: 10px; margin: 20px 0; border: 2px solid rgba(255, 107, 0, 0.3);">
                    <div style="color: #ffcc00; font-weight: 600;">Ваш баланс</div>
                    <div style="font-size: 1.8rem; color: #ffcc00; font-weight: 800;">${userSystem.currentUser.balance} ₽</div>
                </div>
                <button class="btn" onclick="closeModal('gameModal')" style="background: linear-gradient(45deg, #ff6b00, #ff9500); padding: 12px 30px; width: 100%;">
                    <i class="fas fa-arrow-left"></i> ВЕРНУТЬСЯ
                </button>
            </div>
        `;
    }
}

const gameSystem = new GameSystem();

// Обработчики модальных окон
document.getElementById('loginBtn').addEventListener('click', () => {
    document.getElementById('loginModal').style.display = 'flex';
});

document.getElementById('registerBtn').addEventListener('click', () => {
    document.getElementById('registerModal').style.display = 'flex';
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('Вы уверены, что хотите выйти?')) {
        userSystem.logout();
    }
});

// Форма входа
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    const result = userSystem.login(username, password);
    
    if (result.success) {
        document.getElementById('loginModal').style.display = 'none';
        document.getElementById('loginForm').reset();
        showNotification(`🔥 Добро пожаловать, ${result.user.username}!`, 'success');
    } else {
        showNotification(result.message, 'error');
    }
});

// Форма регистрации
document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    
    if (password !== confirmPassword) {
        showNotification('Пароли не совпадают', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Пароль должен содержать минимум 6 символов', 'error');
        return;
    }
    
    const result = userSystem.register(username, email, password);
    
    if (result.success) {
        document.getElementById('registerModal').style.display = 'none';
        document.getElementById('registerForm').reset();
        showNotification(`🔥 Регистрация успешна! Добро пожаловать, ${username}!`, 'success');
    } else {
        showNotification(result.message, 'error');
    }
});

// Переключение между формами
document.getElementById('showRegisterForm').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('registerModal').style.display = 'flex';
});

document.getElementById('showLoginForm').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('registerModal').style.display = 'none';
    document.getElementById('loginModal').style.display = 'flex';
});

// Закрытие модальных окон
document.getElementById('closeLoginModal').addEventListener('click', () => {
    document.getElementById('loginModal').style.display = 'none';
});

document.getElementById('closeRegisterModal').addEventListener('click', () => {
    document.getElementById('registerModal').style.display = 'none';
});

document.getElementById('closeGameModal').addEventListener('click', () => {
    document.getElementById('gameModal').style.display = 'none';
});

// Закрытие по клику вне окна
document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
});

// Глобальная функция закрытия модалок
window.closeModal = function(modalId) {
    document.getElementById(modalId).style.display = 'none';
};

// Уведомления
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 15px;
        left: 15px;
        padding: 15px;
        border-radius: 10px;
        color: white;
        font-weight: 600;
        z-index: 3000;
        animation: slideIn 0.3s ease;
        backdrop-filter: blur(10px);
        border: 2px solid;
        text-align: center;
        font-size: 0.9rem;
    `;
    
    if (type === 'success') {
        notification.style.background = 'rgba(255, 107, 0, 0.9)';
        notification.style.borderColor = 'rgba(255, 200, 0, 0.5)';
    } else if (type === 'error') {
        notification.style.background = 'rgba(255, 50, 0, 0.9)';
        notification.style.borderColor = 'rgba(255, 100, 0, 0.5)';
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Анимации
const styles = document.createElement('style');
styles.textContent = `
    @keyframes slideIn {
        from { transform: translateY(-100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateY(0); opacity: 1; }
        to { transform: translateY(-100%); opacity: 0; }
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes slideUp {
        from { transform: translateY(50px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
`;
document.head.appendChild(styles);

// ========== АДМИН СИСТЕМА ========== 

// Система администрирования для GitHub Pages
class AdminSystem {
    constructor() {
        this.adminPassword = "789456123";
        this.adminUsername = "admin";
        this.siteSuspended = localStorage.getItem('donwin_site_suspended') === 'true';
        this.withdrawEnabled = localStorage.getItem('donwin_withdraw_enabled') !== 'false';
        this.winChance = parseInt(localStorage.getItem('donwin_win_chance')) || 35;
        this.newUserBalance = parseInt(localStorage.getItem('donwin_new_user_balance')) || 1000;
        this.suspendedTime = localStorage.getItem('donwin_suspended_time') || '';
        
        this.initAdminSystem();
    }
    
    initAdminSystem() {
        // Добавляем HTML для админ-панели
        this.addAdminHTML();
        
        // Ждем загрузки DOM
        setTimeout(() => {
            this.setupAdminAccess();
            this.checkSiteStatus();
            this.addHiddenAdminButton();
        }, 100);
    }
    
    addAdminHTML() {
        // Проверяем, не добавлена ли уже админ-панель
        if (document.getElementById('adminOverlay')) {
            return;
        }
        
        // Создаем HTML для админ-панели
        const adminHTML = `
            <div class="admin-overlay" id="adminOverlay" style="display: none;">
                <div class="admin-login-form" id="adminLoginForm">
                    <h2><i class="fas fa-lock"></i> АДМИН ПАНЕЛЬ</h2>
                    <input type="password" class="admin-password-input" id="adminPassword" placeholder="Введите пароль администратора">
                    <button class="admin-login-btn" id="adminLoginBtn">
                        <i class="fas fa-sign-in-alt"></i> ВОЙТИ
                    </button>
                    <p style="color: #ff6666; margin-top: 15px; font-size: 0.9rem;">
                        <i class="fas fa-exclamation-triangle"></i> Пароль: 789456123
                    </p>
                </div>
                
                <div class="admin-panel" id="adminPanel" style="display: none;">
                    <div class="admin-header">
                        <h2><i class="fas fa-cogs"></i> ПАНЕЛЬ АДМИНИСТРАТОРА</h2>
                        <p style="color: #ccc; font-size: 0.9rem;">Управление платформой DONWIN</p>
                    </div>
                    
                    <div class="admin-section">
                        <h3><i class="fas fa-power-off"></i> Статус сайта</h3>
                        <div class="admin-controls">
                            <div class="admin-control">
                                <span class="admin-label">Статус сайта:</span>
                                <span id="siteStatus" style="color: #33cc33; font-weight: 700;">АКТИВЕН</span>
                            </div>
                            <button class="admin-btn admin-btn-danger" id="suspendSiteBtn">
                                <i class="fas fa-pause"></i> ПРИОСТАНОВИТЬ
                            </button>
                            <button class="admin-btn admin-btn-success" id="activateSiteBtn" style="display: none;">
                                <i class="fas fa-play"></i> АКТИВИРОВАТЬ
                            </button>
                            <div class="admin-status" id="siteStatusMessage"></div>
                        </div>
                    </div>
                    
                    <div class="admin-section">
                        <h3><i class="fas fa-sliders-h"></i> Настройки игр</h3>
                        <div class="admin-controls">
                            <div class="admin-control">
                                <span class="admin-label">Шанс выигрыша (%):</span>
                                <input type="number" class="admin-input" id="winChance" value="35" min="1" max="99">
                            </div>
                            <div class="admin-control">
                                <span class="admin-label">Баланс новых игроков:</span>
                                <input type="number" class="admin-input" id="newUserBalance" value="1000" min="100" max="10000">
                            </div>
                            <button class="admin-btn" id="saveGameSettingsBtn">
                                <i class="fas fa-save"></i> СОХРАНИТЬ
                            </button>
                            <div class="admin-status" id="gameSettingsMessage"></div>
                        </div>
                    </div>
                    
                    <div class="admin-section">
                        <h3><i class="fas fa-coins"></i> Управление финансами</h3>
                        <div class="admin-controls">
                            <div class="admin-control">
                                <span class="admin-label">Ввод/вывод:</span>
                                <span id="withdrawStatus" style="color: #33cc33; font-weight: 700;">РАЗРЕШЕН</span>
                            </div>
                            <button class="admin-btn admin-btn-danger" id="disableWithdrawBtn">
                                <i class="fas fa-ban"></i> ЗАПРЕТИТЬ ВЫВОД
                            </button>
                            <button class="admin-btn admin-btn-success" id="enableWithdrawBtn" style="display: none;">
                                <i class="fas fa-check"></i> РАЗРЕШИТЬ ВЫВОД
                            </button>
                            <div class="admin-status" id="withdrawStatusMessage"></div>
                        </div>
                    </div>
                    
                    <div class="admin-section">
                        <h3><i class="fas fa-chart-bar"></i> Статистика</h3>
                        <div class="admin-controls">
                            <div class="admin-control">
                                <span class="admin-label">Всего игроков:</span>
                                <span id="totalUsersStat">0</span>
                            </div>
                            <div class="admin-control">
                                <span class="admin-label">Онлайн сейчас:</span>
                                <span id="onlineUsersStat">0</span>
                            </div>
                            <div class="admin-control">
                                <span class="admin-label">Общий баланс:</span>
                                <span id="totalBalanceStat">0 ₽</span>
                            </div>
                            <button class="admin-btn" id="refreshStatsBtn">
                                <i class="fas fa-sync-alt"></i> ОБНОВИТЬ
                            </button>
                        </div>
                    </div>
                    
                    <div class="admin-section">
                        <h3><i class="fas fa-wrench"></i> Действия</h3>
                        <div class="admin-controls">
                            <button class="admin-btn" id="resetDemoBtn">
                                <i class="fas fa-redo"></i> СБРОС ДЕМО-ДАННЫХ
                            </button>
                            <button class="admin-btn admin-btn-danger" id="logoutAdminBtn">
                                <i class="fas fa-sign-out-alt"></i> ВЫЙТИ ИЗ АДМИНКИ
                            </button>
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin-top: 20px; color: #ff6666; font-size: 0.8rem;">
                        <i class="fas fa-exclamation-triangle"></i> Изменения применяются мгновенно
                    </div>
                </div>
            </div>
            
            <div class="site-suspended" id="siteSuspended" style="display: none;">
                <div class="suspended-content">
                    <h1><i class="fas fa-exclamation-triangle"></i> САЙТ ПРИОСТАНОВЛЕН</h1>
                    <p>Платформа DONWIN временно недоступна по техническим причинам.</p>
                    <p style="color: #ff9500; font-size: 1rem;">
                        Приносим извинения за неудобства. Мы уже работаем над решением проблемы.
                    </p>
                    <div style="margin-top: 30px; padding: 15px; background: rgba(255, 0, 0, 0.1); border-radius: 8px;">
                        <p style="color: #ffcc00;">
                            <i class="fas fa-clock"></i> 
                            Время приостановки: <span id="suspendedTime">--:--</span>
                        </p>
                    </div>
                </div>
            </div>
        `;
        
        // Добавляем стили только если их еще нет
        if (!document.querySelector('#admin-styles')) {
            const adminStyles = `
                <style id="admin-styles">
                    .admin-overlay {
                        display: none;
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.98);
                        z-index: 9999;
                        align-items: center;
                        justify-content: center;
                        padding: 20px;
                    }
                    
                    .admin-panel, .admin-login-form {
                        background: linear-gradient(135deg, #1a0f0f, #0a0a0a);
                        width: 100%;
                        max-width: 600px;
                        border-radius: 15px;
                        padding: 30px;
                        border: 3px solid #ff0000;
                        box-shadow: 0 0 30px rgba(255, 0, 0, 0.5);
                        max-height: 90vh;
                        overflow-y: auto;
                    }
                    
                    .admin-login-form {
                        max-width: 400px;
                        text-align: center;
                    }
                    
                    .admin-header {
                        text-align: center;
                        margin-bottom: 25px;
                        border-bottom: 2px solid #ff0000;
                        padding-bottom: 15px;
                    }
                    
                    .admin-header h2 {
                        background: linear-gradient(to right, #ff0000, #ff6b00);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        font-size: 1.8rem;
                        font-weight: 800;
                    }
                    
                    .admin-section {
                        margin-bottom: 25px;
                        background: rgba(255, 0, 0, 0.1);
                        padding: 20px;
                        border-radius: 10px;
                        border: 2px solid rgba(255, 0, 0, 0.3);
                    }
                    
                    .admin-section h3 {
                        color: #ff6b00;
                        margin-bottom: 15px;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }
                    
                    .admin-controls {
                        display: grid;
                        grid-template-columns: 1fr;
                        gap: 15px;
                    }
                    
                    .admin-control {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 12px;
                        background: rgba(0, 0, 0, 0.5);
                        border-radius: 8px;
                        border: 2px solid rgba(255, 0, 0, 0.2);
                    }
                    
                    .admin-label {
                        color: #ffcc00;
                        font-weight: 600;
                        font-size: 1rem;
                    }
                    
                    .admin-input {
                        background: rgba(255, 255, 255, 0.1);
                        border: 2px solid #ff6b00;
                        border-radius: 8px;
                        padding: 8px 12px;
                        color: white;
                        width: 120px;
                        text-align: center;
                    }
                    
                    .admin-btn {
                        padding: 10px 20px;
                        background: linear-gradient(45deg, #ff0000, #ff6b00);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 600;
                        transition: all 0.3s;
                        font-size: 0.9rem;
                    }
                    
                    .admin-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 5px 15px rgba(255, 0, 0, 0.3);
                    }
                    
                    .admin-btn-danger {
                        background: linear-gradient(45deg, #ff0000, #cc0000);
                    }
                    
                    .admin-btn-success {
                        background: linear-gradient(45deg, #00cc00, #009900);
                    }
                    
                    .admin-status {
                        text-align: center;
                        margin-top: 10px;
                        font-size: 0.9rem;
                        padding: 8px;
                        border-radius: 5px;
                        display: none;
                    }
                    
                    .status-success {
                        background: rgba(0, 255, 0, 0.1);
                        color: #33cc33;
                        border: 1px solid #33cc33;
                        display: block;
                    }
                    
                    .status-error {
                        background: rgba(255, 0, 0, 0.1);
                        color: #ff3333;
                        border: 1px solid #ff3333;
                        display: block;
                    }
                    
                    .site-suspended {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.95);
                        z-index: 9998;
                        display: none;
                        align-items: center;
                        justify-content: center;
                        text-align: center;
                        padding: 20px;
                    }
                    
                    .suspended-content {
                        background: linear-gradient(135deg, #1a0f0f, #0a0a0a);
                        padding: 40px;
                        border-radius: 15px;
                        border: 3px solid #ff0000;
                        max-width: 500px;
                        width: 100%;
                    }
                    
                    .suspended-content h1 {
                        color: #ff0000;
                        font-size: 2rem;
                        margin-bottom: 20px;
                    }
                    
                    .admin-password-input {
                        width: 100%;
                        padding: 15px;
                        background: rgba(255, 255, 255, 0.1);
                        border: 2px solid #ff0000;
                        border-radius: 8px;
                        color: white;
                        font-size: 1.1rem;
                        margin-bottom: 20px;
                        text-align: center;
                        letter-spacing: 3px;
                    }
                    
                    .admin-login-btn {
                        width: 100%;
                        padding: 15px;
                        background: linear-gradient(45deg, #ff0000, #ff6b00);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 1.1rem;
                        font-weight: 700;
                        cursor: pointer;
                        transition: all 0.3s;
                    }
                    
                    @keyframes shake {
                        0%, 100% { transform: translateX(0); }
                        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                        20%, 40%, 60%, 80% { transform: translateX(5px); }
                    }
                    
                    @media (max-width: 768px) {
                        .admin-panel, .admin-login-form {
                            padding: 20px;
                            max-height: 85vh;
                        }
                    }
                </style>
            `;
            
            document.head.insertAdjacentHTML('beforeend', adminStyles);
        }
        
        // Добавляем в body
        document.body.insertAdjacentHTML('beforeend', adminHTML);
    }
    
    setupAdminAccess() {
        // Способ 1: URL параметр (только если явно указан)
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('admin') === 'true') {
            setTimeout(() => {
                this.showAdminLogin();
                // Очищаем URL чтобы не светить
                window.history.replaceState({}, document.title, window.location.pathname);
            }, 500);
        }
        
        // Способ 2: Двойной клик по логотипу
        const logo = document.querySelector('.logo');
        if (logo) {
            logo.addEventListener('dblclick', (e) => {
                e.preventDefault();
                this.showAdminLogin();
            });
            
            // Добавляем title для подсказки
            logo.title = "Двойной клик для админки";
        }
        
        // Способ 3: Специальный вход через обычную форму
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            const originalSubmit = loginForm.onsubmit;
            loginForm.addEventListener('submit', (e) => {
                const username = document.getElementById('loginUsername')?.value;
                const password = document.getElementById('loginPassword')?.value;
                
                if (username === this.adminUsername && password === this.adminPassword) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const loginModal = document.getElementById('loginModal');
                    if (loginModal) {
                        loginModal.style.display = 'none';
                    }
                    
                    if (document.getElementById('loginForm')) {
                        document.getElementById('loginForm').reset();
                    }
                    
                    this.showAdminLogin();
                    return false;
                }
            });
        }
        
        // Инициализируем обработчики админ-панели
        setTimeout(() => {
            this.initAdminHandlers();
        }, 200);
    }
    
    initAdminHandlers() {
        // Обработчик кнопки входа
        const loginBtn = document.getElementById('adminLoginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                const password = document.getElementById('adminPassword').value;
                this.login(password);
            });
        }
        
        // Enter в поле пароля
        const passwordInput = document.getElementById('adminPassword');
        if (passwordInput) {
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.login(passwordInput.value);
                }
            });
        }
        
        // Обработчики для остальных кнопок
        document.getElementById('suspendSiteBtn')?.addEventListener('click', () => {
            if (confirm('Приостановить работу сайта для всех пользователей?')) {
                this.suspendSite();
            }
        });
        
        document.getElementById('activateSiteBtn')?.addEventListener('click', () => {
            this.activateSite();
        });
        
        document.getElementById('disableWithdrawBtn')?.addEventListener('click', () => {
            if (confirm('Запретить вывод средств для всех пользователей?')) {
                this.toggleWithdraw();
            }
        });
        
        document.getElementById('enableWithdrawBtn')?.addEventListener('click', () => {
            if (confirm('Разрешить вывод средств для всех пользователей?')) {
                this.toggleWithdraw();
            }
        });
        
        document.getElementById('saveGameSettingsBtn')?.addEventListener('click', () => {
            this.updateGameSettings();
        });
        
        document.getElementById('refreshStatsBtn')?.addEventListener('click', () => {
            this.loadAdminStats();
            this.showNotification('Статистика обновлена', 'success');
        });
        
        document.getElementById('resetDemoBtn')?.addEventListener('click', () => {
            this.resetDemoData();
        });
        
        document.getElementById('logoutAdminBtn')?.addEventListener('click', () => {
            this.logout();
        });
        
        // Закрытие по клику вне
        const overlay = document.getElementById('adminOverlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.hideAdminPanel();
                }
            });
        }
    }
    
    addHiddenAdminButton() {
        // Добавляем скрытую кнопку в футер
        setTimeout(() => {
            const footer = document.querySelector('footer .container');
            if (footer && !document.querySelector('.admin-access-link')) {
                const adminLink = document.createElement('p');
                adminLink.className = 'admin-access-link';
                adminLink.innerHTML = '<i class="fas fa-lock"></i> <span style="opacity: 0.3; font-size: 0.6rem;">admin</span>';
                adminLink.style.cssText = `
                    cursor: pointer;
                    text-align: center;
                    margin-top: 5px;
                    margin-bottom: 5px;
                    font-size: 0.7rem;
                    color: #666 !important;
                    user-select: none;
                    transition: all 0.3s;
                    padding: 3px;
                    border-radius: 3px;
                `;
                
                adminLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showAdminLogin();
                });
                
                // Делаем видимым при наведении
                adminLink.addEventListener('mouseenter', () => {
                    adminLink.innerHTML = '<i class="fas fa-lock"></i> Админ панель (кликните)';
                    adminLink.style.color = '#ff6b00 !important';
                    adminLink.style.opacity = '1';
                    adminLink.style.background = 'rgba(255, 107, 0, 0.1)';
                    adminLink.style.border = '1px solid rgba(255, 107, 0, 0.3)';
                });
                
                adminLink.addEventListener('mouseleave', () => {
                    adminLink.innerHTML = '<i class="fas fa-lock"></i> <span style="opacity: 0.3; font-size: 0.6rem;">admin</span>';
                    adminLink.style.color = '#666 !important';
                    adminLink.style.opacity = '0.7';
                    adminLink.style.background = 'transparent';
                    adminLink.style.border = 'none';
                });
                
                footer.appendChild(adminLink);
            }
        }, 300);
    }
    
    checkSiteStatus() {
        if (this.siteSuspended) {
            setTimeout(() => {
                const suspendedElement = document.getElementById('siteSuspended');
                if (suspendedElement) {
                    suspendedElement.style.display = 'flex';
                    const timeElement = document.getElementById('suspendedTime');
                    if (timeElement) {
                        timeElement.textContent = this.suspendedTime;
                    }
                }
            }, 100);
        }
    }
    
    showAdminLogin() {
        const overlay = document.getElementById('adminOverlay');
        if (!overlay || overlay.style.display === 'flex') return;
        
        overlay.style.display = 'flex';
        document.getElementById('adminLoginForm').style.display = 'block';
        document.getElementById('adminPanel').style.display = 'none';
        
        const passwordInput = document.getElementById('adminPassword');
        if (passwordInput) {
            passwordInput.value = '';
            setTimeout(() => passwordInput.focus(), 100);
        }
    }
    
    hideAdminPanel() {
        const overlay = document.getElementById('adminOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }
    
    login(password) {
        if (password === this.adminPassword) {
            document.getElementById('adminLoginForm').style.display = 'none';
            document.getElementById('adminPanel').style.display = 'block';
            
            this.loadAdminStats();
            this.showNotification('🔥 Админ-панель открыта', 'success');
            return true;
        } else {
            // Анимация ошибки
            const input = document.getElementById('adminPassword');
            if (input) {
                input.style.animation = 'shake 0.5s';
                input.style.borderColor = '#ff0000';
                setTimeout(() => {
                    input.style.animation = '';
                    input.style.borderColor = '#ff0000';
                }, 500);
            }
            
            this.showNotification('❌ Неверный пароль', 'error');
            return false;
        }
    }
    
    logout() {
        document.getElementById('adminLoginForm').style.display = 'block';
        document.getElementById('adminPanel').style.display = 'none';
        
        const passwordInput = document.getElementById('adminPassword');
        if (passwordInput) passwordInput.value = '';
        
        this.showNotification('👋 Выход из админ-панели', 'info');
    }
    
    suspendSite() {
        this.siteSuspended = true;
        this.suspendedTime = new Date().toLocaleString('ru-RU');
        localStorage.setItem('donwin_site_suspended', 'true');
        localStorage.setItem('donwin_suspended_time', this.suspendedTime);
        
        document.getElementById('siteSuspended').style.display = 'flex';
        document.getElementById('suspendedTime').textContent = this.suspendedTime;
        
        this.showStatusMessage('siteStatusMessage', 'Сайт приостановлен', 'success');
        
        document.getElementById('siteStatus').textContent = 'ПРИОСТАНОВЛЕН';
        document.getElementById('siteStatus').style.color = '#ff0000';
        document.getElementById('suspendSiteBtn').style.display = 'none';
        document.getElementById('activateSiteBtn').style.display = 'block';
    }
    
    activateSite() {
        this.siteSuspended = false;
        localStorage.setItem('donwin_site_suspended', 'false');
        document.getElementById('siteSuspended').style.display = 'none';
        
        this.showStatusMessage('siteStatusMessage', 'Сайт активирован', 'success');
        
        document.getElementById('siteStatus').textContent = 'АКТИВЕН';
        document.getElementById('siteStatus').style.color = '#33cc33';
        document.getElementById('suspendSiteBtn').style.display = 'block';
        document.getElementById('activateSiteBtn').style.display = 'none';
    }
    
    toggleWithdraw() {
        this.withdrawEnabled = !this.withdrawEnabled;
        localStorage.setItem('donwin_withdraw_enabled', this.withdrawEnabled.toString());
        
        const status = this.withdrawEnabled ? 'РАЗРЕШЕН' : 'ЗАПРЕЩЕН';
        const color = this.withdrawEnabled ? '#33cc33' : '#ff0000';
        
        document.getElementById('withdrawStatus').textContent = status;
        document.getElementById('withdrawStatus').style.color = color;
        document.getElementById('disableWithdrawBtn').style.display = this.withdrawEnabled ? 'block' : 'none';
        document.getElementById('enableWithdrawBtn').style.display = this.withdrawEnabled ? 'none' : 'block';
        
        this.showStatusMessage('withdrawStatusMessage', 
            `Ввод/вывод ${this.withdrawEnabled ? 'разрешен' : 'запрещен'}`, 'success');
    }
    
    updateGameSettings() {
        const winChance = parseInt(document.getElementById('winChance').value);
        const newUserBalance = parseInt(document.getElementById('newUserBalance').value);
        
        if (winChance >= 1 && winChance <= 99) {
            this.winChance = winChance;
            localStorage.setItem('donwin_win_chance', winChance.toString());
        }
        
        if (newUserBalance >= 100 && newUserBalance <= 10000) {
            this.newUserBalance = newUserBalance;
            localStorage.setItem('donwin_new_user_balance', newUserBalance.toString());
        }
        
        this.showStatusMessage('gameSettingsMessage', 'Настройки сохранены', 'success');
    }
    
    loadAdminStats() {
        const users = JSON.parse(localStorage.getItem('donwin_users')) || {};
        const totalUsers = Object.keys(users).length;
        let totalBalance = 0;
        
        Object.values(users).forEach(user => {
            totalBalance += user.balance || 0;
        });
        
        const onlineUsers = Math.floor(Math.random() * 100) + 50;
        
        document.getElementById('totalUsersStat').textContent = totalUsers;
        document.getElementById('onlineUsersStat').textContent = onlineUsers;
        document.getElementById('totalBalanceStat').textContent = totalBalance.toLocaleString() + ' ₽';
        
        document.getElementById('siteStatus').textContent = this.siteSuspended ? 'ПРИОСТАНОВЛЕН' : 'АКТИВЕН';
        document.getElementById('siteStatus').style.color = this.siteSuspended ? '#ff0000' : '#33cc33';
        document.getElementById('suspendSiteBtn').style.display = this.siteSuspended ? 'none' : 'block';
        document.getElementById('activateSiteBtn').style.display = this.siteSuspended ? 'block' : 'none';
        
        document.getElementById('withdrawStatus').textContent = this.withdrawEnabled ? 'РАЗРЕШЕН' : 'ЗАПРЕЩЕН';
        document.getElementById('withdrawStatus').style.color = this.withdrawEnabled ? '#33cc33' : '#ff0000';
        document.getElementById('disableWithdrawBtn').style.display = this.withdrawEnabled ? 'block' : 'none';
        document.getElementById('enableWithdrawBtn').style.display = this.withdrawEnabled ? 'none' : 'block';
        
        document.getElementById('winChance').value = this.winChance;
        document.getElementById('newUserBalance').value = this.newUserBalance;
    }
    
    resetDemoData() {
        if (confirm('Вы уверены? Все демо-данные будут сброшены.')) {
            localStorage.removeItem('donwin_users');
            localStorage.removeItem('donwin_current_user');
            window.location.reload();
        }
    }
    
    showStatusMessage(elementId, message, type) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = message;
            element.className = 'admin-status status-' + type;
            
            setTimeout(() => {
                element.className = 'admin-status';
            }, 3000);
        }
    }
    
    showNotification(message, type = 'info') {
        // Используем существующую функцию showNotification
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
        } else {
            // Запасная реализация
            alert(message);
        }
    }
}

// Инициализация админ-системы после загрузки страницы
setTimeout(() => {
    window.adminSystem = new AdminSystem();
    
    // Интеграция с UserSystem для проверки при регистрации
    if (window.userSystem && typeof window.userSystem.register === 'function') {
        const originalRegister = window.userSystem.register.bind(window.userSystem);
        
        window.userSystem.register = function(username, email, password) {
            if (window.adminSystem && window.adminSystem.siteSuspended) {
                return { success: false, message: 'Регистрация временно приостановлена' };
            }
            return originalRegister(username, email, password);
        };
    }
    
    // Интеграция с GameSystem для проверки при запуске игры
    const playButtons = document.querySelectorAll('.play-btn');
    playButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            if (window.adminSystem && window.adminSystem.siteSuspended) {
                e.preventDefault();
                alert('Игры временно приостановлены администратором');
                return false;
            }
        });
    });
    
    // Интеграция с функцией updateBalance для проверки вывода
    if (window.userSystem && typeof window.userSystem.updateBalance === 'function') {
        const originalUpdateBalance = window.userSystem.updateBalance.bind(window.userSystem);
        
        window.userSystem.updateBalance = function(amount) {
            if (amount < 0 && window.adminSystem && !window.adminSystem.withdrawEnabled) {
                alert('Вывод временно приостановлен администратором');
                return false;
            }
            return originalUpdateBalance(amount);
        };
    }
}, 1000);

// Демо-данные и адаптация
document.addEventListener('DOMContentLoaded', () => {
    // Создаем демо-пользователя
    if (Object.keys(userSystem.users).length === 0) {
        userSystem.register('demo', 'demo@donwin.com', 'demo123');
    }
    
    // Адаптивная статистика
    setInterval(() => {
        const onlineCount = document.getElementById('onlineCount');
        const todayWins = document.getElementById('todayWins');
        const maxWin = document.getElementById('maxWin');
        const totalPlayers = document.getElementById('totalPlayers');
        
        if (onlineCount) {
            const base = 5678;
            const variation = Math.floor(Math.random() * 100);
            onlineCount.textContent = (base + variation).toLocaleString();
        }
        
        if (todayWins) {
            const base = 1234567;
            const variation = Math.floor(Math.random() * 10000);
            const wins = base + variation;
            todayWins.textContent = wins > 1000000 ? 
                (wins / 1000000).toFixed(1) + 'M ₽' : 
                Math.floor(wins / 1000) + 'K ₽';
        }
        
        if (maxWin) {
            maxWin.textContent = '5M ₽';
        }
        
        if (totalPlayers) {
            totalPlayers.textContent = '50K+';
        }
    }, 5000);
    
    // Подсказка для демо-входа
    setTimeout(() => {
        if (!userSystem.currentUser) {
            console.log('🔥 Демо-доступ:');
            console.log('👤 Логин: demo');
            console.log('🔑 Пароль: demo123');
            console.log('🔐 Админ пароль: 789456123');
        }
    }, 2000);
    
    // Адаптация для сенсорных устройств
    if ('ontouchstart' in window) {
        document.body.classList.add('touch-device');
        
        document.querySelectorAll('.btn, .mine-cell, .mine-option').forEach(el => {
            el.style.touchAction = 'manipulation';
        });
    }
});
