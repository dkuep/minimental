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