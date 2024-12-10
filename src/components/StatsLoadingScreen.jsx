import React, { useState, useEffect } from 'react';

const StatsLoadingScreen = () => {
  // Use useState to store the random stat
  const [randomStat] = useState(() => {
    const statistics = [
      {
        text: 'Only about 15% of textiles are recycled in the United States.',
        source: 'EPA, Facts and Figures 2021'
      },
      {
        text: 'Americans generate approximately 16 million tons of textile waste annually.',
        source: 'EPA, Facts and Figures 2021'
      },
      {
        text: 'About 85% of textile waste (about 13.6 million tons) ends up in landfills.',
        source: 'EPA, Facts and Figures 2021'
      },
      {
        text: 'Some textiles can take 200+ years to decompose in landfills.',
        source: 'EPA, Environmental Impact Research'
      },
      {
        text: 'The average consumer today buys 60% more clothing items than 15 years ago, and keeps them half as long.',
        source: 'World Resources Institute'
      },
      {
        text: 'Only 2.5 million tons of textiles were recycled in 2018.',
        source: 'EPA, Facts and Figures 2021'
      },
      {
        text: 'The recycling rate for textiles dropped from 14.7% in 2017 to 13% in 2018.',
        source: 'EPA, Facts and Figures 2021'
      }
    ];
    
    // Get one random statistic only once when component mounts
    return statistics[Math.floor(Math.random() * statistics.length)];
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false); // Set loading to false after 4 seconds
    }, 4000); // 4000 milliseconds = 4 seconds

    return () => clearTimeout(timer); // Cleanup the timer on unmount
  }, []);

  // Ensure loading is displayed for at least 4 seconds
  useEffect(() => {
    const minLoadingTime = 4000; // Minimum loading time in milliseconds
    const startTime = Date.now();

    const checkLoadingDuration = setInterval(() => {
      if (loading && (Date.now() - startTime) >= minLoadingTime) {
        setLoading(false);
        clearInterval(checkLoadingDuration);
      }
    }, 100); // Check every 100 milliseconds

    return () => clearInterval(checkLoadingDuration); // Cleanup on unmount
  }, [loading]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-white p-8">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 mb-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
          <div className="max-w-md text-center space-y-4">
            <p className="text-lg text-gray-800 font-medium">
              {randomStat.text}
            </p>
            <p className="text-sm text-gray-500 italic">
              Source: {randomStat.source}
            </p>
          </div>
          <p className="mt-8 text-sm text-gray-500">Loading recycling locations...</p>
        </div>
      </div>
    );
  }

  // Return the main content of your component here after loading
  return (
    <div>
      {/* Your main content goes here */}
    </div>
  );
};

export default StatsLoadingScreen;