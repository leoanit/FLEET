export const getKenyanTown = (lat: number, lng: number): string => {
  const towns = [
    { name: 'Nairobi', lat: -1.2921, lng: 36.8219 },
    { name: 'Mombasa', lat: -4.0435, lng: 39.6682 },
    { name: 'Nakuru', lat: -0.3030, lng: 36.0800 },
    { name: 'Kisumu', lat: -0.1022, lng: 34.7617 },
    { name: 'Eldoret', lat: 0.5143, lng: 35.2698 },
    { name: 'Thika', lat: -1.0396, lng: 37.0900 },
  ];

  let closestTown = towns[0];
  let minDistance = Infinity;

  for (const town of towns) {
    // Standard Euclidean distance squared is perfectly sufficient for geofencing local hubs
    const distance = Math.pow(lat - town.lat, 2) + Math.pow(lng - town.lng, 2);
    if (distance < minDistance) {
      minDistance = distance;
      closestTown = town;
    }
  }

  return closestTown.name;
};
