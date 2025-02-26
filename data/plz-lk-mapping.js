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
        const response = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${postcode}&country=DE&format=json`);
        const data = await response.json();
        
        if (data && data[0]) {
            // Extract district info from address
            const address = data[0].display_name;
            const parts = address.split(', ');
            // Usually the district is the second-to-last part before the country
            const district = parts[parts.length - 3];
            return district;
        }
        return null;
    } catch (error) {
        console.error('Error fetching district:', error);
        return null;
    }
} 