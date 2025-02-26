import { landkreisToKJP } from './kjp-facilities.js';

// Cache implementation
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

class PostcodeCache {
    constructor() {
        this.cache = new Map();
        this.loadFromLocalStorage();
    }

    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('plz-cache');
            if (saved) {
                const { data, timestamp } = JSON.parse(saved);
                if (Date.now() - timestamp < CACHE_DURATION) {
                    this.cache = new Map(Object.entries(data));
                }
            }
        } catch (error) {
            console.warn('Failed to load cache:', error);
        }
    }

    saveToLocalStorage() {
        try {
            const data = Object.fromEntries(this.cache);
            localStorage.setItem('plz-cache', JSON.stringify({
                data,
                timestamp: Date.now()
            }));
        } catch (error) {
            console.warn('Failed to save cache:', error);
        }
    }

    get(key) {
        return this.cache.get(key);
    }

    set(key, value) {
        this.cache.set(key, value);
        this.saveToLocalStorage();
    }

    delete(key) {
        this.cache.delete(key);
        this.saveToLocalStorage();
    }

    getAllEntries() {
        return Array.from(this.cache.entries()).map(([key, value]) => ({
            postcode: key,
            ...value
        }));
    }
}

// Rate limiter implementation
class RateLimiter {
    constructor(limit = 1000) { // 1 second minimum between requests
        this.limit = limit;
        this.lastRequest = 0;
    }

    async waitForNext() {
        const now = Date.now();
        const timeToWait = this.lastRequest + this.limit - now;
        
        if (timeToWait > 0) {
            await new Promise(resolve => setTimeout(resolve, timeToWait));
        }
        
        this.lastRequest = Date.now();
    }
}

// Enhanced district normalizations
const districtNormalizations = {
    'Kreisfreie Stadt': 'SK',
    'Stadt': 'SK',
    'Landkreis': 'LK',
    'Kreis': 'LK'
};

function normalizeDistrict(district) {
    let normalized = district;
    
    // First try to match known patterns
    for (const [pattern, replacement] of Object.entries(districtNormalizations)) {
        const regex = new RegExp(`^${pattern}\\s+(.+)$`, 'i');
        const match = normalized.match(regex);
        if (match) {
            return `${replacement} ${match[1]}`;
        }
    }
    
    // If no pattern matched, assume it's a Landkreis
    if (!normalized.startsWith('SK ') && !normalized.startsWith('LK ')) {
        normalized = `LK ${normalized}`;
    }
    
    return normalized;
}

// Initialize singletons
const cache = new PostcodeCache();
const rateLimiter = new RateLimiter();

export const plzToLandkreis = {
    // This is a sample - we'll expand this with complete data
    "01067": "SK Dresden",
    "01069": "SK Dresden",
    "10115": "SK Berlin",
    "20095": "SK Hamburg",
    "80331": "SK München",
    // ... more mappings
};

export async function getDistrictFromPostcode(postcode, forceRefresh = false) {
    try {
        // Check cache first (unless force refresh)
        const cachedResult = !forceRefresh && cache.get(postcode);
        if (cachedResult) {
            // Validate cached data
            if (cachedResult.rawResponse && cachedResult.rawResponse.length > 0) {
                console.log('Cache hit for:', postcode);
                return {
                    district: cachedResult.district,
                    debug: { 
                        source: 'cache',
                        ...cachedResult
                    }
                };
            } else {
                // Invalid cache data, remove it
                cache.delete(postcode);
            }
        }

        // Wait for rate limiter
        await rateLimiter.waitForNext();

        // Make API request
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?postalcode=${postcode}&country=DE&format=json`,
            {
                headers: {
                    'User-Agent': 'KJP-Finder/1.0 (https://github.com/your-username/your-repo)'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data || data.length === 0) {
            if (!forceRefresh) {
                return getDistrictFromPostcode(postcode, true);
            }
            throw new Error('No results found');
        }

        const result = data[0];
        const address = result.display_name;
        const parts = address.split(', ');
        
        // Extract and normalize district name
        const district = parts[parts.length - 3];
        const normalizedDistrict = normalizeDistrict(district);
        
        const resultData = {
            district: normalizedDistrict,
            name: parts.slice(0, -2).join(', '), // Concatenate location names
            rawResponse: data,
            fullAddress: address,
            boundingbox: result.boundingbox
        };
        
        // Cache the result
        cache.set(postcode, resultData);
        
        return {
            ...resultData,
            debug: {
                source: 'api',
                ...resultData
            }
        };
    } catch (error) {
        console.error('Error fetching district:', error);
        return {
            district: null,
            debug: {
                source: 'error',
                error: error.message
            }
        };
    }
}

// Export cache for testing/debugging
export const debugCache = cache; 