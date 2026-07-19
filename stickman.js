class Stickman {
    constructor(x, y, color = '#000000') {
        this.x = x;
        this.y = y;
        this.baseY = y;
        this.color = color;
        this.scale = 1;
        
        this.headRadius = 12;
        this.torsoLength = 35;
        this.armLength = 28;
        this.legLength = 32;
        
        this.state = 'running';
        this.stateTimer = 0;
        this.runCycle = 0;
        
        this.vy = 0;
        this.vx = 0;
        this.onGround = true;
        this.groundY = y;
        
        this.trail = [];
        this.particles = [];
    }

    setColor(color) {
        this.color = color;
    }

    update(deltaTime, speed) {
        this.runCycle += speed * 0.15;
        this.stateTimer++;
        
        this.trail.push({ x: this.x, y: this.y, state: this.state, cycle: this.runCycle });
        if (this.trail.length > GAME_CONFIG.TRAIL_LENGTH) {
            this.trail.shift();
        }
        
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
            p.vy += 0.1;
            return p.life > 0;
        });
        
        if (!this.onGround) {
            this.vy += GAME_CONFIG.GRAVITY;
            this.y += this.vy;
            
            if (this.y >= this.groundY) {
                this.y = this.groundY;
                this.vy = 0;
                this.onGround = true;
                
                if (this.state === 'falling' && this.stateTimer > 15) {
                    this.startRoll();
                } else {
                    this.state = 'running';
                    this.stateTimer = 0;
                }
            }
        }
        
        if (this.state === 'sliding') {
            if (this.stateTimer >= GAME_CONFIG.SLIDE_DURATION) {
                this.state = 'running';
                this.stateTimer = 0;
            }
        } else if (this.state === 'vaulting') {
            if (this.stateTimer >= GAME_CONFIG.VAULT_DURATION) {
                this.state = 'running';
                this.stateTimer = 0;
                this.y = this.groundY;
                this.vy = 0;
                this.onGround = true;
            }
        } else if (this.state === 'rolling') {
            if (this.stateTimer >= GAME_CONFIG.ROLL_DURATION) {
                this.state = 'running';
                this.stateTimer = 0;
                this.y = this.groundY;
            }
        }
    }

    jump() {
        if (this.onGround && (this.state === 'running' || this.state === 'rolling')) {
            this.vy = GAME_CONFIG.JUMP_FORCE;
            this.onGround = false;
            this.state = 'jumping';
            this.stateTimer = 0;
            this.spawnParticles(8, 'jump');
            return true;
        }
        return false;
    }

    slide() {
        if (this.onGround && this.state === 'running') {
            this.state = 'sliding';
            this.stateTimer = 0;
            this.spawnParticles(5, 'slide');
            return true;
        }
        return false;
    }

    vault() {
        if (this.onGround && this.state === 'running') {
            this.state = 'vaulting';
            this.stateTimer = 0;
            this.vy = GAME_CONFIG.JUMP_FORCE * 0.6;
            this.onGround = false;
            this.spawnParticles(6, 'vault');
            return true;
        }
        return false;
    }

    startRoll() {
        this.state = 'rolling';
        this.stateTimer = 0;
        this.spawnParticles(10, 'roll');
    }

    fallFromPlatform() {
        this.state = 'falling';
        this.stateTimer = 0;
        this.onGround = false;
        this.vy = 2;
    }

    spawnParticles(count, type) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: this.x + (Math.random() - 0.5) * 20,
                y: this.y + (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * -3,
                life: 1,
                size: Math.random() * 4 + 2,
                type: type
            });
        }
    }

    getCollisionBox() {
        const w = 20;
        let h = 70;
        let cy = this.y - 35;
        
        if (this.state === 'sliding') {
            h = 25;
            cy = this.y - 10;
        } else if (this.state === 'rolling') {
            h = 25;
            cy = this.y - 10;
        } else if (this.state === 'vaulting') {
            h = 50;
            cy = this.y - 45;
        }
        
        return { x: this.x - w/2, y: cy, width: w, height: h };
    }

    draw(ctx, cameraShake = { x: 0, y: 0 }) {
        const cx = this.x + cameraShake.x;
        const cy = this.y + cameraShake.y;
        
        this.drawTrail(ctx);
        this.drawParticles(ctx);
        
        ctx.save();
        ctx.strokeStyle = this.color;
        ctx.fillStyle = this.color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (this.color === 'rainbow') {
            const hue = (Date.now() / 10) % 360;
            ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
            ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        }
        
        switch (this.state) {
            case 'running':
                this.drawRunning(ctx, cx, cy);
                break;
            case 'jumping':
                this.drawJumping(ctx, cx, cy);
                break;
            case 'sliding':
                this.drawSliding(ctx, cx, cy);
                break;
            case 'vaulting':
                this.drawVaulting(ctx, cx, cy);
                break;
            case 'rolling':
                this.drawRolling(ctx, cx, cy);
                break;
            case 'falling':
                this.drawFalling(ctx, cx, cy);
                break;
        }
        
        ctx.restore();
    }

    drawRunning(ctx, cx, cy) {
        const cycle = this.runCycle;
        const legSwing = Math.sin(cycle) * 0.6;
        const armSwing = Math.sin(cycle + Math.PI) * 0.5;
        
        ctx.beginPath();
        ctx.arc(cx, cy - this.torsoLength - this.headRadius - 2, this.headRadius, 0, Math.PI * 2);
        ctx.fill();
        
        const lean = 0.15;
        const shoulderX = cx + Math.sin(lean) * 5;
        const shoulderY = cy - this.torsoLength;
        const hipX = cx - Math.sin(lean) * 5;
        
        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY);
        ctx.lineTo(hipX, cy);
        ctx.stroke();
        
        const armAngle1 = armSwing - 0.3;
        const armAngle2 = armSwing + 0.3 + Math.PI;
        
        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY + 5);
        ctx.lineTo(
            shoulderX + Math.cos(armAngle1) * this.armLength * 0.5,
            shoulderY + 5 + Math.sin(armAngle1) * this.armLength * 0.5
        );
        ctx.lineTo(
            shoulderX + Math.cos(armAngle1) * this.armLength,
            shoulderY + 5 + Math.sin(armAngle1) * this.armLength * 0.8
        );
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY + 5);
        ctx.lineTo(
            shoulderX + Math.cos(armAngle2) * this.armLength * 0.5,
            shoulderY + 5 + Math.sin(armAngle2) * this.armLength * 0.5
        );
        ctx.lineTo(
            shoulderX + Math.cos(armAngle2) * this.armLength,
            shoulderY + 5 + Math.sin(armAngle2) * this.armLength * 0.8
        );
        ctx.stroke();
        
        const kneeBend = 0.3;
        
        const lLegAngle = legSwing;
        const lKneeX = hipX + Math.cos(lLegAngle) * this.legLength * 0.5;
        const lKneeY = cy + Math.sin(lLegAngle) * this.legLength * 0.5;
        
        ctx.beginPath();
        ctx.moveTo(hipX, cy);
        ctx.lineTo(lKneeX, lKneeY);
        ctx.lineTo(lKneeX + Math.cos(lLegAngle + kneeBend) * this.legLength * 0.5,
                   lKneeY + Math.sin(lLegAngle + kneeBend) * this.legLength * 0.5);
        ctx.stroke();
        
        const rLegAngle = -legSwing + Math.PI;
        const rKneeX = hipX + Math.cos(rLegAngle) * this.legLength * 0.5;
        const rKneeY = cy + Math.sin(rLegAngle) * this.legLength * 0.5;
        
        ctx.beginPath();
        ctx.moveTo(hipX, cy);
        ctx.lineTo(rKneeX, rKneeY);
        ctx.lineTo(rKneeX + Math.cos(rLegAngle - kneeBend) * this.legLength * 0.5,
                   rKneeY + Math.sin(rLegAngle - kneeBend) * this.legLength * 0.5);
        ctx.stroke();
    }

    drawJumping(ctx, cx, cy) {
        ctx.beginPath();
        ctx.arc(cx, cy - this.torsoLength - this.headRadius - 2, this.headRadius, 0, Math.PI * 2);
        ctx.fill();
        
        const shoulderX = cx;
        const shoulderY = cy - this.torsoLength;
        
        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY);
        ctx.lineTo(cx, cy);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY + 5);
        ctx.lineTo(shoulderX - 20, shoulderY - 15);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY + 5);
        ctx.lineTo(shoulderX + 20, shoulderY - 15);
        ctx.stroke();
        
        const tuck = Math.min(1, this.stateTimer / 10);
        
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx - 10 * tuck, cy - 15 * tuck);
        ctx.lineTo(cx - 5 * tuck, cy + 5);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + 10 * tuck, cy - 15 * tuck);
        ctx.lineTo(cx + 5 * tuck, cy + 5);
        ctx.stroke();
    }

    drawSliding(ctx, cx, cy) {
        const progress = this.stateTimer / GAME_CONFIG.SLIDE_DURATION;
        
        ctx.beginPath();
        ctx.arc(cx + 5, cy - 15, this.headRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(cx + 5, cy - 15);
        ctx.lineTo(cx - 25, cy - 5);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(cx - 5, cy - 12);
        ctx.lineTo(cx - 35, cy - 8);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(cx - 5, cy - 8);
        ctx.lineTo(cx - 30, cy - 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(cx - 25, cy - 5);
        ctx.lineTo(cx - 40, cy - 2);
        ctx.lineTo(cx - 45, cy + 3);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(cx - 25, cy - 5);
        ctx.lineTo(cx - 38, cy + 2);
        ctx.lineTo(cx - 42, cy + 6);
        ctx.stroke();
    }

    drawVaulting(ctx, cx, cy) {
        const progress = this.stateTimer / GAME_CONFIG.VAULT_DURATION;
        const vaultHeight = Math.sin(progress * Math.PI) * 40;
        const handX = cx + 15;
        const handY = cy - 20 + vaultHeight * 0.3;
        
        ctx.beginPath();
        ctx.arc(cx, cy - this.torsoLength - this.headRadius - 2 - vaultHeight * 0.5, this.headRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(cx, cy - this.torsoLength - vaultHeight * 0.5);
        ctx.lineTo(cx + 10, cy - vaultHeight * 0.2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(cx + 3, cy - this.torsoLength + 5 - vaultHeight * 0.5);
        ctx.lineTo(handX, handY);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(cx + 3, cy - this.torsoLength + 5 - vaultHeight * 0.5);
        ctx.lineTo(handX - 5, handY + 5);
        ctx.stroke();
        
        const legSwing = Math.sin(progress * Math.PI) * 1.2;
        
        ctx.beginPath();
        ctx.moveTo(cx + 10, cy - vaultHeight * 0.2);
        ctx.lineTo(cx + 10 + Math.cos(legSwing) * 20, cy - 10 + Math.sin(legSwing) * 15);
        ctx.lineTo(cx + 15 + Math.cos(legSwing) * 30, cy + 5);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(cx + 10, cy - vaultHeight * 0.2);
        ctx.lineTo(cx + 5 + Math.cos(legSwing - 0.5) * 15, cy - 5 + Math.sin(legSwing - 0.5) * 10);
        ctx.lineTo(cx + 10 + Math.cos(legSwing - 0.5) * 25, cy + 8);
        ctx.stroke();
    }

    drawRolling(ctx, cx, cy) {
        const progress = this.stateTimer / GAME_CONFIG.ROLL_DURATION;
        const rollAngle = progress * Math.PI * 2;
        
        ctx.save();
        ctx.translate(cx - 10, cy - 10);
        ctx.rotate(rollAngle);
        
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(0, -20, this.headRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(-5, -5);
        ctx.lineTo(-15, -5);
        ctx.lineTo(-15, 5);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(5, -5);
        ctx.lineTo(15, -5);
        ctx.lineTo(15, 5);
        ctx.stroke();
        
        ctx.restore();
    }

    drawFalling(ctx, cx, cy) {
        ctx.beginPath();
        ctx.arc(cx, cy - this.torsoLength - this.headRadius - 2, this.headRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(cx, cy - this.torsoLength);
        ctx.lineTo(cx, cy);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(cx, cy - this.torsoLength + 5);
        ctx.lineTo(cx - 15, cy - 10);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(cx, cy - this.torsoLength + 5);
        ctx.lineTo(cx + 15, cy - 10);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx - 10, cy + 15);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + 10, cy + 15);
        ctx.stroke();
    }

    drawTrail(ctx) {
        if (this.trail.length < 2) return;
        
        for (let i = 0; i < this.trail.length - 1; i++) {
            const alpha = (i / this.trail.length) * 0.3;
            const point = this.trail[i];
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = this.color === 'rainbow' ? `hsl(${(Date.now() / 10 - i * 20) % 360}, 100%, 50%)` : this.color;
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            ctx.arc(point.x, point.y - 35, 3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
    }

    drawParticles(ctx) {
        this.particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.fillStyle = this.color === 'rainbow' ? `hsl(${(Date.now() / 5) % 360}, 100%, 60%)` : this.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }
}
