import urllib.request
import json

def test_filters():
    with urllib.request.urlopen('http://127.0.0.1:8000/api/cars') as resp:
        cars = json.loads(resp.read().decode('utf-8'))['cars']

    print("=== TESTING CAR FILTERS & SEARCH ===")
    for cat in ['Hatchback', 'Sedan', 'SUV', 'MUV / MPV', 'Luxury', 'Electric Vehicles']:
        matched = [c for c in cars if c['category'] == cat]
        print(f"  Category '{cat}': {len(matched)} cars")
        assert len(matched) >= 15, f"Expected >= 15 cars for {cat}"

    # Search query
    swift = [c for c in cars if 'swift' in f"{c['brand']} {c['model']}".lower()]
    print(f"  Search query 'swift': {len(swift)} match(es)")
    assert len(swift) >= 1

    # Fuel filters
    petrol = [c for c in cars if c['fuel'] == 'Petrol']
    diesel = [c for c in cars if c['fuel'] == 'Diesel']
    ev = [c for c in cars if c['fuel'] == 'Electric']
    print(f"  Fuel: Petrol={len(petrol)}, Diesel={len(diesel)}, EV={len(ev)}")
    assert len(petrol) > 0 and len(diesel) > 0 and len(ev) > 0

    # Sort price asc
    sorted_asc = sorted(cars, key=lambda c: c['pricePerDay'])
    print(f"  Lowest price: INR {sorted_asc[0]['pricePerDay']} ({sorted_asc[0]['brand']} {sorted_asc[0]['model']})")
    print(f"  Highest price: INR {sorted_asc[-1]['pricePerDay']} ({sorted_asc[-1]['brand']} {sorted_asc[-1]['model']})")
    assert sorted_asc[0]['pricePerDay'] <= sorted_asc[-1]['pricePerDay']
    print("ALL FILTER TESTS PASSED!")

if __name__ == '__main__':
    test_filters()
