// Monster that chases the player - Vector style silhouette
class Monster {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.baseY = y;
        
        this.headRadius = 18;
        this.torsoLength = 50;
        this.armLength = 40;
        this.legLength = 45;
        
        this.runCycle = 0;
        this.state = 'chasing';
        
        this.trail = [];
        this.glowIntensity = 0;
        
        this.targetDistance = 250;
        this.catchDistance = 60;
        
        this.speed = 0;
    }

    update(deltaTime, playerX, playerSpeed, playerState) {
        const distToPlayer = playerX - this.x;
        
        if (distToPlayer > this.targetDistance + 50) {
            this.speed = playerSpeed * 1.1;
        } else if (distToPlayer < this.targetDistance - 50) {
            this.speed = playerSpeed * 0.85;
        } else {
            this.speed = playerSpeed * (0.95 + Math.sin(Date.now() / 1000) * 0.1);
        }
        
        this.x += this.speed * deltaTime;
        this.runCycle += this.speed * 0.12;
        
        const proximity = 1 - Math.min(distToPlayer / 400, 1);
        this.glowIntensity = proximity;
        
        this.trail.push({ x: this.x, y: this.y, cycle: this.runCycle });
        if (this.trail.length > 12) {
            this.trail.shift();
        }
        
        if (distToPlayer < this.catchDistance) {
            this.state = 'catching';
        } else {
            this.state = 'chasing';
        }
    }

    isCaught() {
        return this.state === 'catching';
    }

    draw(ctx, cameraShake = { x: 0, y: 0 }) {
        const cx = this.x + cameraShake.x;
        const cy = this.y + cameraShake.y;
        
        this.drawTrail(ctx);
        
        if (this.glowIntensity > 0.3) {
            this.drawGlow(ctx, cx, cy);
        }
        
        ctx.save();
        
        const redGlow = Math.floor(50 + this.glowIntensity * 100);
        ctx.strokeStyle = `rgb(${redGlow}, 0, 0)`;
        ctx.fillStyle = `rgb(${redGlow}, 0, 0)`;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.shadowColor = `rgba(255, 0, 0, ${0.3 + this.glowIntensity * 0.5})`;
        ctx.shadowBlur = 20 + this.glowIntensity * 30;
        
        this.drawRunning(ctx, cx, cy);
        
        ctx.restore();
    }

    drawRunning(ctx, cx, cy) {
        const cycle = this.runCycle;
        const legSwing = Math.sin(cycle) * 0.7;
        const armSwing = Math.sin(cycle + Math.PI) * 0.6;
        
        ctx.beginPath();
        ctx.arc(cx, cy - this.torsoLength - this.headRadius - 2, this.headRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(cx - 6, cy - this.torsoLength - this.headRadius - 5, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 6, cy - this.torsoLength - this.headRadius - 5, 3, 0, Math.PI * 2);
        ctx.fill();
        
        const redGlow = Math.floor(50 + this.glowIntensity * 100);
        ctx.fillStyle = `rgb(${redGlow}, 0, 0)`;
        ctx.shadowBlur = 20 + this.glowIntensity * 30;
        
        const lean = 0.35;
        const shoulderX = cx + Math.sin(lean) * 12;
        const shoulderY = cy - this.torsoLength;
        const hipX = cx - Math.sin(lean) * 8;
        
        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY);
        ctx.lineTo(hipX, cy);
        ctx.stroke();
        
        const armAngle1 = armSwing - 0.6;
        const armAngle2 = armSwing + 0.6 + Math.PI;
        
        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY + 8);
        ctx.lineTo(
            shoulderX + Math.cos(armAngle1) * this.armLength * 0.5,
            shoulderY + 8 + Math.sin(armAngle1) * this.armLength * 0.5
        );
        ctx.lineTo(
            shoulderX + Math.cos(armAngle1) * this.armLength * 0.9,
            shoulderY + 8 + Math.sin(armAngle1) * this.armLength * 0.7
        );
        ctx.stroke();
        
        this.drawClaw(ctx, 
            shoulderX + Math.cos(armAngle1) * this.armLength * 0.9,
            shoulderY + 8 + Math.sin(armAngle1) * this.armLength * 0.7
        );
        
        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY + 8);
        ctx.lineTo(
            shoulderX + Math.cos(armAngle2) * this.armLength * 0.5,
            shoulderY + 8 + Math.sin(armAngle2) * this.armLength * 0.5
        );
        ctx.lineTo(
            shoulderX + Math.cos(armAngle2) * this.armLength * 0.9,
            shoulderY + 8 + Math.sin(armAngle2) * this.armLength * 0.7
        );
        ctx.stroke();
        
        this.drawClaw(ctx,
            shoulderX + Math.cos(armAngle2) * this.armLength * 0.9,
            shoulderY + 8 + Math.sin(armAngle2) * this.armLength * 0.7
        );
        
        const kneeBend = 0.4;
        
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

    drawClaw(ctx, x, y) {
        ctx.beginPath();
        ctx.moveTo(x - 4, y);
        ctx.lineTo(x - 2, y + 6);
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 7);
        ctx.moveTo(x + 4, y);
        ctx.lineTo(x + 2, y + 6);
        ctx.stroke();
    }

    drawGlow(ctx, cx, cy) {
        const gradient = ctx.createRadialGradient(cx, cy - 30, 10, cx, cy - 30, 80);
        gradient.addColorStop(0, `rgba(255, 0, 0, ${0.1 + this.glowIntensity * 0.2})`);
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        ctx.save();
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy - 30, 80, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    drawTrail(ctx) {
        if (this.trail.length < 2) return;
        
        for (let i = 0; i < this.trail.length - 1; i++) {
            const alpha = (i / this.trail.length) * 0.15;
            const point = this.trail[i];
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#ff0000';
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(point.x, point.y - 40, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
}
