/**
 * Username Generator Utility
 * 
 * Generates random, playful, and unique usernames
 * Format: [adjective][noun][number]
 * Example: HappyPanda42, SwiftFalcon88, BraveWolf23
 */

const adjectives = [
    'Happy', 'Swift', 'Brave', 'Clever', 'Mighty', 'Noble', 'Wise', 'Bold',
    'Bright', 'Calm', 'Daring', 'Eager', 'Fierce', 'Gentle', 'Jolly', 'Keen',
    'Lively', 'Merry', 'Quick', 'Silent', 'Witty', 'Zesty', 'Agile', 'Cosmic',
    'Dynamic', 'Epic', 'Funky', 'Golden', 'Heroic', 'Iconic', 'Jazzy', 'Lucky',
    'Magic', 'Nifty', 'Omega', 'Prime', 'Quantum', 'Rapid', 'Stellar', 'Turbo',
    'Ultra', 'Vivid', 'Wild', 'Zen', 'Alpha', 'Beta', 'Cool', 'Dope', 'Elite',
    'Fresh', 'Grand', 'Hyper', 'Ideal', 'Jumbo', 'Kool', 'Lunar', 'Mega', 'Neo'
];

const nouns = [
    'Panda', 'Falcon', 'Wolf', 'Tiger', 'Eagle', 'Lion', 'Bear', 'Fox',
    'Hawk', 'Shark', 'Dragon', 'Phoenix', 'Raven', 'Cobra', 'Panther', 'Lynx',
    'Jaguar', 'Cheetah', 'Leopard', 'Viper', 'Raptor', 'Condor', 'Owl', 'Orca',
    'Rhino', 'Bison', 'Moose', 'Stallion', 'Mustang', 'Thunder', 'Storm', 'Blaze',
    'Frost', 'Shadow', 'Spirit', 'Ghost', 'Ninja', 'Samurai', 'Knight', 'Warrior',
    'Ranger', 'Hunter', 'Scout', 'Pilot', 'Racer', 'Rider', 'Voyager', 'Explorer',
    'Seeker', 'Finder', 'Keeper', 'Guardian', 'Defender', 'Champion', 'Hero', 'Legend'
];

/**
 * Generate a random username
 * @returns {string} Random username in format: adjectivenoun## (all lowercase)
 */
function generateUsername() {
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 100); // 0-99
    
    return `${adjective}${noun}${number}`.toLowerCase();
}

/**
 * Generate a unique username by checking against existing usernames
 * @param {Function} checkExists - Async function that checks if username exists
 * @param {number} maxAttempts - Maximum number of generation attempts (default: 10)
 * @returns {Promise<string>} Unique username
 */
async function generateUniqueUsername(checkExists, maxAttempts = 10) {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
        const username = generateUsername();
        const exists = await checkExists(username);
        
        if (!exists) {
            return username;
        }
        
        attempts++;
    }
    
    // If we couldn't generate a unique username after maxAttempts,
    // append a timestamp to ensure uniqueness
    const timestamp = Date.now().toString().slice(-6);
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    
    return `${adjective}${noun}${timestamp}`.toLowerCase();
}

module.exports = {
    generateUsername,
    generateUniqueUsername
};
