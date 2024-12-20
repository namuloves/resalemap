import React, { useState, useEffect, useRef } from 'react';
import { MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchLocations } from './locationData';
import * as mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import StatsLoadingScreen from './StatsLoadingScreen';

mapboxgl.accessToken = 'pk.eyJ1Ijoid2F0ZXJmYWlyeSIsImEiOiJjbTQ3Z3QzeG0wNWd6Mm1wc3lsanZvaXQzIn0.N9XcupyXEwtQYGC50FCTng';
/* 1. Helper Function */
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
function getPolicyBadge(policy) {
  const badges = {
    donation_only: '<span class="bg-green-100 text-green-800 px-2 py-1 rounded">Accepts Donations Only</span>',
    buy_only: '<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded">Buys From Consumers</span>',
    both: '<span class="bg-purple-100 text-purple-800 px-2 py-1 rounded">Accepts Donations & Buys</span>',
    neither: '<span class="bg-gray-100 text-gray-800 px-2 py-1 rounded">No Donation or Buying</span>'
  };
  return badges[policy] || '';
}
/* 2. Main Component */
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
  const [selectedLocation, setSelectedLocation] = useState(null);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const locationsPerPage = 4;

/* 3. Use Effect */
useEffect(() => {
  async function loadLocations() {
    try {
      const data = await fetchLocations();
      console.log('Loaded locations:', data);
      setLocations(data);
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

// Calculate pagination values
const indexOfLastLocation = currentPage * locationsPerPage;
const indexOfFirstLocation = indexOfLastLocation - locationsPerPage;
const currentLocations = filteredLocations.slice(indexOfFirstLocation, indexOfLastLocation);
const totalPages = Math.ceil(filteredLocations.length / locationsPerPage);

const paginate = (pageNumber) => {
  setCurrentPage(pageNumber);
};

const getMarkerColor = (type) => {
  switch(type.toLowerCase()) {
    case 'bin': return 'text-green-500';
    case 'goodwill': return 'text-red-500';
    case 'thrift': return 'text-blue-500';
    default: return 'text-gray-500';
  }
};

const findNearestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        setUserLocation({ lat: userLat, lng: userLng });

        if (userMarkerRef.current) {
          userMarkerRef.current.remove();
        }

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

        if (map) {
          userMarkerRef.current = new mapboxgl.Marker({ color: '#FF0000' })
            .setLngLat([userLng, userLat])
            .setPopup(new mapboxgl.Popup().setHTML('Your Location'))
            .addTo(map);

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

  useEffect(() => {
    if (!mapContainer.current || !locations.length) return;

    let mapInstance = null;

    const initMap = () => {
      if (!mapContainer.current) return;

      mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [-73.9544, 40.6789],
        zoom: 12,
        height: 'window.innerHeight - 60'
      });

      mapInstance.on('load', () => {
        setTimeout(() => {
          mapInstance.resize();
        }, 100);
        
        mapInstance.addControl(new mapboxgl.NavigationControl());
        setMap(mapInstance);
      });
    };
    const resizeObserver = new ResizeObserver(() => {
      if (mapInstance) {
        mapInstance.resize();
      }
    });

    resizeObserver.observe(mapContainer.current);

    initMap();

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, [locations]);

  useEffect(() => {
    if (!map || !locations.length) return;

    markers.forEach(marker => marker.remove());
    const newMarkers = [];

    filteredLocations.forEach(location => {
      if (isNaN(location.lat) || isNaN(location.lng)) {
        console.warn(`Invalid coordinates for location: ${location.name}`);
        return;
      }
      const marker = new mapboxgl.Marker({
        color: location.type.toLowerCase() === 'bin' ? '#47D300' : 
               location.type.toLowerCase() === 'goodwill' ? '#E40004' : '#0379FF'
      })
      .setLngLat([location.lng, location.lat])
      .on('click', () => {
        setSelectedLocation(location); // For mobile popup
      })
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

/* 3. Visual Layout */
  return (
    <>
      {loading ? (
        <StatsLoadingScreen />
      ) : (
        <div className="flex-1 relative">
          <div className="find-nearest-button-container">
          <button 
            className="find-nearest-button bg-blue-500 text-white px-4 py-2"
            onClick={findNearestLocation}
          >
            Find Nearest Location
          </button>
          </div>
          <div className="py-2 p-4 bg-white shadow-sm min-h-[40px]">
            <div className="flex flex gap-4 items-center">
              <div className="filter-box">
                <button 
                  className={`filter-button ${selectedType === 'all' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedType('all');
                    setCurrentPage(1);
                  }}
                >
                  All
                </button>
                <button 
                  className={`filter-button ${selectedType === 'bin' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedType('bin');
                    setCurrentPage(1);
                  }}
                >
                  Donation Bins
                </button>
                <button 
                  className={`filter-button ${selectedType === 'goodwill' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedType('goodwill');
                    setCurrentPage(1);
                  }}
                >
                  Goodwill
                </button>
                <button 
                  className={`filter-button ${selectedType === 'thrift' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedType('thrift');
                    setCurrentPage(1);
                  }}
                >
                  Thrift Stores
                </button>
              </div>
              <div className="centered-div">
                <h2>RECYCLE BABY</h2>
              </div>
            </div>
          </div>
          <div className="absolute left-8 top-24 z-10 bg-white p-4 rounded shadow-md w-72 location-list">
            <h3 className="font-bold mb-2">Locations ({filteredLocations.length})</h3>
            <div className="space-y-3">
              {currentLocations.map(location => (
                <div key={location.id} className="pb-2">
                  <div className="flex items-start gap-2">
                    <MapPin className={getMarkerColor(location.type)} size={24} />
                    <div>
                      <h4 className="font-semibold text-sm">{location.name}</h4>
                      <p className="font-body text-xs">
                        {location.address}, {location.city}, {location.state} {location.zip}
                      </p>
                      {location.website && (
                        <a 
                          href={location.website} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-xs text-blue-500 hover:underline"
                        >
                          Website
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded ${currentPage === 1 ? 'text-gray-400' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <ChevronLeft size={20} />
              </button>
              <div className="text-sm">
                Page {currentPage} of {totalPages}
              </div>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded ${currentPage === totalPages ? 'text-gray-400' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="absolute bottom-4 right-4 z-10 bg-white p-4 rounded shadow-md category-legend">
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
      )}
    </>
  );
};
export default LocationMap;