// Main Application Entry Point
let game = null;
let authManager = null;

const screens = {
    auth: document.getElementById('authScreen'),
    menu: document.getElementById('mainMenu'),
    levels: document.getElementById('levelSelect'),
    shop: document.getElementById('skinShop'),
    leaderboard: document.getElementById('leaderboardScreen'),
};

async function init() {
    authManager = new AuthManager();
    await authManager.init();
    
    const canvas = document.getElementById('gameCanvas');
    game = new Game(canvas);
    
    setupEventListeners();
    
    if (authManager.isAuthenticated()) {
        showScreen('menu');
        updateMenuUI();
    } else {
        showScreen('auth');
    }
}

function showScreen(screenName) {
    Object.values(screens).forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });
    
    const screen = screens[screenName];
    if (screen) {
        screen.style.display = 'flex';
        setTimeout(() => screen.classList.add('active'), 10);
    }
    
    document.getElementById('gameOver').style.display = 'none';
}

function updateMenuUI() {
    if (authManager.user) {
        document.getElementById('playerEmail').textContent = authManager.user.email;
        document.getElementById('coinDisplay').textContent = '💰 ' + authManager.totalCoins;
    }
}

function setupEventListeners() {
    document.getElementById('showRegister').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
        document.getElementById('authError').textContent = '';
    });
    
    document.getElementById('showLogin').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('registerForm').style.display = 'none';
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('authError').textContent = '';
    });
    
    document.getElementById('btnLogin').addEventListener('click', async () => {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        if (!email || !password) {
            document.getElementById('authError').textContent = 'Veuillez remplir tous les champs';
            return;
        }
        
        const result = await authManager.signIn(email, password);
        if (result.success) {
            showScreen('menu');
            updateMenuUI();
        } else {
            document.getElementById('authError').textContent = result.message;
        }
    });
    
    document.getElementById('btnRegister').addEventListener('click', async () => {
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        
        if (!email || !password) {
            document.getElementById('authError').textContent = 'Veuillez remplir tous les champs';
            return;
        }
        
        if (password.length < 6) {
            document.getElementById('authError').textContent = 'Le mot de passe doit faire au moins 6 caractères';
            return;
        }
        
        const result = await authManager.signUp(email, password);
        if (result.success) {
            document.getElementById('authError').textContent = result.message;
            document.getElementById('authError').style.color = '#00ffcc';
            setTimeout(() => {
                document.getElementById('registerForm').style.display = 'none';
                document.getElementById('loginForm').style.display = 'block';
                document.getElementById('authError').textContent = '';
                document.getElementById('authError').style.color = '#ff4444';
            }, 2000);
        } else {
            document.getElementById('authError').textContent = result.message;
        }
    });
    
    document.getElementById('btnPlay').addEventListener('click', () => {
        showScreen('levels');
    });
    
    document.getElementById('btnSkins').addEventListener('click', () => {
        renderSkinShop();
        showScreen('shop');
    });
    
    document.getElementById('btnLeaderboard').addEventListener('click', async () => {
        await renderLeaderboard();
        showScreen('leaderboard');
    });
    
    document.getElementById('btnLogout').addEventListener('click', async () => {
        await authManager.signOut();
        showScreen('auth');
    });
    
    document.querySelectorAll('.level-card').forEach(card => {
        card.addEventListener('click', () => {
            const level = card.dataset.level;
            game.start(level, authManager.equippedSkin);
            showScreen('');
        });
    });
    
    document.getElementById('btnBackFromLevels').addEventListener('click', () => {
        showScreen('menu');
    });
    
    document.getElementById('btnBackFromShop').addEventListener('click', () => {
        showScreen('menu');
        updateMenuUI();
    });
    
    document.getElementById('btnBackFromLeaderboard').addEventListener('click', () => {
        showScreen('menu');
    });
    
    document.getElementById('btnRestart').addEventListener('click', () => {
        game.start(game.level, authManager.equippedSkin);
        showScreen('');
    });
    
    document.getElementById('btnMenuFromGameOver').addEventListener('click', async () => {
        showScreen('menu');
        updateMenuUI();
    });
}

function renderSkinShop() {
    const grid = document.getElementById('skinsGrid');
    grid.innerHTML = '';
    
    document.getElementById('shopCoins').textContent = authManager.totalCoins;
    
    SKINS.forEach(skin => {
        const isOwned = authManager.unlockedSkins.includes(skin.id);
        const isEquipped = authManager.equippedSkin === skin.id;
        
        const card = document.createElement('div');
        card.className = `skin-card ${isOwned ? 'owned' : ''} ${isEquipped ? 'equipped' : ''}`;
        
        const previewColor = skin.color === 'rainbow' ? '#ff0000' : skin.color;
        
        card.innerHTML = `
            <div class="skin-preview">
                <svg viewBox="0 0 60 80" width="60" height="80">
                    <circle cx="30" cy="15" r="8" fill="${previewColor}" stroke="${previewColor}"/>
                    <line x1="30" y1="23" x2="30" y2="50" stroke="${previewColor}" stroke-width="3" stroke-linecap="round"/>
                    <line x1="30" y1="30" x2="15" y2="45" stroke="${previewColor}" stroke-width="2.5" stroke-linecap="round"/>
                    <line x1="30" y1="30" x2="45" y2="45" stroke="${previewColor}" stroke-width="2.5" stroke-linecap="round"/>
                    <line x1="30" y1="50" x2="18" y2="72" stroke="${previewColor}" stroke-width="2.5" stroke-linecap="round"/>
                    <line x1="30" y1="50" x2="42" y2="72" stroke="${previewColor}" stroke-width="2.5" stroke-linecap="round"/>
                </svg>
            </div>
            <div class="skin-name">${skin.name}</div>
            <div class="skin-price">${isOwned ? (isEquipped ? '✓ Équipé' : '✓ Débloqué') : skin.price + ' 💰'}</div>
        `;
        
        card.addEventListener('click', async () => {
            if (isEquipped) return;
            
            if (isOwned) {
                await authManager.equipSkin(skin.id);
                renderSkinShop();
            } else {
                const result = await authManager.buySkin(skin.id);
                if (result.success) {
                    await authManager.equipSkin(skin.id);
                    renderSkinShop();
                    document.getElementById('shopCoins').textContent = authManager.totalCoins;
                } else {
                    alert(result.message);
                }
            }
        });
        
        grid.appendChild(card);
    });
}

async function renderLeaderboard() {
    const list = document.getElementById('leaderboardList');
    list.innerHTML = '<p style="color:#888;text-align:center;">Chargement...</p>';
    
    try {
        const { data, error } = await authManager.supabase
            .from('leaderboard')
            .select('distance, level, created_at, user_id')
            .order('distance', { ascending: false })
            .limit(20);
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            list.innerHTML = '<p style="color:#888;text-align:center;">Aucun score enregistré</p>';
            return;
        }
        
        list.innerHTML = '';
        data.forEach((entry, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            
            const rankColor = index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#888';
            const levelIcon = entry.level === 'city' ? '🏙️' : entry.level === 'forest' ? '🌲' : '🏰';
            
            item.innerHTML = `
                <span class="leaderboard-rank" style="color:${rankColor}">#${index + 1}</span>
                <span class="leaderboard-name">${levelIcon} ${entry.distance}m</span>
                <span class="leaderboard-score">${new Date(entry.created_at).toLocaleDateString()}</span>
            `;
            
            list.appendChild(item);
        });
    } catch (error) {
        console.error('Leaderboard error:', error);
        list.innerHTML = '<p style="color:#ff4444;text-align:center;">Erreur de chargement</p>';
    }
}

const originalGameOver = Game.prototype.gameOver;
Game.prototype.gameOver = function(reason) {
    const result = originalGameOver.call(this, reason);
    
    if (authManager.isAuthenticated() && result.coins > 0) {
        authManager.updateCoins(result.coins);
    }
    
    if (authManager.isAuthenticated()) {
        authManager.saveScore(result.distance);
    }
    
    document.getElementById('totalCoins').textContent = authManager.totalCoins + result.coins;
    
    return result;
};

window.addEventListener('DOMContentLoaded', init);
