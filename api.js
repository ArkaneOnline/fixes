/**
 * Geometry Dash Level Tracker API
 * 
 * Usage:
 *   const api = new GDLevelAPI();
 *   api.getLevelByName('Stereo Madness').then(level => console.log(level));
 *   api.getLevelById(1).then(level => console.log(level));
 */

class GDLevelAPI {
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl;
        this.cache = null;
        this.cacheTime = null;
        this.cacheDuration = 5 * 60 * 1000; // 5 minutes cache
    }

    /**
     * Load all levels data (with caching)
     */
    async loadLevels() {
        // Return cached data if still valid
        if (this.cache && this.cacheTime && (Date.now() - this.cacheTime) < this.cacheDuration) {
            return this.cache;
        }

        try {
            const response = await fetch(`${this.baseUrl}levels.json`);
            if (!response.ok) {
                throw new Error(`Failed to load levels: ${response.status}`);
            }
            const data = await response.json();
            this.cache = data;
            this.cacheTime = Date.now();
            return data;
        } catch (error) {
            throw new Error(`Error loading levels data: ${error.message}`);
        }
    }

    /**
     * Get a level by name (case-insensitive, partial match)
     * @param {string} name - Level name to search for
     * @returns {Promise<Object|null>} Level object or null if not found
     */
    async getLevelByName(name) {
        if (!name || typeof name !== 'string') {
            throw new Error('Level name must be a non-empty string');
        }

        const levels = await this.loadLevels();
        const searchName = name.toLowerCase().trim();
        
        return levels.find(level => 
            level.name.toLowerCase().includes(searchName)
        ) || null;
    }

    /**
     * Get a level by exact name match (case-insensitive)
     * @param {string} name - Exact level name
     * @returns {Promise<Object|null>} Level object or null if not found
     */
    async getLevelByExactName(name) {
        if (!name || typeof name !== 'string') {
            throw new Error('Level name must be a non-empty string');
        }

        const levels = await this.loadLevels();
        const searchName = name.toLowerCase().trim();
        
        return levels.find(level => 
            level.name.toLowerCase() === searchName
        ) || null;
    }

    /**
     * Get a level by ID
     * @param {number} id - Level ID
     * @returns {Promise<Object|null>} Level object or null if not found
     */
    async getLevelById(id) {
        if (typeof id !== 'number' || isNaN(id)) {
            throw new Error('Level ID must be a number');
        }

        const levels = await this.loadLevels();
        return levels.find(level => level.id === id) || null;
    }

    /**
     * Search levels by query (searches name, creator, description)
     * @param {string} query - Search query
     * @returns {Promise<Array>} Array of matching levels
     */
    async searchLevels(query) {
        if (!query || typeof query !== 'string') {
            throw new Error('Search query must be a non-empty string');
        }

        const levels = await this.loadLevels();
        const lowerQuery = query.toLowerCase().trim();
        
        return levels.filter(level => {
            return (
                level.name.toLowerCase().includes(lowerQuery) ||
                level.creator.toLowerCase().includes(lowerQuery) ||
                (level.description && level.description.toLowerCase().includes(lowerQuery)) ||
                level.id.toString().includes(lowerQuery)
            );
        });
    }

    /**
     * Get all levels
     * @returns {Promise<Array>} Array of all levels
     */
    async getAllLevels() {
        return await this.loadLevels();
    }

    /**
     * Clear the cache
     */
    clearCache() {
        this.cache = null;
        this.cacheTime = null;
    }
}

// Export for use in modules or make available globally
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GDLevelAPI;
}

