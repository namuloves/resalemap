export async function fetchLocations() {
    const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTvqNmdc5PvqJpb80q-ZyAs7qUFbINPLAcM6uUG3q963mwb2BICCdrFu8jCtB1S5b-v4zOKXn8gU8dg/pub?output=csv';
  
    try {
      const response = await fetch(SHEET_URL);
      const csvText = await response.text();
      console.log('Raw CSV data:', csvText);
    
      // Split into rows and remove empty rows
      const rows = csvText.split('\n').filter(row => row.trim());
    
      // Skip header row and process data
      return rows.slice(1).map(row => {
        const columns = row.split(',').map(col => col.trim());
        
        // Validate coordinates first
        const lat = parseFloat(columns[7]);
        const lng = parseFloat(columns[8]);
        
        if (isNaN(lat) || isNaN(lng)) {
          console.warn(`Invalid coordinates for location: ${columns[2] || 'Unknown'}`);
          return null;
        }
    
        // Validate required fields exist
        if (!columns[0] || !columns[2] || !columns[3]) {
          console.warn(`Missing required fields for location: ${columns[2] || 'Unknown'}`);
          return null;
        }
    
        const parsedLocation = {
          id: columns[0],
          type: (columns[1] || '').toLowerCase(),
          name: columns[2],
          address: columns[3],
          city: columns[4] || '',
          state: columns[5] || '',
          zip: columns[6] || '',
          lat,  // Using already parsed coordinates
          lng,  // Using already parsed coordinates
          website: columns[9] || '',
          acceptancePolicy: columns[10] || ''
        };
    
        console.log('Parsed location:', parsedLocation);
        return parsedLocation;
      }).filter(Boolean); // Remove any null entries from invalid locations
    
    } catch (error) {
      console.error('Error fetching locations:', error);
      return [];
    }
  }