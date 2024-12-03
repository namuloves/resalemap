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
        
        return {
          id: columns[0],
          type: columns[1].toLowerCase(),
          name: columns[2],
          address: columns[3],
          city: columns[4],
          state: columns[5],
          zip: columns[6],
          lat: parseFloat(columns[7]),
          lng: parseFloat(columns[8]),
          website: columns[9] || '',
          acceptancePolicy: columns[10] || ''
        };
        console.log('Parsed location:', location); // Add this
        return location;
      });
    } catch (error) {
      console.error('Error fetching locations:', error);
      return [];
    }
  }