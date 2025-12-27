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
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupAdminAccess();
                this.checkSiteStatus();
                this.addHiddenAdminButton();
            });
        } else {
            this.setupAdminAccess();
            this.checkSiteStatus();
            this.addHiddenAdminButton();
        }
    }
    
    addAdminHTML() {
        // Создаем HTML для админ-панели
        const adminHTML = `
            <div class="admin-overlay" id="adminOverlay">
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
                </div>
            </div>
            
            <div class="site-suspended" id="siteSuspended">
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
        
        // Добавляем стили
        const adminStyles = `
            <style>
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
        
        // Добавляем в body
        document.body.insertAdjacentHTML('beforeend', adminHTML);
        document.head.insertAdjacentHTML('beforeend', adminStyles);
    }
    
    setupAdminAccess() {
        // Способ 1: URL параметр
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('admin') === 'true') {
            this.showAdminLogin();
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        
        // Способ 2: Двойной клик по логотипу
        const logo = document.querySelector('.logo');
        if (logo) {
            logo.addEventListener('dblclick', () => {
                this.showAdminLogin();
            });
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
                    if (document.getElementById('loginModal')) {
                        document.getElementById('loginModal').style.display = 'none';
                    }
                    this.showAdminLogin();
                    return false;
                }
            });
        }
        
        // Обработчики админ-панели
        document.getElementById('adminLoginBtn').addEventListener('click', () => {
            const password = document.getElementById('adminPassword').value;
            this.login(password);
        });
        
        document.getElementById('adminPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.login(document.getElementById('adminPassword').value);
            }
        });
        
        document.getElementById('suspendSiteBtn').addEventListener('click', () => {
            if (confirm('Приостановить работу сайта для всех пользователей?')) {
                this.suspendSite();
            }
        });
        
        document.getElementById('activateSiteBtn').addEventListener('click', () => {
            this.activateSite();
        });
        
        document.getElementById('disableWithdrawBtn').addEventListener('click', () => {
            if (confirm('Запретить вывод средств для всех пользователей?')) {
                this.toggleWithdraw();
            }
        });
        
        document.getElementById('enableWithdrawBtn').addEventListener('click', () => {
            if (confirm('Разрешить вывод средств для всех пользователей?')) {
                this.toggleWithdraw();
            }
        });
        
        document.getElementById('saveGameSettingsBtn').addEventListener('click', () => {
            this.updateGameSettings();
        });
        
        document.getElementById('refreshStatsBtn').addEventListener('click', () => {
            this.loadAdminStats();
            this.showNotification('Статистика обновлена', 'success');
        });
        
        document.getElementById('resetDemoBtn').addEventListener('click', () => {
            this.resetDemoData();
        });
        
        document.getElementById('logoutAdminBtn').addEventListener('click', () => {
            this.logout();
        });
        
        // Закрытие по клику вне
        document.getElementById('adminOverlay').addEventListener('click', (e) => {
            if (e.target === document.getElementById('adminOverlay')) {
                this.hideAdminPanel();
            }
        });
    }
    
    addHiddenAdminButton() {
        // Добавляем скрытую кнопку в футер
        const footer = document.querySelector('footer .container');
        if (footer) {
            const existingLink = document.querySelector('.admin-access-link');
            if (existingLink) return;
            
            const adminLink = document.createElement('p');
            adminLink.className = 'admin-access-link';
            adminLink.innerHTML = '<i class="fas fa-lock"></i> <span style="opacity: 0.3;">Админ доступ</span>';
            adminLink.style.cssText = `
                cursor: pointer;
                text-align: center;
                margin-top: 5px;
                font-size: 0.7rem;
                color: #666 !important;
                user-select: none;
                transition: all 0.3s;
            `;
            
            adminLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showAdminLogin();
            });
            
            adminLink.addEventListener('mouseenter', () => {
                adminLink.innerHTML = '<i class="fas fa-lock"></i> Админ доступ (кликните)';
                adminLink.style.color = '#ff6b00 !important';
                adminLink.style.opacity = '1';
            });
            
            adminLink.addEventListener('mouseleave', () => {
                adminLink.innerHTML = '<i class="fas fa-lock"></i> <span style="opacity: 0.3;">Админ доступ</span>';
                adminLink.style.color = '#666 !important';
                adminLink.style.opacity = '0.7';
            });
            
            footer.appendChild(adminLink);
        }
    }
    
    checkSiteStatus() {
        if (this.siteSuspended) {
            document.getElementById('siteSuspended').style.display = 'flex';
            document.getElementById('suspendedTime').textContent = this.suspendedTime;
        }
    }
    
    showAdminLogin() {
        if (document.getElementById('adminOverlay').style.display === 'flex') return;
        
        document.getElementById('adminOverlay').style.display = 'flex';
        document.getElementById('adminLoginForm').style.display = 'block';
        document.getElementById('adminPanel').style.display = 'none';
        document.getElementById('adminPassword').value = '';
        document.getElementById('adminPassword').focus();
    }
    
    hideAdminPanel() {
        document.getElementById('adminOverlay').style.display = 'none';
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
            input.style.animation = 'shake 0.5s';
            input.style.borderColor = '#ff0000';
            setTimeout(() => {
                input.style.animation = '';
                input.style.borderColor = '#ff0000';
            }, 500);
            
            this.showNotification('❌ Неверный пароль', 'error');
            return false;
        }
    }
    
    logout() {
        document.getElementById('adminLoginForm').style.display = 'block';
        document.getElementById('adminPanel').style.display = 'none';
        document.getElementById('adminPassword').value = '';
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
        // Используем существующую функцию showNotification или создаем свою
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
        } else {
            // Простая запасная реализация
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
                z-index: 10000;
                background: ${type === 'success' ? 'rgba(255, 107, 0, 0.9)' : 'rgba(255, 50, 0, 0.9)'};
                border: 2px solid ${type === 'success' ? 'rgba(255, 200, 0, 0.5)' : 'rgba(255, 100, 0, 0.5)'};
                text-align: center;
                font-size: 0.9rem;
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }
    }
}

// Инициализация админ-системы при загрузке
let adminSystem;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        adminSystem = new AdminSystem();
    });
} else {
    adminSystem = new AdminSystem();
}

// Интеграция с существующей UserSystem
if (typeof UserSystem !== 'undefined') {
    // Переопределяем метод register для учета настроек админа
    const originalRegister = UserSystem.prototype.register;
    UserSystem.prototype.register = function(username, email, password) {
        if (adminSystem && adminSystem.siteSuspended) {
            return { success: false, message: 'Регистрация временно приостановлена' };
        }
        
        const result = originalRegister.call(this, username, email, password);
        
        if (result.success) {
            // Устанавливаем баланс из настроек админа
            result.user.balance = adminSystem.newUserBalance;
            this.currentUser.balance = adminSystem.newUserBalance;
            this.users[this.currentUser.id].balance = adminSystem.newUserBalance;
            this.saveUsers();
            localStorage.setItem('donwin_current_user', JSON.stringify(this.currentUser));
            this.updateUI();
        }
        
        return result;
    };
}

// Интеграция с существующей GameSystem
if (typeof GameSystem !== 'undefined') {
    // Добавляем проверку статуса сайта
    const originalStartGame = GameSystem.prototype.startGame;
    GameSystem.prototype.startGame = function(gameType) {
        if (adminSystem && adminSystem.siteSuspended) {
            alert('Игры временно приостановлены администратором');
            return;
        }
        
        originalStartGame.call(this, gameType);
    };
    
    // Обновляем метод updateBalance для проверки вывода
    if (typeof userSystem !== 'undefined') {
        const originalUpdateBalance = userSystem.updateBalance;
        userSystem.updateBalance = function(amount) {
            if (amount < 0 && adminSystem && !adminSystem.withdrawEnabled) {
                alert('Вывод временно приостановлен администратором');
                return false;
            }
            return originalUpdateBalance.call(this, amount);
        };
    }
}

// Экспортируем для доступа из консоли
window.AdminSystem = AdminSystem;
window.adminSystem = adminSystem;
