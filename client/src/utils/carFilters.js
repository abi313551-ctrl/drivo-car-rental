export const DEFAULT_FILTERS = {
  q: '',
  category: '',
  fuel: '',
  transmission: '',
  seats: '',
  location: '',
  minPrice: null,
  maxPrice: null,
  availableOnly: false,
};

export function filterCars(cars, f) {
  const q = (f.q || '').trim().toLowerCase();
  const searchTerms = q ? q.split(/\s+/).filter(Boolean) : [];

  return cars.filter((c) => {
    if (searchTerms.length > 0) {
      const target = `${c.brand || ''} ${c.model || ''} ${c.category || ''}`.toLowerCase();
      const matchesAll = searchTerms.every((term) => target.includes(term));
      if (!matchesAll) return false;
    }
    if (f.category && c.category !== f.category) return false;
    if (f.fuel && c.fuel !== f.fuel) return false;
    if (f.transmission && c.transmission !== f.transmission) return false;
    if (f.seats && c.seats !== Number(f.seats)) return false;
    if (f.location && c.location !== f.location) return false;
    if (f.minPrice != null && c.pricePerDay < f.minPrice) return false;
    if (f.maxPrice != null && c.pricePerDay > f.maxPrice) return false;
    if (f.availableOnly && (!c.available || c.isPeriodConflict || c.isAvailableForPeriod === false)) return false;
    return true;
  });
}

export function sortCars(cars, sort) {
  const list = [...cars];
  const by = {
    popularity: (a, b) => (b.popularity || 0) - (a.popularity || 0),
    'price-asc': (a, b) => a.pricePerDay - b.pricePerDay,
    'price-desc': (a, b) => b.pricePerDay - a.pricePerDay,
    rating: (a, b) => (b.rating || 0) - (a.rating || 0) || (b.popularity || 0) - (a.popularity || 0),
  };
  return list.sort(by[sort] || by.popularity);
}

export function activeFilterCount(f) {
  return ['q', 'category', 'fuel', 'transmission', 'seats', 'location'].filter((k) => Boolean(f[k])).length
    + (f.minPrice != null ? 1 : 0)
    + (f.maxPrice != null ? 1 : 0)
    + (f.availableOnly ? 1 : 0);
}
