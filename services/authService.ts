
import { UserProfile } from '../types';

const DB_USERS_KEY = 'klutch_db_users_v1';
const SESSION_KEY = 'klutch_current_session_v1';

interface UserAccount extends UserProfile {
  passwordHash: string; // Simple simulation
}

// Helper to simulate DB delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const authService = {
  // --- REGISTER ---
  async register(username: string, email: string, password: string): Promise<boolean> {
    await delay(800); // Fake network delay

    const users = JSON.parse(localStorage.getItem(DB_USERS_KEY) || '[]');
    
    // Uniqueness Check
    const exists = users.some((u: UserAccount) => 
      u.username.toLowerCase() === username.toLowerCase() || 
      u.email.toLowerCase() === email.toLowerCase()
    );

    if (exists) {
      throw new Error('DUPLICATE_ENTRY');
    }

    // Create New User
    const newUser: UserAccount = {
      username,
      email,
      passwordHash: btoa(password), // Simple encoding (NOT REAL SECURITY, just for demo)
      level: 1,
      xp: 0,
      credits: 0,
      joinedAt: new Date().toISOString(),
      rankTitle: 'Neophyte',
      stats: { kills: 0, wins: 0, losses: 0, hoursPlayed: 0, gamesAnalyzed: 0 },
      customization: { isRGBName: false, avatarBorder: 'none', themeColor: 'cyan' }
    };

    users.push(newUser);
    localStorage.setItem(DB_USERS_KEY, JSON.stringify(users));
    return true;
  },

  // --- LOGIN ---
  async login(identifier: string, password: string): Promise<UserAccount> {
    await delay(1000);
    
    const users = JSON.parse(localStorage.getItem(DB_USERS_KEY) || '[]');
    const encodedPass = btoa(password);

    const user = users.find((u: UserAccount) => 
      (u.email.toLowerCase() === identifier.toLowerCase() || u.username.toLowerCase() === identifier.toLowerCase()) &&
      u.passwordHash === encodedPass
    );

    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }

    // Set Session
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  },

  // --- LOGOUT ---
  logout() {
    localStorage.removeItem(SESSION_KEY);
    // We do NOT clear DB_USERS_KEY, preserving the database
  },

  // --- FORGOT PASSWORD ---
  async forgotPassword(email: string): Promise<boolean> {
    await delay(1500);
    const users = JSON.parse(localStorage.getItem(DB_USERS_KEY) || '[]');
    const user = users.find((u: UserAccount) => u.email.toLowerCase() === email.toLowerCase());
    
    if (user) {
      // Logic to send email would go here.
      // For demo, we just return true to show the success message.
      return true;
    } else {
      // Security best practice: Don't reveal if email exists, but for this demo we can return false if we want strict checking
      return false; 
    }
  },

  // --- GET CURRENT SESSION ---
  getCurrentUser(): UserProfile | null {
    const session = localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
  },

  // --- UPDATE CURRENT USER DATA ---
  updateUser(updatedProfile: UserProfile) {
    // Update Session
    localStorage.setItem(SESSION_KEY, JSON.stringify(updatedProfile));

    // Update Database
    const users = JSON.parse(localStorage.getItem(DB_USERS_KEY) || '[]');
    const index = users.findIndex((u: UserAccount) => u.username === updatedProfile.username);
    
    if (index !== -1) {
      // Merge updates while keeping passwordHash
      users[index] = { ...users[index], ...updatedProfile };
      localStorage.setItem(DB_USERS_KEY, JSON.stringify(users));
    }
  }
};
