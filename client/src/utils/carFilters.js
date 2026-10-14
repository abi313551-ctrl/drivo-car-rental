export const DEFAULT_FILTERS = { q: '', category: '', fuel: '', transmission: '', seats: '', location: '', maxPrice: null, availableOnly: false };

export function filterCars(cars, f) {
  const q = f.q.trim().toLowerCase();
  return cars.filter((c) =>
    (!q || `${c.brand} ${c.model}`.toLowerCase().includes(q)) &&
    (!f.category || c.category === f.category) &&
    (!f.fuel || c.fuel === f.fuel) &&
    (!f.transmission || c.transmission === f.transmission) &&
    (!f.seats || c.seats === Number(f.seats)) &&
    (!f.location || c.location === f.location) &&
    (f.maxPrice == null || c.pricePerDay <= f.maxPrice) &&
    (!f.availableOnly || (c.available && !c.isPeriodConflict && c.isAvailableForPeriod !== false))
  );
}

export function sortCars(cars, sort) {
  const list = [...cars];
  const by = {
    popularity: (a, b) => b.popularity - a.popularity,
    'price-asc': (a, b) => a.pricePerDay - b.pricePerDay,
    'price-desc': (a, b) => b.pricePerDay - a.pricePerDay,
    rating: (a, b) => b.rating - a.rating || b.popularity - a.popularity,
  };
  return list.sort(by[sort] || by.popularity);
}

export function activeFilterCount(f) {
  return ['q', 'category', 'fuel', 'transmission', 'seats', 'location'].filter((k) => f[k]).length + (f.maxPrice != null ? 1 : 0) + (f.availableOnly ? 1 : 0);
}
