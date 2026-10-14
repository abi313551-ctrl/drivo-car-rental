import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, Heart, IndianRupee, User, Car, Shield, LogOut, Plus, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { useCars } from '../context/CarContext.jsx';
import { useBookings } from '../context/BookingContext.jsx';
import CarCard from '../components/CarCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { formatINR } from '../utils/pricing.js';
import { locations } from '../data/homeContent.js';

export default function Dashboard() {
  const { user, isAuthenticated, isAdmin, updateProfile, logout } = useAuth();
  const { cars, favoriteCars, toggleCarAvailability, addCar } = useCars();
  const { bookings } = useBookings();
  const [tab, setTab] = useState('overview');

  const [profile, setProfile] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    license: user?.license || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [newCar, setNewCar] = useState({
    brand: '',
    model: '',
    year: 2024,
    category: 'SUV',
    fuel: 'Petrol',
    transmission: 'Automatic',
    seats: 5,
    pricePerDay: 3000,
    deposit: 5000,
    location: 'Coimbatore',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=70',
  });
  const [addingCar, setAddingCar] = useState(false);

  const myBookings = useMemo(() => {
    if (!user) return bookings;
    if (isAdmin) return bookings;
    return bookings.filter(
      (b) =>
        b.userId === user.id ||
        b.customer?.email?.toLowerCase() === user.email.toLowerCase() ||
        !b.userId
    );
  }, [bookings, user, isAdmin]);

  const stats = useMemo(() => {
    const active = myBookings.filter((b) => b.status === 'Confirmed');
    const totalSpent = active.reduce((sum, b) => sum + (b.pricing?.total || 0), 0);
    return {
      totalBookings: myBookings.length,
      activeBookings: active.length,
      favoritesCount: favoriteCars.length,
      totalSpent,
    };
  }, [myBookings, favoriteCars]);

  if (!isAuthenticated) {
    return (
      <div className="container-x py-16">
        <div className="mx-auto max-w-xl rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-card">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent-soft text-accent">
            <User size={26} />
          </span>
          <h1 className="mt-4 text-2xl font-extrabold">Sign in to view your dashboard</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Track your car bookings, manage saved favorites, and keep your driver profile ready for instant checkout.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/login" className="btn-primary">Log in</Link>
            <Link to="/register" className="btn-outline">Create account</Link>
            <Link to="/my-bookings" className="btn-outline">Guest bookings</Link>
          </div>
        </div>
      </div>
    );
  }

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profile.fullName.trim() || profile.fullName.trim().length < 3) {
      toast.error('Full name must be at least 3 characters');
      return;
    }
    setSavingProfile(true);
    try {
      await updateProfile(profile);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message || 'Could not update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddCar = async (e) => {
    e.preventDefault();
    if (!newCar.brand.trim() || !newCar.model.trim()) {
      toast.error('Enter car brand and model');
      return;
    }
    setAddingCar(true);
    try {
      await addCar({
        ...newCar,
        year: Number(newCar.year),
        seats: Number(newCar.seats),
        pricePerDay: Number(newCar.pricePerDay),
        deposit: Number(newCar.deposit),
      });
      toast.success(`${newCar.brand} ${newCar.model} added to fleet!`);
      setNewCar((c) => ({ ...c, brand: '', model: '' }));
    } catch (err) {
      toast.error(err.message || 'Could not add car');
    } finally {
      setAddingCar(false);
    }
  };

  return (
    <div className="container-x py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="heading">Welcome, {user.fullName}</h1>
            {isAdmin && (
              <span className="inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1 text-xs font-bold text-white">
                <Shield size={12} /> Admin
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-neutral-600">{user.email} · Manage your rentals, favorites, and account settings.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/cars" className="btn-primary">Book a car</Link>
          <button onClick={logout} className="btn-outline"><LogOut size={16} /> Log out</button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Bookings</span>
            <CalendarCheck size={18} className="text-accent" />
          </div>
          <p className="mt-3 text-3xl font-extrabold">{stats.totalBookings}</p>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-bold uppercase tracking-wider">Active Trips</span>
            <Car size={18} className="text-green-600" />
          </div>
          <p className="mt-3 text-3xl font-extrabold">{stats.activeBookings}</p>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-bold uppercase tracking-wider">Saved Cars</span>
            <Heart size={18} className="text-red-500" />
          </div>
          <p className="mt-3 text-3xl font-extrabold">{stats.favoritesCount}</p>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-bold uppercase tracking-wider">{isAdmin ? 'Fleet Revenue' : 'Total Spend'}</span>
            <IndianRupee size={18} className="text-accent" />
          </div>
          <p className="mt-3 text-3xl font-extrabold">{formatINR(stats.totalSpent)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex flex-wrap gap-2 border-b border-neutral-200 pb-4">
        {[
          ['overview', 'Recent Bookings'],
          ['favorites', `Favorites (${favoriteCars.length})`],
          ['profile', 'Profile Settings'],
          ...(isAdmin ? [['fleet', `Manage Fleet (${cars.length})`]] : []),
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === key ? 'bg-ink text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {tab === 'overview' && (
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{isAdmin ? 'All Customer Bookings' : 'Your Recent Bookings'}</h2>
              <Link to="/my-bookings" className="text-sm font-semibold text-accent hover:underline">View all</Link>
            </div>
            {myBookings.length === 0 ? (
              <p className="mt-4 text-sm text-neutral-500">No bookings yet. Browse our fleet to book your first trip.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 text-xs uppercase text-neutral-500">
                      <th className="pb-3 pr-4">Ref</th>
                      <th className="pb-3 pr-4">Car</th>
                      <th className="pb-3 pr-4">Pickup</th>
                      <th className="pb-3 pr-4">Total</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3 pr-4">Payment</th>
                      <th className="pb-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {myBookings.slice(0, 8).map((b) => (
                      <tr key={b.ref}>
                        <td className="py-3.5 pr-4 font-mono text-xs font-bold">{b.ref}</td>
                        <td className="py-3.5 pr-4 font-semibold">{b.car?.brand} {b.car?.model}</td>
                        <td className="py-3.5 pr-4 text-xs text-neutral-600">{b.pickup}</td>
                        <td className="py-3.5 pr-4 font-bold">{formatINR(b.pricing?.total)}</td>
                        <td className="py-3.5 pr-4"><StatusBadge status={b.status} /></td>
                        <td className="py-3.5 pr-4"><StatusBadge status={b.paymentStatus} /></td>
                        <td className="py-3.5">
                          <Link to={`/booking/confirmation/${b.ref}`} className="font-semibold text-accent hover:underline">View</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'favorites' && (
          <div>
            {favoriteCars.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-neutral-300 py-14 text-center">
                <p className="font-bold">No favorite cars saved</p>
                <Link to="/cars" className="btn-dark mt-4">Explore fleet</Link>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {favoriteCars.map((c) => <CarCard key={c.id} car={c} />)}
              </div>
            )}
          </div>
        )}

        {tab === 'profile' && (
          <form onSubmit={handleProfileSave} className="max-w-xl rounded-3xl border border-neutral-200 bg-white p-6 shadow-card space-y-4">
            <h2 className="text-lg font-bold">Driver profile settings</h2>
            <div>
              <label htmlFor="prof-name" className="mb-1 block text-xs font-semibold text-neutral-600">Full Name</label>
              <input id="prof-name" className="field" value={profile.fullName} onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="prof-email" className="mb-1 block text-xs font-semibold text-neutral-600">Email (read-only)</label>
              <input id="prof-email" className="field bg-neutral-100 text-neutral-500" value={user.email} disabled />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="prof-phone" className="mb-1 block text-xs font-semibold text-neutral-600">Phone number</label>
                <input id="prof-phone" className="field" value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} placeholder="9876543210" />
              </div>
              <div>
                <label htmlFor="prof-lic" className="mb-1 block text-xs font-semibold text-neutral-600">Driving Licence</label>
                <input id="prof-lic" className="field uppercase" value={profile.license} onChange={(e) => setProfile((p) => ({ ...p, license: e.target.value }))} placeholder="TN37 20190012345" />
              </div>
            </div>
            <button type="submit" disabled={savingProfile} className="btn-primary">
              {savingProfile ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        )}

        {tab === 'fleet' && isAdmin && (
          <div className="grid gap-8 lg:grid-cols-3">
            <form onSubmit={handleAddCar} className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-card space-y-4 self-start">
              <h2 className="flex items-center gap-2 text-lg font-bold"><Plus size={18} /> Add Car to Fleet</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-neutral-600">Brand</label>
                  <input className="field" placeholder="Toyota" value={newCar.brand} onChange={(e) => setNewCar((c) => ({ ...c, brand: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-neutral-600">Model</label>
                  <input className="field" placeholder="Fortuner" value={newCar.model} onChange={(e) => setNewCar((c) => ({ ...c, model: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-neutral-600">Category</label>
                  <select className="field" value={newCar.category} onChange={(e) => setNewCar((c) => ({ ...c, category: e.target.value }))}>
                    {['Hatchback', 'Sedan', 'SUV', 'Electric', 'Luxury'].map((cat) => <option key={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-neutral-600">Location</label>
                  <select className="field" value={newCar.location} onChange={(e) => setNewCar((c) => ({ ...c, location: e.target.value }))}>
                    {locations.map((loc) => <option key={loc}>{loc}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-neutral-600">Fuel</label>
                  <select className="field" value={newCar.fuel} onChange={(e) => setNewCar((c) => ({ ...c, fuel: e.target.value }))}>
                    {['Petrol', 'Diesel', 'Electric'].map((f) => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-neutral-600">Transmission</label>
                  <select className="field" value={newCar.transmission} onChange={(e) => setNewCar((c) => ({ ...c, transmission: e.target.value }))}>
                    {['Automatic', 'Manual'].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-neutral-600">Price / day (₹)</label>
                  <input type="number" className="field" value={newCar.pricePerDay} onChange={(e) => setNewCar((c) => ({ ...c, pricePerDay: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-neutral-600">Seats</label>
                  <input type="number" className="field" value={newCar.seats} onChange={(e) => setNewCar((c) => ({ ...c, seats: e.target.value }))} />
                </div>
              </div>
              <button type="submit" disabled={addingCar} className="btn-primary w-full">
                {addingCar ? 'Adding...' : 'Add vehicle'}
              </button>
            </form>

            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-card lg:col-span-2">
              <h2 className="text-lg font-bold">Fleet Vehicles ({cars.length})</h2>
              <div className="mt-4 divide-y divide-neutral-100">
                {cars.map((c) => (
                  <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-bold">{c.brand} {c.model} <span className="text-xs font-normal text-neutral-500">({c.location})</span></p>
                      <p className="text-xs text-neutral-500">{c.category} · {c.fuel} · {formatINR(c.pricePerDay)}/day</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleCarAvailability(c.id, !c.available)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition ${
                        c.available ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {c.available ? <><CheckCircle2 size={13} /> Available</> : <><XCircle size={13} /> Unavailable</>}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
