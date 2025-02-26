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

// District name normalization
const districtNormalizations = {
    'Landkreis': 'LK',
    'Kreisfreie Stadt': 'SK',
    'Stadt': 'SK',
    // Add more normalizations as needed
};

function normalizeDistrict(district) {
    let normalized = district;
    
    // Remove common prefixes
    for (const [pattern, replacement] of Object.entries(districtNormalizations)) {
        const regex = new RegExp(`^${pattern}\\s+`, 'i');
        normalized = normalized.replace(regex, `${replacement} `);
    }
    
    // Remove special characters and extra spaces
    normalized = normalized
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    
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

export const landkreisToKJP = {
    "SK Dresden": [
        {
            name: "Klinik und Poliklinik für Kinder- und Jugendpsychiatrie und -psychotherapie, Universitätsklinikum Dresden",
            address: "Schubertstraße 42, 01307 Dresden",
            phone: "0351 458-2044",
            website: "https://www.uniklinikum-dresden.de/de/das-klinikum/kliniken-polikliniken-institute/kjp",
            coordinates: [51.0504, 13.7595]
        }
    ],
    "SK Berlin": [
        {
            name: "Charité - Klinik für Psychiatrie, Psychosomatik und Psychotherapie des Kindes- und Jugendalters",
            address: "Augustenburger Platz 1, 13353 Berlin",
            phone: "030 450 566 111",
            website: "https://kjp.charite.de",
            coordinates: [52.5429, 13.3401]
        }
    ],
    // ... more KJPs
};

export async function getDistrictFromPostcode(postcode) {
    try {
        // Check cache first
        const cachedResult = cache.get(postcode);
        if (cachedResult) {
            console.log('Cache hit for:', postcode);
            return cachedResult;
        }

        // Wait for rate limiter
        await rateLimiter.waitForNext();

        // Make API request with proper User-Agent
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
        
        if (data && data[0]) {
            const address = data[0].display_name;
            const parts = address.split(', ');
            const district = parts[parts.length - 3];
            
            // Normalize district name
            const normalizedDistrict = normalizeDistrict(district);
            
            // Cache the result
            cache.set(postcode, normalizedDistrict);
            
            return normalizedDistrict;
        }
        return null;
    } catch (error) {
        console.error('Error fetching district:', error);
        return null;
    }
}

// Export cache for testing/debugging
export const debugCache = cache; 