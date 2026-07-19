// Main Game Engine
class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();
        
        // Game state
        this.isRunning = false;
        this.isPaused = false;
        this.isGameOver = false;
        this.level = 'city';
        
        // Player
        this.player = null;
        this.playerSkin = 'black';
        
        // World
        this.camera = { x: 0, y: 0 };
        this.cameraShake = { x: 0, y: 0, intensity: 0, duration: 0 };
        this.groundY = this.canvas.height * GAME_CONFIG.GROUND_Y_RATIO;
        this.distance = 0;
        this.score = 0;
        this.coins = 0;
        this.speed = GAME_CONFIG.BASE_SPEED;
        
        // Obstacles
        this.obstacles = [];
        this.nextObstacleDistance = 200;
        
        // Background
        this.bgOffset = 0;
        this.bgElements = [];
        this.particles = [];
        this.coinParticles = [];
        
        // Input
        this.keys = {};
        this.setupInput();
        
        // Audio
        this.audio = new AudioSystem();
        
        // Animation frame
        this.animationId = null;
        this.lastTime = 0;
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.groundY = this.canvas.height * GAME_CONFIG.GROUND_Y_RATIO;
        if (this.player) {
            this.player.groundY = this.groundY;
            if (this.player.onGround) this.player.y = this.groundY;
        }
    }

    setupInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (!this.isRunning || this.isGameOver) return;
            
            switch (e.code) {
                case 'ArrowUp':
                case 'Space':
                    e.preventDefault();
                    if (this.player.jump()) {
                        this.audio.playJump();
                    }
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    if (this.player.slide()) {
                        this.audio.playSlide();
                    }
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.speed = Math.min(this.speed + 2, GAME_CONFIG.MAX_SPEED);
                    this.audio.setSpeedMultiplier(this.speed / GAME_CONFIG.BASE_SPEED);
                    break;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            if (e.code === 'ArrowRight') {
                this.speed = Math.max(this.speed - 2, GAME_CONFIG.BASE_SPEED);
                this.audio.setSpeedMultiplier(this.speed / GAME_CONFIG.BASE_SPEED);
            }
        });
        
        window.addEventListener('resize', () => this.resize());
    }

    start(level = 'city', skin = 'black') {
        this.level = level;
        this.playerSkin = skin;
        const levelConfig = LEVELS[level];
        
        // Reset state
        this.isRunning = true;
        this.isGameOver = false;
        this.distance = 0;
        this.score = 0;
        this.coins = 0;
        this.speed = GAME_CONFIG.BASE_SPEED;
        this.obstacles = [];
        this.nextObstacleDistance = 300;
        this.bgOffset = 0;
        this.bgElements = [];
        this.particles = [];
        this.coinParticles = [];
        this.cameraShake = { x: 0, y: 0, intensity: 0, duration: 0 };
        
        // Create player
        const skinData = SKINS.find(s => s.id === skin) || SKINS[0];
        this.player = new Stickman(150, this.groundY, skinData.color);
        
        // Generate initial background
        this.generateBackground();
        
        // Start audio
        this.audio.startMusic(levelConfig.musicTempo);
        
        // Show HUD
        document.getElementById('gameHUD').style.display = 'block';
        document.getElementById('controlsHint').style.display = 'flex';
        document.getElementById('gameOver').style.display = 'none';
        
        // Start loop
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
    }

    stop() {
        this.isRunning = false;
        this.audio.stopMusic();
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        document.getElementById('gameHUD').style.display = 'none';
        document.getElementById('controlsHint').style.display = 'none';
    }

    gameOver() {
        this.isRunning = false;
        this.isGameOver = true;
        this.audio.stopMusic();
        this.audio.playGameOver();
        
        // Show game over screen
        document.getElementById('finalDistance').textContent = Math.floor(this.distance);
        document.getElementById('finalCoins').textContent = this.coins;
        
        const gameOverScreen = document.getElementById('gameOver');
        gameOverScreen.style.display = 'flex';
        gameOverScreen.classList.add('active');
        
        document.getElementById('gameHUD').style.display = 'none';
        document.getElementById('controlsHint').style.display = 'none';
        
        // Return coins and distance for saving
        return { coins: this.coins, distance: Math.floor(this.distance) };
    }

    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        const deltaTime = (currentTime - this.lastTime) / 16.67; // Normalize to ~60fps
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        // Speed progression
        this.speed += GAME_CONFIG.SPEED_INCREMENT * deltaTime;
        this.speed = Math.min(this.speed, GAME_CONFIG.MAX_SPEED);
        
        // Distance
        this.distance += (this.speed * deltaTime) / 10;
        this.score = Math.floor(this.distance);
        
        // Coins based on distance
        const newCoins = Math.floor(this.distance / GAME_CONFIG.COIN_EVERY_METERS);
        if (newCoins > this.coins) {
            this.coins = newCoins;
            this.audio.playCoin();
        }
        
        // Update player
        this.player.update(deltaTime, this.speed);
        
        // Camera follow
        this.camera.x = this.player.x - 150;
        
        // Camera shake
        if (this.cameraShake.duration > 0) {
            this.cameraShake.duration -= deltaTime;
            this.cameraShake.x = (Math.random() - 0.5) * this.cameraShake.intensity;
            this.cameraShake.y = (Math.random() - 0.5) * this.cameraShake.intensity;
            if (this.cameraShake.duration <= 0) {
                this.cameraShake.x = 0;
                this.cameraShake.y = 0;
            }
        }
        
        // Background scroll
        this.bgOffset += this.speed * 0.3 * deltaTime;
        
        // Generate obstacles
        this.generateObstacles();
        
        // Update obstacles
        this.updateObstacles(deltaTime);
        
        // Update particles
        this.updateParticles(deltaTime);
        
        // Update background elements
        this.updateBackground(deltaTime);
        
        // Update HUD
        this.updateHUD();
    }

    generateObstacles() {
        const spawnX = this.camera.x + this.canvas.width + 100;
        
        if (this.distance * 10 > this.nextObstacleDistance) {
            const types = [OBSTACLE_TYPES.LOW, OBSTACLE_TYPES.HIGH, OBSTACLE_TYPES.MEDIUM, OBSTACLE_TYPES.PLATFORM, OBSTACLE_TYPES.GAP];
            const weights = [0.25, 0.2, 0.2, 0.2, 0.15];
            
            const type = this.weightedRandom(types, weights);
            
            let obstacle = {
                type: type,
                x: spawnX,
                passed: false,
            };
            
            switch (type) {
                case OBSTACLE_TYPES.LOW:
                    obstacle.width = 35;
                    obstacle.height = 35;
                    obstacle.y = this.groundY - obstacle.height;
                    break;
                case OBSTACLE_TYPES.HIGH:
                    obstacle.width = 40;
                    obstacle.height = 90;
                    obstacle.y = this.groundY - obstacle.height - 30;
                    obstacle.gapY = this.groundY;
                    break;
                case OBSTACLE_TYPES.MEDIUM:
                    obstacle.width = 30;
                    obstacle.height = 60;
                    obstacle.y = this.groundY - obstacle.height;
                    break;
                case OBSTACLE_TYPES.PLATFORM:
                    obstacle.width = 80;
                    obstacle.height = 20;
                    obstacle.y = this.groundY - 100;
                    obstacle.platform = true;
                    break;
                case OBSTACLE_TYPES.GAP:
                    obstacle.width = 80;
                    obstacle.height = 0;
                    obstacle.y = this.groundY;
                    obstacle.isGap = true;
                    break;
            }
            
            this.obstacles.push(obstacle);
            
            this.nextObstacleDistance = this.distance * 10 + 
                GAME_CONFIG.OBSTACLE_SPAWN_MIN + Math.random() * (GAME_CONFIG.OBSTACLE_SPAWN_MAX - GAME_CONFIG.OBSTACLE_SPAWN_MIN);
        }
    }

    weightedRandom(items, weights) {
        const total = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * total;
        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random <= 0) return items[i];
        }
        return items[0];
    }

    updateObstacles(deltaTime) {
        const playerBox = this.player.getCollisionBox();
        
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            
            // Move obstacle with world
            obs.x -= this.speed * deltaTime;
            
            // Check collision
            if (!obs.passed && this.checkCollision(playerBox, obs)) {
                // Check if player can auto-vault medium obstacles
                if (obs.type === OBSTACLE_TYPES.MEDIUM && this.player.state === 'running') {
                    this.player.vault();
                    this.audio.playVault();
                    obs.passed = true;
                    continue;
                }
                
                // Check if on platform
                if (obs.platform && this.player.onGround && 
                    playerBox.x + playerBox.width > obs.x && 
                    playerBox.x < obs.x + obs.width &&
                    Math.abs(playerBox.y + playerBox.height - obs.y) < 10) {
                    // Player is on platform
                    this.player.groundY = obs.y;
                    this.player.y = obs.y;
                    this.player.onGround = true;
                    this.player.vy = 0;
                    
                    // Check if player moved past platform
                    if (playerBox.x > obs.x + obs.width) {
                        // Fall off platform - auto roll
                        this.player.groundY = this.groundY;
                        this.player.fallFromPlatform();
                        this.triggerCameraShake();
                    }
                    continue;
                }
                
                // Gap - check if player fell in
                if (obs.isGap) {
                    if (playerBox.x > obs.x && playerBox.x < obs.x + obs.width && this.player.onGround) {
                        this.player.onGround = false;
                        this.player.vy = 5;
                        this.player.state = 'falling';
                        setTimeout(() => {
                            if (this.isRunning) this.gameOver();
                        }, 800);
                    }
                    continue;
                }
                
                // Actual collision - game over
                if (!obs.isGap && !obs.platform) {
                    this.triggerCameraShake(6, 15);
                    this.gameOver();
                    return;
                }
            }
            
            // Mark as passed
            if (!obs.passed && obs.x + obs.width < playerBox.x) {
                obs.passed = true;
            }
            
            // Remove off-screen obstacles
            if (obs.x + obs.width < this.camera.x - 100) {
                this.obstacles.splice(i, 1);
            }
        }
        
        // Reset ground if player fell from platform and landed
        if (this.player.onGround && this.player.groundY !== this.groundY && 
            this.player.state === 'running') {
            this.player.groundY = this.groundY;
        }
    }

    checkCollision(box, obs) {
        if (obs.isGap) return false;
        
        return (
            box.x < obs.x + obs.width &&
            box.x + box.width > obs.x &&
            box.y < obs.y + obs.height &&
            box.y + box.height > obs.y
        );
    }

    triggerCameraShake(intensity = GAME_CONFIG.SHAKE_INTENSITY, duration = GAME_CONFIG.SHAKE_DURATION) {
        this.cameraShake.intensity = intensity;
        this.cameraShake.duration = duration;
    }

    updateParticles(deltaTime) {
        // Speed lines
        if (this.speed > GAME_CONFIG.BASE_SPEED * 1.5) {
            for (let i = 0; i < 2; i++) {
                this.particles.push({
                    x: this.camera.x + this.canvas.width + Math.random() * 100,
                    y: Math.random() * this.canvas.height,
                    vx: -this.speed * 2 - Math.random() * 5,
                    vy: 0,
                    width: 30 + Math.random() * 50,
                    height: 1 + Math.random() * 2,
                    life: 1,
                    type: 'speedline'
                });
            }
        }
        
        // Update existing particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * deltaTime;
            p.life -= 0.02 * deltaTime;
            
            if (p.life <= 0 || p.x < this.camera.x - 100) {
                this.particles.splice(i, 1);
            }
        }
        
        // Coin particles
        for (let i = this.coinParticles.length - 1; i >= 0; i--) {
            const p = this.coinParticles[i];
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.vy += 0.2;
            p.life -= 0.03 * deltaTime;
            
            if (p.life <= 0) {
                this.coinParticles.splice(i, 1);
            }
        }
    }

    generateBackground() {
        const level = LEVELS[this.level];
        
        for (let i = 0; i < 20; i++) {
            this.bgElements.push({
                x: i * 150 + Math.random() * 100,
                y: this.groundY - 50 - Math.random() * 200,
                width: 40 + Math.random() * 80,
                height: 50 + Math.random() * 200,
                type: level.bgElements,
                layer: Math.random() > 0.5 ? 0.3 : 0.6,
            });
        }
    }

    updateBackground(deltaTime) {
        const rightmost = this.bgElements.length > 0 ? 
            Math.max(...this.bgElements.map(e => e.x + e.width)) : 0;
        
        if (rightmost < this.camera.x + this.canvas.width + 500) {
            const level = LEVELS[this.level];
            this.bgElements.push({
                x: rightmost + 50 + Math.random() * 100,
                y: this.groundY - 50 - Math.random() * 200,
                width: 40 + Math.random() * 80,
                height: 50 + Math.random() * 200,
                type: level.bgElements,
                layer: Math.random() > 0.5 ? 0.3 : 0.6,
            });
        }
        
        this.bgElements = this.bgElements.filter(e => e.x + e.width > this.camera.x - 200);
    }

    updateHUD() {
        document.getElementById('hudScore').textContent = Math.floor(this.distance) + 'm';
        document.getElementById('hudCoins').textContent = '💰 ' + this.coins;
        document.getElementById('hudSpeed').textContent = 'Speed: ' + (this.speed / GAME_CONFIG.BASE_SPEED).toFixed(1) + 'x';
    }

    render() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const level = LEVELS[this.level];
        
        // Clear
        ctx.clearRect(0, 0, w, h);
        
        // Sky gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        level.skyGradient.forEach((color, i) => {
            gradient.addColorStop(i / (level.skyGradient.length - 1), color);
        });
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
        
        // Background elements (parallax)
        this.drawBackground(ctx, level);
        
        // Ground
        ctx.fillStyle = level.groundColor;
        ctx.fillRect(0, this.groundY, w, h - this.groundY);
        
        // Ground line glow
        ctx.strokeStyle = level.accentColor;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, this.groundY);
        ctx.lineTo(w, this.groundY);
        ctx.stroke();
        ctx.globalAlpha = 1;
        
        // Speed lines
        this.drawSpeedLines(ctx);
        
        // Obstacles
        this.drawObstacles(ctx, level);
        
        // Player
        this.player.draw(ctx, this.cameraShake);
        
        // Coin particles
        this.drawCoinParticles(ctx);
    }

    drawBackground(ctx, level) {
        this.bgElements.forEach(el => {
            const parallaxX = el.x - this.camera.x * el.layer;
            
            if (parallaxX + el.width < 0 || parallaxX > this.canvas.width) return;
            
            ctx.save();
            ctx.globalAlpha = 0.3 + el.layer * 0.4;
            
            if (el.type === 'buildings') {
                ctx.fillStyle = level.buildingColor;
                ctx.fillRect(parallaxX, el.y, el.width, this.groundY - el.y);
                
                ctx.fillStyle = 'rgba(0, 255, 200, 0.15)';
                for (let wy = el.y + 10; wy < this.groundY - 10; wy += 20) {
                    for (let wx = parallaxX + 5; wx < parallaxX + el.width - 5; wx += 15) {
                        if (Math.random() > 0.3) {
                            ctx.fillRect(wx, wy, 8, 10);
                        }
                    }
                }
            } else if (el.type === 'trees') {
                ctx.fillStyle = level.buildingColor;
                ctx.fillRect(parallaxX + el.width/2 - 3, el.y + 20, 6, this.groundY - el.y - 20);
                ctx.beginPath();
                ctx.arc(parallaxX + el.width/2, el.y + 20, el.width/2, 0, Math.PI * 2);
                ctx.fill();
            } else if (el.type === 'ruins') {
                ctx.fillStyle = level.buildingColor;
                ctx.fillRect(parallaxX, el.y, el.width, this.groundY - el.y);
                ctx.clearRect(parallaxX + 5, el.y, el.width - 10, 15);
                ctx.fillRect(parallaxX + 10, el.y + 5, el.width - 20, 10);
            }
            
            ctx.restore();
        });
    }

    drawObstacles(ctx, level) {
        this.obstacles.forEach(obs => {
            const screenX = obs.x - this.camera.x;
            
            if (screenX + obs.width < 0 || screenX > this.canvas.width) return;
            
            if (obs.isGap) {
                ctx.fillStyle = '#000';
                ctx.fillRect(screenX, this.groundY, obs.width, this.canvas.height - this.groundY);
                return;
            }
            
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(screenX + 5, obs.y + obs.height, obs.width, 5);
            
            const colorIndex = Math.floor(Math.random() * level.obstacleColors.length);
            ctx.fillStyle = level.obstacleColors[obs.type === OBSTACLE_TYPES.LOW ? 0 : 
                                                  obs.type === OBSTACLE_TYPES.HIGH ? 1 : 2];
            
            if (obs.type === OBSTACLE_TYPES.LOW) {
                ctx.fillRect(screenX, obs.y, obs.width, obs.height);
                ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                ctx.lineWidth = 1;
                ctx.strokeRect(screenX + 3, obs.y + 3, obs.width - 6, obs.height - 6);
                ctx.beginPath();
                ctx.moveTo(screenX + 3, obs.y + obs.height/2);
                ctx.lineTo(screenX + obs.width - 3, obs.y + obs.height/2);
                ctx.stroke();
            } else if (obs.type === OBSTACLE_TYPES.HIGH) {
                ctx.fillRect(screenX, obs.y, obs.width, obs.height);
                ctx.fillStyle = 'rgba(255, 200, 0, 0.3)';
                for (let i = 0; i < 3; i++) {
                    ctx.fillRect(screenX + i * 12, obs.y, 6, obs.height);
                }
            } else if (obs.type === OBSTACLE_TYPES.MEDIUM) {
                ctx.fillRect(screenX, obs.y, obs.width, obs.height);
                ctx.fillStyle = 'rgba(255,255,255,0.1)';
                ctx.fillRect(screenX, obs.y, obs.width, 3);
            } else if (obs.platform) {
                ctx.fillStyle = level.obstacleColors[0];
                ctx.fillRect(screenX, obs.y, obs.width, obs.height);
                ctx.fillStyle = level.accentColor;
                ctx.globalAlpha = 0.3;
                ctx.fillRect(screenX, obs.y, obs.width, 3);
                ctx.globalAlpha = 1;
            }
        });
    }

    drawSpeedLines(ctx) {
        ctx.save();
        this.particles.forEach(p => {
            if (p.type === 'speedline') {
                const screenX = p.x - this.camera.x;
                ctx.strokeStyle = LEVELS[this.level].accentColor;
                ctx.globalAlpha = p.life * 0.3;
                ctx.lineWidth = p.height;
                ctx.beginPath();
                ctx.moveTo(screenX, p.y);
                ctx.lineTo(screenX + p.width, p.y);
                ctx.stroke();
            }
        });
        ctx.restore();
    }

    drawCoinParticles(ctx) {
        ctx.save();
        this.coinParticles.forEach(p => {
            const screenX = p.x - this.camera.x;
            ctx.globalAlpha = p.life;
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(screenX, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#ffaa00';
            ctx.lineWidth = 1;
            ctx.stroke();
        });
        ctx.restore();
    }
}
