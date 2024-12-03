import React, { useState, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { fetchLocations } from './locationData';
import * as mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';

mapboxgl.accessToken = 'pk.eyJ1Ijoid2F0ZXJmYWlyeSIsImEiOiJjbTQ3Z3QzeG0wNWd6Mm1wc3lsanZvaXQzIn0.N9XcupyXEwtQYGC50FCTng';

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in miles
}

const LocationMap = () => {
  const [selectedType, setSelectedType] = useState('all');
  const [map, setMap] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const mapContainer = useRef(null);
  const [markers, setMarkers] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [nearestLocation, setNearestLocation] = useState(null);
  const userMarkerRef = useRef(null);

  // Fetch locations from Google Sheets
  useEffect(() => {
    async function loadLocations() {
      try {
        const data = await fetchLocations();
        console.log('Loaded locations:', data);
        setLocations(data);

        // debug logs //
        console.log('All locations:', data);
        console.log('Types:', [...new Set(data.map(loc => loc.type))]);
        console.log('Thrift stores:', data.filter(loc => loc.type.toLowerCase() === 'thrift').length);
        console.log('Goodwill:', data.filter(loc => loc.type.toLowerCase() === 'goodwill').length);

      } catch (error) {
        console.error('Error loading locations:', error);
      } finally {
        setLoading(false);
      }
    }
    loadLocations();
  }, []);

  const filteredLocations = selectedType === 'all' 
    ? locations 
    : locations.filter(loc => loc.type.toLowerCase() === selectedType.toLowerCase());

  const getMarkerColor = (type) => {
    switch(type.toLowerCase()) {
      case 'bin': return 'text-blue-500';
      case 'goodwill': return 'text-green-500';
      case 'thrift': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const findNearestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        setUserLocation({ lat: userLat, lng: userLng });

        // Remove existing user marker if it exists
        if (userMarkerRef.current) {
          userMarkerRef.current.remove();
        }

        // Find nearest location
        let nearest = locations[0];
        let minDistance = calculateDistance(userLat, userLng, nearest.lat, nearest.lng);

        locations.forEach(location => {
          const distance = calculateDistance(userLat, userLng, location.lat, location.lng);
          if (distance < minDistance) {
            minDistance = distance;
            nearest = location;
          }
        });

        setNearestLocation({...nearest, distance: minDistance.toFixed(1)});

        // Center map on user location and add marker
        if (map) {
          // Add marker for user location
          userMarkerRef.current = new mapboxgl.Marker({ color: '#FF0000' })
            .setLngLat([userLng, userLat])
            .setPopup(new mapboxgl.Popup().setHTML('Your Location'))
            .addTo(map);

          // Fit bounds to show both user location and nearest location
          const bounds = new mapboxgl.LngLatBounds()
            .extend([userLng, userLat])
            .extend([nearest.lng, nearest.lat]);

          map.fitBounds(bounds, {
            padding: 100
          });
        }
      }, null, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      });
    } else {
      alert("Geolocation is not supported by your browser");
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !locations.length) return;

    let mapInstance = null;

    const initMap = () => {
      if (!mapContainer.current) return;

      mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [-73.9544, 40.6789],
        zoom: 12
      });

      mapInstance.on('load', () => {
        mapInstance.addControl(new mapboxgl.NavigationControl());
        setMap(mapInstance);
      });
    };

    initMap();

    return () => {
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, [locations]);

  // Handle markers
  useEffect(() => {
    if (!map || !locations.length) return;

    // Clear existing markers
    markers.forEach(marker => marker.remove());
    const newMarkers = [];

    filteredLocations.forEach(location => {
      const marker = new mapboxgl.Marker({
        color: location.type.toLowerCase() === 'bin' ? '#3B82F6' : 
               location.type.toLowerCase() === 'goodwill' ? '#22C55E' : '#EF4444'
      })
      .setLngLat([location.lng, location.lat])
      .setPopup(new mapboxgl.Popup().setHTML(
        `<h3 class="font-bold">${location.name}</h3>
         <p>${location.address}, ${location.city}, ${location.state} ${location.zip}</p>
         <p class="text-sm mt-1">
          ${getPolicyBadge(location.acceptancePolicy)}
         </p>
         ${location.website ? `<a href="${location.website}" target="_blank" class="text-blue-500">Website</a>` : ''}`
      ))
      .addTo(map);
      
      newMarkers.push(marker);
    });

    // Fit bounds to show all markers
    if (newMarkers.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      filteredLocations.forEach(location => {
        bounds.extend([location.lng, location.lat]);
      });

      map.fitBounds(bounds, {
        padding: 50,
        duration: 0
      });
    }

    setMarkers(newMarkers);

    return () => {
      newMarkers.forEach(marker => marker.remove());
    };
  }, [map, locations, selectedType]);

  if (loading) {
    return <div className="w-full h-screen flex items-center justify-center">Loading locations...</div>;
  }

  return (
    <div className="w-full h-screen flex flex-col">
      <div className="p-4 bg-white shadow-md">
        <div className="flex gap-4 items-center">
          <button 
            className={`px-4 py-2 rounded ${selectedType === 'all' ? 'bg-gray-200' : 'bg-white'}`}
            onClick={() => setSelectedType('all')}
          >
            All Locations
          </button>
          <button 
            className={`px-4 py-2 rounded ${selectedType === 'bin' ? 'bg-gray-200' : 'bg-white'}`}
            onClick={() => setSelectedType('bin')}
          >
            Donation Bins
          </button>
          <button 
            className={`px-4 py-2 rounded ${selectedType === 'goodwill' ? 'bg-gray-200' : 'bg-white'}`}
            onClick={() => setSelectedType('goodwill')}
          >
            Goodwill
          </button>
          <button 
            className={`px-4 py-2 rounded ${selectedType === 'thrift' ? 'bg-gray-200' : 'bg-white'}`}
            onClick={() => setSelectedType('thrift')}
          >
            Thrift Stores
          </button>
          <button 
            className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
            onClick={findNearestLocation}
          >
            Find Nearest Location
          </button>
        </div>
      </div>

      <div className="flex-1 relative">
        <div className="absolute bottom-4 right-4 z-10 bg-white p-4 rounded shadow-md">
          <h3 className="font-heading font-bold mb-2">Category</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="text-blue-500" size={16} />
              <span>Donation Bins</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="text-green-500" size={16} />
              <span>Goodwill</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="text-red-500" size={16} />
              <span>Thrift Stores</span>
            </div>
          </div>
        </div>

        <div className="absolute left-4 top-4 z-10 bg-white p-4 rounded shadow-md w-72">
          <h3 className="font-bold mb-2">Locations ({filteredLocations.length})</h3>
          <div className="space-y-3">
            {filteredLocations.map(location => (
              <div key={location.id} className="border-b pb-2">
                <div className="flex items-start gap-2">
                  <MapPin className={`${getMarkerColor(location.type)}`} size={24} />
                  <div>
                    <h4 className="font-semibold">{location.name}</h4>
                    <p className="font-body text-sm">
                      {location.address}, {location.city}, {location.state} {location.zip}
                    </p>
                    {location.website && (
                      <a 
                        href={location.website} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-sm text-blue-500 hover:underline"
                      >
                        Website
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {nearestLocation && (
          <div className="absolute left-4 bottom-4 z-10 bg-white p-4 rounded shadow-md w-72">
            <h3 className="font-bold mb-2">Nearest Location</h3>
            <div className="flex items-start gap-2">
              <MapPin className={getMarkerColor(nearestLocation.type)} size={24} />
              <div>
                <h4 className="font-semibold">{nearestLocation.name}</h4>
                <p className="text-sm text-gray-600">
                  {nearestLocation.address}, {nearestLocation.city}, {nearestLocation.state} {nearestLocation.zip}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  {nearestLocation.distance} miles away
                </p>
              </div>
            </div>
          </div>
        )}

        <div ref={mapContainer} className="w-full h-full map-container" />
      </div>
    </div>
  );
};

export default LocationMap;