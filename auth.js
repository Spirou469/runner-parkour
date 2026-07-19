// Supabase Auth Integration
class AuthManager {
    constructor() {
        this.supabase = null;
        this.session = null;
        this.user = null;
        this.playerData = null;
        this.unlockedSkins = ['black'];
        this.equippedSkin = 'black';
        this.totalCoins = 0;
    }

    async init() {
        this.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        const { data: { session } } = await this.supabase.auth.getSession();
        if (session) {
            this.session = session;
            this.user = session.user;
            await this.loadPlayerData();
            return true;
        }
        
        this.supabase.auth.onAuthStateChange((event, session) => {
            this.session = session;
            this.user = session?.user || null;
            if (session) {
                this.loadPlayerData();
            }
        });
        
        return false;
    }

    async signUp(email, password) {
        try {
            const { data, error } = await this.supabase.auth.signUp({
                email: email,
                password: password,
            });
            
            if (error) throw error;
            
            if (data.user) {
                await this.createPlayerRecord(data.user.id);
            }
            
            return { success: true, message: 'Inscription réussie ! Vérifiez votre email.' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async signIn(email, password) {
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });
            
            if (error) throw error;
            
            this.session = data.session;
            this.user = data.user;
            await this.loadPlayerData();
            
            return { success: true, message: 'Connexion réussie !' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async signOut() {
        await this.supabase.auth.signOut();
        this.session = null;
        this.user = null;
        this.playerData = null;
        this.unlockedSkins = ['black'];
        this.equippedSkin = 'black';
        this.totalCoins = 0;
    }

    async createPlayerRecord(userId) {
        try {
            const { error } = await this.supabase
                .from('players')
                .insert([
                    { user_id: userId, total_coins: 0, equipped_skin: 'black' }
                ]);
            
            if (error) throw error;
        } catch (error) {
            console.error('Error creating player record:', error);
        }
    }

    async loadPlayerData() {
        if (!this.user) return;
        
        try {
            const { data: playerData, error: playerError } = await this.supabase
                .from('players')
                .select('*')
                .eq('user_id', this.user.id)
                .single();
            
            if (playerError && playerError.code !== 'PGRST116') {
                console.error('Error loading player data:', playerError);
                return;
            }
            
            if (playerData) {
                this.playerData = playerData;
                this.totalCoins = playerData.total_coins || 0;
                this.equippedSkin = playerData.equipped_skin || 'black';
            } else {
                await this.createPlayerRecord(this.user.id);
                this.totalCoins = 0;
                this.equippedSkin = 'black';
            }
            
            const { data: skinsData, error: skinsError } = await this.supabase
                .from('player_skins')
                .select('skin_id')
                .eq('user_id', this.user.id);
            
            if (skinsError) {
                console.error('Error loading skins:', skinsError);
                return;
            }
            
            this.unlockedSkins = ['black'];
            if (skinsData) {
                skinsData.forEach(s => {
                    if (!this.unlockedSkins.includes(s.skin_id)) {
                        this.unlockedSkins.push(s.skin_id);
                    }
                });
            }
            
        } catch (error) {
            console.error('Error loading player data:', error);
        }
    }

    async updateCoins(coinsEarned) {
        if (!this.user) return false;
        
        try {
            this.totalCoins += coinsEarned;
            
            const { error } = await this.supabase
                .from('players')
                .update({ total_coins: this.totalCoins })
                .eq('user_id', this.user.id);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error updating coins:', error);
            return false;
        }
    }

    async buySkin(skinId) {
        if (!this.user) return { success: false, message: 'Non connecté' };
        
        const skin = SKINS.find(s => s.id === skinId);
        if (!skin) return { success: false, message: 'Skin inconnu' };
        
        if (this.unlockedSkins.includes(skinId)) {
            return { success: false, message: 'Skin déjà débloqué' };
        }
        
        if (this.totalCoins < skin.price) {
            return { success: false, message: 'Pas assez de pièces' };
        }
        
        try {
            this.totalCoins -= skin.price;
            
            const { error: updateError } = await this.supabase
                .from('players')
                .update({ total_coins: this.totalCoins })
                .eq('user_id', this.user.id);
            
            if (updateError) throw updateError;
            
            const { error: skinError } = await this.supabase
                .from('player_skins')
                .insert([
                    { user_id: this.user.id, skin_id: skinId }
                ]);
            
            if (skinError) throw skinError;
            
            this.unlockedSkins.push(skinId);
            
            return { success: true, message: 'Skin acheté !' };
        } catch (error) {
            console.error('Error buying skin:', error);
            return { success: false, message: error.message };
        }
    }

    async equipSkin(skinId) {
        if (!this.user) return false;
        if (!this.unlockedSkins.includes(skinId)) return false;
        
        try {
            this.equippedSkin = skinId;
            
            const { error } = await this.supabase
                .from('players')
                .update({ equipped_skin: skinId })
                .eq('user_id', this.user.id);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error equipping skin:', error);
            return false;
        }
    }

    async saveScore(distance) {
        if (!this.user) return false;
        
        try {
            const { error } = await this.supabase
                .from('leaderboard')
                .insert([
                    { user_id: this.user.id, distance: distance, level: game.level }
                ]);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error saving score:', error);
            return false;
        }
    }

    async getLeaderboard() {
        try {
            const { data, error } = await this.supabase
                .from('leaderboard')
                .select('distance, level, created_at, user_id')
                .order('distance', { ascending: false })
                .limit(20);
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting leaderboard:', error);
            return [];
        }
    }

    isAuthenticated() {
        return !!this.session && !!this.user;
    }
}
