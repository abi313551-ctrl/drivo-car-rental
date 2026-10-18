import React from 'react';
import {
  X,
  XCircle,
  UploadCloud,
  Image as ImageIcon,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { resolveImageUrl } from '../../utils/imageUrl.js';

export default function AddEditCarModal({
  show,
  editingCar,
  carForm,
  setCarForm,
  onClose,
  onSave,
  savingCar,
  uploadingImage,
  imageMode,
  setImageMode,
  fileInputRef,
  selectedFile,
  previewUrl,
  isDragging,
  handleFileSelect,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleRemoveFile,
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white border border-slate-200 text-[#0A142F] p-6 shadow-2xl sm:p-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="font-heading text-lg font-black text-[#0A142F]">
              {editingCar ? `Edit Vehicle: ${editingCar.brand} ${editingCar.model}` : 'Add Vehicle to Fleet'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter vehicle specifications and upload a high-resolution car photograph.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSave} className="mt-6 space-y-4">
          {/* Row 1: Car Name & Brand & Model & Registration */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="font-mono text-xs font-bold text-slate-700">Display Name</label>
              <input
                type="text"
                value={carForm.name || (carForm.brand && carForm.model ? `${carForm.brand} ${carForm.model}` : '')}
                onChange={(e) => {
                  const val = e.target.value;
                  const parts = val.trim().split(' ');
                  setCarForm({
                    ...carForm,
                    name: val,
                    brand: parts[0] || carForm.brand,
                    model: parts.slice(1).join(' ') || carForm.model,
                  });
                }}
                className="field mt-1 text-xs"
                placeholder="e.g. Hyundai Creta"
              />
            </div>
            <div>
              <label className="font-mono text-xs font-bold text-slate-700">Brand *</label>
              <input
                type="text"
                required
                value={carForm.brand}
                onChange={(e) =>
                  setCarForm({
                    ...carForm,
                    brand: e.target.value,
                    name: `${e.target.value} ${carForm.model}`.trim(),
                  })
                }
                className="field mt-1 text-xs"
                placeholder="e.g. Hyundai"
              />
            </div>
            <div>
              <label className="font-mono text-xs font-bold text-slate-700">Model *</label>
              <input
                type="text"
                required
                value={carForm.model}
                onChange={(e) =>
                  setCarForm({
                    ...carForm,
                    model: e.target.value,
                    name: `${carForm.brand} ${e.target.value}`.trim(),
                  })
                }
                className="field mt-1 text-xs"
                placeholder="e.g. Creta"
              />
            </div>
            <div>
              <label className="font-mono text-xs font-bold text-slate-700">Reg. Number (TN)</label>
              <input
                type="text"
                value={carForm.registrationNumber}
                onChange={(e) =>
                  setCarForm({
                    ...carForm,
                    registrationNumber: e.target.value.toUpperCase(),
                  })
                }
                className="field mt-1 text-xs font-mono font-bold uppercase tracking-wider"
                placeholder="TN-74-E-1001"
              />
            </div>
          </div>

          {/* Row 2: Category, Powertrain, Transmission */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-mono text-xs font-bold text-slate-700">Category</label>
              <select
                value={carForm.category}
                onChange={(e) => setCarForm({ ...carForm, category: e.target.value })}
                className="field mt-1 text-xs"
              >
                {['SUV', 'Sedan', 'Hatchback', 'MUV / MPV', 'Luxury', 'Electric Vehicles'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-mono text-xs font-bold text-slate-700">Powertrain</label>
              <select
                value={carForm.fuel}
                onChange={(e) => setCarForm({ ...carForm, fuel: e.target.value })}
                className="field mt-1 text-xs"
              >
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
              </select>
            </div>
            <div>
              <label className="font-mono text-xs font-bold text-slate-700">Transmission</label>
              <select
                value={carForm.transmission}
                onChange={(e) => setCarForm({ ...carForm, transmission: e.target.value })}
                className="field mt-1 text-xs"
              >
                <option value="Automatic">Automatic</option>
                <option value="Manual">Manual</option>
              </select>
            </div>
          </div>

          {/* Row 3: Year, Seats, Daily Rate, Security Deposit */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="font-mono text-xs font-bold text-slate-700">Year</label>
              <input
                type="number"
                value={carForm.year}
                onChange={(e) => setCarForm({ ...carForm, year: e.target.value })}
                className="field mt-1 text-xs font-mono"
              />
            </div>
            <div>
              <label className="font-mono text-xs font-bold text-slate-700">Seats</label>
              <input
                type="number"
                value={carForm.seats}
                onChange={(e) => setCarForm({ ...carForm, seats: e.target.value })}
                className="field mt-1 text-xs font-mono"
              />
            </div>
            <div>
              <label className="font-mono text-xs font-bold text-slate-700">Daily Rate (₹)</label>
              <input
                type="number"
                value={carForm.pricePerDay}
                onChange={(e) => setCarForm({ ...carForm, pricePerDay: e.target.value })}
                className="field mt-1 text-xs font-mono font-bold text-blue-700"
              />
            </div>
            <div>
              <label className="font-mono text-xs font-bold text-slate-700">Deposit (₹)</label>
              <input
                type="number"
                value={carForm.deposit}
                onChange={(e) => setCarForm({ ...carForm, deposit: e.target.value })}
                className="field mt-1 text-xs font-mono"
              />
            </div>
          </div>

          {/* Row 4: Kanniyakumari Hub */}
          <div>
            <label className="font-mono text-xs font-bold text-slate-700">
              Kanniyakumari Station Hub *
            </label>
            <select
              value={carForm.location}
              onChange={(e) => setCarForm({ ...carForm, location: e.target.value })}
              className="field mt-1 text-xs"
            >
              {[
                'Nagercoil',
                'Kanyakumari',
                'Marthandam',
                'Kuzhithurai',
                'Colachel',
                'Thuckalay',
                'Padmanabhapuram',
                'Karungal',
                'Kulasekharam',
                'Suchindram',
                'Eraniel',
                'Boothapandi',
                'Thiruvattar',
                'Killiyoor',
              ].map((loc) => (
                <option key={loc} value={loc}>
                  {loc} Hub (Kanniyakumari District)
                </option>
              ))}
            </select>
          </div>

          {/* UPLOAD CAR IMAGE & LIVE PREVIEW ZONE */}
          <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between">
              <label className="font-mono text-xs font-bold text-[#0A142F] flex items-center gap-1.5">
                <ImageIcon size={14} className="text-blue-600" />
                Vehicle Photography Media <span className="text-rose-500">*</span>
              </label>
              <div className="flex rounded-lg bg-slate-200/80 p-0.5 text-[11px] font-semibold border border-slate-200">
                <button
                  type="button"
                  onClick={() => setImageMode('upload')}
                  className={`rounded-md px-2.5 py-0.5 transition font-mono ${
                    imageMode === 'upload'
                      ? 'bg-white text-[#0A142F] shadow font-bold'
                      : 'text-slate-600 hover:text-[#0A142F]'
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode('url')}
                  className={`rounded-md px-2.5 py-0.5 transition font-mono ${
                    imageMode === 'url'
                      ? 'bg-white text-[#0A142F] shadow font-bold'
                      : 'text-slate-600 hover:text-[#0A142F]'
                  }`}
                >
                  Image URL
                </button>
              </div>
            </div>

            {imageMode === 'upload' ? (
              <div className="space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  className="hidden"
                />

                {/* Preview Box */}
                {previewUrl || (editingCar && editingCar.image) ? (
                  <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="h-24 w-36 shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-200">
                        <img
                          src={previewUrl || resolveImageUrl(editingCar?.image)}
                          alt="Car Preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                              selectedFile
                                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                                : 'bg-slate-100 border border-slate-200 text-slate-600'
                            }`}
                          >
                            {selectedFile ? 'New Image Selected' : 'Current Saved Asset'}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs font-bold text-[#0A142F]">
                          {selectedFile
                            ? selectedFile.name
                            : editingCar
                            ? `${editingCar.brand} ${editingCar.model}`
                            : 'Vehicle Image'}
                        </p>
                        {selectedFile && (
                          <p className="font-mono text-[11px] text-slate-500">
                            Size: {(selectedFile.size / 1024).toFixed(0)} KB · Type:{' '}
                            {selectedFile.type.split('/')[1]?.toUpperCase()}
                          </p>
                        )}
                        <div className="mt-2.5 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="btn-outline px-2.5 py-1 text-[11px] flex items-center gap-1 text-slate-700 hover:text-[#0A142F]"
                          >
                            <UploadCloud size={13} />{' '}
                            {selectedFile ? 'Change File' : 'Upload Replacement'}
                          </button>
                          {selectedFile && (
                            <button
                              type="button"
                              onClick={handleRemoveFile}
                              className="rounded-lg px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 transition"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Drag & Drop Upload Zone */
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${
                      isDragging
                        ? 'border-blue-600 bg-blue-50/80 scale-[1.01]'
                        : 'border-slate-300 bg-white hover:border-blue-600 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600 group-hover:scale-110 transition shadow-2xs">
                      <UploadCloud size={24} />
                    </div>
                    <p className="mt-2 text-xs font-bold text-[#0A142F]">
                      {isDragging ? 'Drop vehicle image here...' : 'Click to Upload or Drag & Drop'}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      JPG, PNG, or WEBP (Saved locally in server/uploads/cars)
                    </p>
                    <span className="btn-outline mt-3 px-3 py-1 text-xs pointer-events-none text-slate-700">
                      Browse Files
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <input
                  type="url"
                  value={carForm.image}
                  onChange={(e) => setCarForm({ ...carForm, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="field text-xs"
                />
                {carForm.image && (
                  <div className="mt-2 h-20 w-32 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    <img
                      src={resolveImageUrl(carForm.image)}
                      alt="URL preview"
                      className="h-full w-full object-cover"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="font-mono text-xs font-bold text-slate-700">Vehicle Description</label>
            <textarea
              rows={2}
              value={carForm.description}
              onChange={(e) => setCarForm({ ...carForm, description: e.target.value })}
              className="field mt-1 text-xs"
              placeholder="Enter vehicle features, condition notes, or rental instructions..."
            />
          </div>

          {/* Available Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="car-available"
              checked={carForm.available}
              onChange={(e) => setCarForm({ ...carForm, available: e.target.checked })}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
            <label htmlFor="car-available" className="text-xs font-bold text-[#0A142F] cursor-pointer">
              Mark vehicle as Available for immediate booking
            </label>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline text-xs text-slate-700 hover:text-[#0A142F]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingCar || uploadingImage}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              {uploadingImage
                ? 'Uploading Image...'
                : savingCar
                ? 'Saving to Database...'
                : editingCar
                ? 'Save Vehicle Changes'
                : 'Add to Fleet Catalog'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
