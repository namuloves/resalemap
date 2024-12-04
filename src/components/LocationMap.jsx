import React, { useState, useEffect, useRef } from 'react';
import { MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchLocations } from './locationData';
import * as mapboxgl from 'mapbox-gl';

// ... keep existing mapboxgl setup and helper functions ...

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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const locationsPerPage = 8;

  // ... keep existing useEffect for fetching locations ...

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

  // ... keep existing helper functions and map initialization code ...

  if (loading) {
    return <div className="w-full h-screen flex items-center justify-center">Loading locations...</div>;
  }

  return (
    <div className="w-full h-screen flex flex-col">
      {/* Keep existing header with filter buttons */}
      <div className="p-4 bg-white shadow-md">
        <div className="flex gap-4 items-center">
          <button 
            className={`px-4 py-2 rounded ${selectedType === 'all' ? 'bg-gray-200' : 'bg-white'}`}
            onClick={() => {
              setSelectedType('all');
              setCurrentPage(1);
            }}
          >
            All Locations
          </button>
          <button 
            className={`px-4 py-2 rounded ${selectedType === 'bin' ? 'bg-gray-200' : 'bg-white'}`}
            onClick={() => {
              setSelectedType('bin');
              setCurrentPage(1);
            }}
          >
            Donation Bins
          </button>
          <button 
            className={`px-4 py-2 rounded ${selectedType === 'goodwill' ? 'bg-gray-200' : 'bg-white'}`}
            onClick={() => {
              setSelectedType('goodwill');
              setCurrentPage(1);
            }}
          >
            Goodwill
          </button>
          <button 
            className={`px-4 py-2 rounded ${selectedType === 'thrift' ? 'bg-gray-200' : 'bg-white'}`}
            onClick={() => {
              setSelectedType('thrift');
              setCurrentPage(1);
            }}
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
        {/* Keep existing legend */}
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

        {/* Modified locations list with pagination */}
        <div className="absolute left-4 top-4 z-10 bg-white p-4 rounded shadow-md w-72">
          <h3 className="font-bold mb-2">
            Locations ({filteredLocations.length})
          </h3>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {currentLocations.map(location => (
              <div key={location.id} className="border-b pb-2">
                <div className="flex items-start gap-2">
                  <MapPin className={getMarkerColor(location.type)} size={24} />
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

          {/* Pagination controls */}
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

        {/* Keep existing nearest location display */}
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