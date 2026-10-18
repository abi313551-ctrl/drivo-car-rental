import React from 'react';
import {
  Car,
  Search,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  List,
  Grid,
  MapPin,
  Fuel,
  Gauge,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { formatINR } from '../../utils/pricing.js';
import CarImage from '../CarImage.jsx';

export default function FleetTab({
  cars = [],
  filteredCars = [],
  carSearch,
  setCarSearch,
  carCatFilter,
  setCarCatFilter,
  fleetViewMode,
  setFleetViewMode,
  openAddModal,
  openEditModal,
  onDeleteCar,
  toggleCarAvailability,
}) {
  const availableCount = cars.filter((c) => c.available).length;
  const unavailableCount = cars.length - availableCount;

  return (
    <div className="space-y-6">
      {/* TOOLBAR & CONTROLS */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                placeholder="Search by brand, model, plate..."
                value={carSearch}
                onChange={(e) => setCarSearch(e.target.value)}
                className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-9 pr-3 py-2 text-xs text-[#0A142F] focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition outline-none"
              />
            </div>

            <select
              value={carCatFilter}
              onChange={(e) => setCarCatFilter(e.target.value)}
              className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-700 font-semibold focus:bg-white focus:border-blue-500 transition outline-none"
            >
              <option value="all">All Categories</option>
              {['Hatchback', 'Sedan', 'SUV', 'MUV / MPV', 'Luxury', 'Electric Vehicles'].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-slate-600">
              <button
                type="button"
                onClick={() => setFleetViewMode('table')}
                className={`p-1.5 rounded-lg transition ${
                  fleetViewMode === 'table'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'hover:text-[#0A142F]'
                }`}
                title="Table view"
              >
                <List size={16} />
              </button>
              <button
                type="button"
                onClick={() => setFleetViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  fleetViewMode === 'grid'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'hover:text-[#0A142F]'
                }`}
                title="Grid view"
              >
                <Grid size={16} />
              </button>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openAddModal}
              className="btn-primary text-xs px-4 py-2.5 flex items-center gap-2 shadow-md shadow-blue-500/20 font-bold"
            >
              <Plus size={16} />
              <span>Add Vehicle to Fleet</span>
            </button>
          </div>
        </div>

        {/* Fleet KPI Summary Bar */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 font-mono gap-2">
          <div className="flex items-center gap-4">
            <span>
              Showing <strong className="text-[#0A142F]">{filteredCars.length}</strong> of{' '}
              <strong className="text-[#0A142F]">{cars.length}</strong> vehicles
            </span>
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {availableCount} Available
            </span>
            <span className="text-slate-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              {unavailableCount} Unavailable
            </span>
          </div>
          <span className="text-slate-400">Kanniyakumari Hub Distribution</span>
        </div>
      </div>

      {/* TABLE VIEW */}
      {fleetViewMode === 'table' ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 border-b border-slate-200 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="py-3.5 px-4">Vehicle Details</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Specifications</th>
                <th className="py-3.5 px-4">Kanniyakumari Hub</th>
                <th className="py-3.5 px-4">Daily Rate</th>
                <th className="py-3.5 px-4 text-center">Availability Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCars.length > 0 ? (
                filteredCars.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition">
                    {/* Vehicle */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-200 shadow-2xs group relative">
                          <CarImage
                            src={c.image}
                            alt=""
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-[#0A142F]">
                            {c.brand} {c.model}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[10px] text-slate-500">
                              #{c.id} · {c.year}
                            </span>
                            {c.registrationNumber && (
                              <span className="rounded bg-amber-50 border border-amber-300 px-1.5 py-0.2 font-mono text-[10px] font-bold text-amber-900 tracking-wider">
                                {c.registrationNumber}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="rounded-lg bg-blue-50 border border-blue-200/80 px-2.5 py-1 font-mono font-semibold text-[11px] text-blue-700">
                        {c.category}
                      </span>
                    </td>

                    {/* Specs */}
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      <div>
                        {c.fuel} · {c.transmission}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {c.seats} Passenger Seats
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      <div className="flex items-center gap-1">
                        <MapPin size={12} className="text-blue-600 shrink-0" />
                        <span>{c.location || 'Nagercoil'}</span>
                      </div>
                    </td>

                    {/* Rate */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-extrabold text-sm text-blue-700">
                        {formatINR(c.pricePerDay)}/day
                      </div>
                      {c.deposit > 0 && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Deposit: {formatINR(c.deposit)}
                        </div>
                      )}
                    </td>

                    {/* Availability Switch */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => toggleCarAvailability(c.id, !c.available)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] font-bold border transition ${
                          c.available
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                        }`}
                        title="Click to toggle availability"
                      >
                        {c.available ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                        <span>{c.available ? 'Available' : 'Unavailable'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/cars/${c.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-[#0A142F] transition"
                          title="View on customer website"
                        >
                          <Eye size={14} />
                        </a>
                        <button
                          type="button"
                          onClick={() => openEditModal(c)}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-blue-700 transition"
                          title="Edit vehicle"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onDeleteCar({
                              id: c.id,
                              name: `${c.brand} ${c.model}`,
                              registrationNumber: c.registrationNumber,
                            })
                          }
                          className="grid h-8 w-8 place-items-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
                          title="Delete vehicle with safety check"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400 font-mono text-xs">
                    No vehicles found matching current search/filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredCars.map((c) => (
            <div
              key={c.id}
              className="group overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs hover:border-blue-400 hover:shadow-lg transition duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Image Banner */}
                <div className="relative h-44 w-full overflow-hidden bg-slate-100 border-b border-slate-200">
                  <CarImage
                    src={c.image}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Category Pill Floating */}
                  <span className="absolute top-2.5 left-2.5 rounded-md bg-[#0A142F]/80 backdrop-blur-md px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                    {c.category}
                  </span>

                  {/* Availability Pill */}
                  <span
                    className={`absolute top-2.5 right-2.5 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold border backdrop-blur-md ${
                      c.available
                        ? 'bg-emerald-500/90 text-white border-emerald-400'
                        : 'bg-rose-500/90 text-white border-rose-400'
                    }`}
                  >
                    {c.available ? 'Available' : 'Booked'}
                  </span>

                  {/* Daily Rate Floating */}
                  <div className="absolute bottom-2.5 right-2.5 rounded-lg bg-white/95 backdrop-blur-md px-2.5 py-1 shadow-md border border-slate-200">
                    <span className="font-mono font-black text-xs text-blue-700">
                      {formatINR(c.pricePerDay)}
                    </span>
                    <span className="text-[10px] text-slate-500">/day</span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-4 space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-heading font-black text-base text-[#0A142F]">
                        {c.brand} {c.model}
                      </h4>
                      <span className="font-mono text-xs text-slate-400">#{c.id}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-[11px] text-slate-500">{c.year} Model</span>
                      {c.registrationNumber && (
                        <span className="rounded bg-amber-50 border border-amber-300 px-1.5 py-0.2 font-mono text-[10px] font-bold text-amber-900">
                          {c.registrationNumber}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Specs Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-600 font-mono">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5">{c.fuel}</span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5">{c.transmission}</span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5">{c.seats} Seats</span>
                  </div>

                  {/* Location Hub */}
                  <div className="flex items-center gap-1 text-xs text-slate-600">
                    <MapPin size={12} className="text-blue-600 shrink-0" />
                    <span>{c.location || 'Nagercoil Hub'}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 pt-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => toggleCarAvailability(c.id, !c.available)}
                  className={`font-mono text-[11px] font-bold transition flex items-center gap-1 ${
                    c.available ? 'text-emerald-700 hover:underline' : 'text-rose-600 hover:underline'
                  }`}
                >
                  {c.available ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                  <span>{c.available ? 'Toggle Off' : 'Toggle On'}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <a
                    href={`/cars/${c.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-[#0A142F] transition"
                    title="View vehicle on site"
                  >
                    <Eye size={13} />
                  </a>
                  <button
                    type="button"
                    onClick={() => openEditModal(c)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-blue-700 transition"
                    title="Edit vehicle"
                  >
                    <Edit size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onDeleteCar({
                        id: c.id,
                        name: `${c.brand} ${c.model}`,
                        registrationNumber: c.registrationNumber,
                      })
                    }
                    className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
                    title="Delete vehicle"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
