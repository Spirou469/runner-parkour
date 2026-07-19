class AudioSystem {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.isPlaying = false;
        this.tempo = 130;
        this.baseTempo = 130;
        this.beatInterval = null;
        this.currentBeat = 0;
        this.speedMultiplier = 1;
    }

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.4;
        this.masterGain.connect(this.ctx.destination);
        
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.35;
        this.musicGain.connect(this.masterGain);
        
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.5;
        this.sfxGain.connect(this.masterGain);
    }

    startMusic(tempo = 130) {
        this.init();
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.baseTempo = tempo;
        this.tempo = tempo;
        this.currentBeat = 0;
        this.scheduleMusic();
    }

    stopMusic() {
        this.isPlaying = false;
        if (this.beatInterval) {
            clearInterval(this.beatInterval);
            this.beatInterval = null;
        }
    }

    setSpeedMultiplier(multiplier) {
        this.speedMultiplier = multiplier;
        this.tempo = this.baseTempo * (0.8 + multiplier * 0.4);
        if (this.isPlaying) {
            this.stopMusic();
            this.startMusic(this.tempo);
        }
    }

    scheduleMusic() {
        const beatTime = 60000 / this.tempo;
        
        const playBeat = () => {
            if (!this.isPlaying) return;
            const now = this.ctx.currentTime;
            
            if (this.currentBeat % 4 === 0) {
                this.playBass(now, 55);
            } else if (this.currentBeat % 4 === 2) {
                this.playBass(now, 65.41);
            } else if (this.currentBeat % 4 === 3) {
                this.playBass(now, 73.42);
            }
            
            this.playKick(now);
            
            if (this.currentBeat % 2 === 1) {
                this.playHiHat(now);
            }
            
            if (this.currentBeat % 4 === 2) {
                this.playSnare(now);
            }
            
            if (this.speedMultiplier > 1.2 && this.currentBeat % 2 === 0) {
                const notes = [220, 261.63, 329.63, 392, 440, 523.25];
                const note = notes[Math.floor(this.currentBeat / 2) % notes.length];
                this.playSynthLead(now, note, 0.08);
            }
            
            if (this.currentBeat % 8 === 0) {
                this.playPad(now);
            }
            
            this.currentBeat = (this.currentBeat + 1) % 64;
        };
        
        this.beatInterval = setInterval(playBeat, beatTime / 4);
        playBeat();
    }

    playKick(time) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.musicGain);
        
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(40, time + 0.1);
        
        gain.gain.setValueAtTime(0.8, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
        
        osc.start(time);
        osc.stop(time + 0.2);
    }

    playSnare(time) {
        const noise = this.ctx.createBufferSource();
        const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.1, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        noise.buffer = buffer;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1000;
        
        const gain = this.ctx.createGain();
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);
        
        gain.gain.setValueAtTime(0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
        
        noise.start(time);
        noise.stop(time + 0.15);
    }

    playHiHat(time) {
        const noise = this.ctx.createBufferSource();
        const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.05, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        noise.buffer = buffer;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 8000;
        
        const gain = this.ctx.createGain();
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);
        
        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
        
        noise.start(time);
        noise.stop(time + 0.05);
    }

    playBass(time, freq) {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, time);
        filter.frequency.exponentialRampToValueAtTime(200, time + 0.3);
        
        gain.gain.setValueAtTime(0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);
        
        osc.start(time);
        osc.stop(time + 0.4);
    }

    playSynthLead(time, freq, duration) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, time);
        
        gain.gain.setValueAtTime(0.15, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
        
        osc.connect(gain);
        gain.connect(this.musicGain);
        
        osc.start(time);
        osc.stop(time + duration);
    }

    playPad(time) {
        const freqs = [110, 130.81, 164.81];
        freqs.forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, time + i * 0.05);
            
            gain.gain.setValueAtTime(0.08, time);
            gain.gain.linearRampToValueAtTime(0.12, time + 0.5);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 2);
            
            osc.connect(gain);
            gain.connect(this.musicGain);
            
            osc.start(time);
            osc.stop(time + 2);
        });
    }

    playJump() {
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
        
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start(now);
        osc.stop(now + 0.2);
    }

    playSlide() {
        this.init();
        const now = this.ctx.currentTime;
        const noise = this.ctx.createBufferSource();
        const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.3, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        noise.buffer = buffer;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, now);
        filter.frequency.exponentialRampToValueAtTime(200, now + 0.3);
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        
        noise.start(now);
        noise.stop(now + 0.3);
    }

    playVault() {
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.25);
    }

    playRoll() {
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.3);
    }

    playCoin() {
        this.init();
        const now = this.ctx.currentTime;
        
        [1200, 1600].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.05);
            gain.gain.setValueAtTime(0.2, now + i * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.1);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(now + i * 0.05);
            osc.stop(now + i * 0.05 + 0.1);
        });
    }

    playGameOver() {
        this.init();
        const now = this.ctx.currentTime;
        
        [440, 349.23, 293.66, 220].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + i * 0.3);
            gain.gain.setValueAtTime(0.25, now + i * 0.3);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.3 + 0.4);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(now + i * 0.3);
            osc.stop(now + i * 0.3 + 0.4);
        });
    }

    playLanding() {
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.1);
    }
}
