// Supabase configuration
const SUPABASE_URL = 'https://epgvbjmspiyctwcomygy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwZ3Ziam1zcGl5Y3R3Y29teWd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0NTgyNDksImV4cCI6MjEwMDAzNDI0OX0.2pWoajEN4hdiQ1Kn4c7FBz52EkgYVtLBRxYmboE_0yk';

// Game configuration
const GAME_CONFIG = {
    BASE_SPEED: 6,
    MAX_SPEED: 18,
    SPEED_INCREMENT: 0.0005,
    GRAVITY: 0.6,
    JUMP_FORCE: -14,
    SLIDE_DURATION: 45,
    VAULT_DURATION: 40,
    ROLL_DURATION: 35,
    GROUND_Y_RATIO: 0.78,
    OBSTACLE_SPAWN_MIN: 120,
    OBSTACLE_SPAWN_MAX: 350,
    COIN_EVERY_METERS: 10,
    COIN_VALUE: 1,
    SHAKE_INTENSITY: 3,
    SHAKE_DURATION: 8,
    PARTICLE_COUNT: 15,
    TRAIL_LENGTH: 8,
};

const LEVELS = {
    city: {
        name: 'La Ville',
        skyGradient: ['#0a0a1a', '#1a0a2e', '#2d1b4e'],
        groundColor: '#1a1a2e',
        buildingColor: '#0d0d1a',
        accentColor: '#00ffcc',
        particleColor: 'rgba(0, 255, 200, 0.6)',
        obstacleColors: ['#2a2a4e', '#1a1a3e', '#3a3a5e'],
        bgElements: 'buildings',
        musicTempo: 130,
    },
    forest: {
        name: 'La Forêt',
        skyGradient: ['#0a1a0a', '#0a2a1a', '#1a3a2a'],
        groundColor: '#1a2a1a',
        buildingColor: '#0a1a0a',
        accentColor: '#00ff88',
        particleColor: 'rgba(0, 255, 100, 0.6)',
        obstacleColors: ['#2a3a2a', '#1a2a1a', '#3a4a3a'],
        bgElements: 'trees',
        musicTempo: 115,
    },
    ruins: {
        name: 'Les Ruines',
        skyGradient: ['#1a0a0a', '#2a0a0a', '#3a1a0a'],
        groundColor: '#2a1a0a',
        buildingColor: '#1a0a0a',
        accentColor: '#ff8800',
        particleColor: 'rgba(255, 136, 0, 0.6)',
        obstacleColors: ['#3a2a1a', '#2a1a0a', '#4a3a2a'],
        bgElements: 'ruins',
        musicTempo: 100,
    }
};

const SKINS = [
    { id: 'black', name: 'Noir', color: '#000000', price: 0, default: true },
    { id: 'red', name: 'Rouge', color: '#ff3333', price: 50 },
    { id: 'blue', name: 'Bleu', color: '#3366ff', price: 50 },
    { id: 'green', name: 'Vert', color: '#33ff66', price: 50 },
    { id: 'purple', name: 'Violet', color: '#9933ff', price: 100 },
    { id: 'orange', name: 'Orange', color: '#ff8833', price: 100 },
    { id: 'cyan', name: 'Cyan', color: '#00ffff', price: 100 },
    { id: 'pink', name: 'Rose', color: '#ff66aa', price: 150 },
    { id: 'gold', name: 'Doré', color: '#ffd700', price: 300 },
    { id: 'rainbow', name: 'Arc-en-ciel', color: 'rainbow', price: 500 },
];

const OBSTACLE_TYPES = {
    LOW: 'low',
    HIGH: 'high',
    MEDIUM: 'medium',
    PLATFORM: 'platform',
    GAP: 'gap',
};
