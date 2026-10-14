const pool = [
  { name: 'Priya Raman', rating: 5, date: '2026-08-14', text: 'Clean car, on-time handover, and the price matched the estimate.' },
  { name: 'Arjun Mehta', rating: 4, date: '2026-07-29', text: 'Drove well on the highway. Returning it was quick.' },
  { name: 'Sneha Iyer', rating: 5, date: '2026-07-02', text: 'Comfortable for a family weekend trip. Would book again.' },
  { name: 'Karthik Subramanian', rating: 4, date: '2026-06-18', text: 'Good condition overall. The pickup point was easy to find.' },
  { name: 'Fatima Khan', rating: 5, date: '2026-05-30', text: 'Smooth experience from booking to return.' },
  { name: 'Rohit Nair', rating: 4, date: '2026-05-11', text: 'Great value for the day rate. Fuel tank was full at pickup.' },
];

// Sample reviews: 3 per car, picked deterministically from the pool.
export const getReviews = (carId) =>
  [0, 1, 2].map((i) => ({ id: `${carId}-${i}`, ...pool[(carId + i) % pool.length] }));
