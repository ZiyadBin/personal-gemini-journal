import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  X,
  Navigation,
  Search,
  Check,
  Trash2,
  AlertCircle,
  Loader2,
  Building,
} from "lucide-react";
import { JournalLocation } from "../types";

interface LocationPickerModalProps {
  isOpen: boolean;
  currentLocation?: JournalLocation | null;
  onSelectLocation: (loc: JournalLocation) => void;
  onRemoveLocation: () => void;
  onClose: () => void;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  currentLocation,
  onSelectLocation,
  onRemoveLocation,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { placeName: string; latitude: number; longitude: number }[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<JournalLocation | null>(
    currentLocation || null
  );
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedLocation(currentLocation || null);
      setSearchQuery("");
      setSearchResults([]);
      setGeoError(null);
      setIsLocating(false);
    }
  }, [isOpen, currentLocation]);

  if (!isOpen) return null;

  // Search places via Nominatim OpenStreetMap (free, no API key required)
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setGeoError(null);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            trimmed
          )}&limit=5&addressdetails=1`,
          {
            headers: {
              "Accept-Language": "en",
            },
          }
        );
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        const results = (data || []).map((item: any) => {
          // Construct a concise, readable place title
          const name = item.name || item.display_name.split(",")[0];
          const city =
            item.address?.city ||
            item.address?.town ||
            item.address?.village ||
            item.address?.county ||
            "";
          const country = item.address?.country || "";
          const parts = [name, city, country].filter(Boolean);
          const uniqueParts = Array.from(new Set(parts));

          return {
            placeName: uniqueParts.slice(0, 2).join(", ") || item.display_name.split(",").slice(0, 2).join(","),
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
          };
        });
        setSearchResults(results);
      } catch (err) {
        console.error("Place search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 450);
  };

  // PRIVACY RULE: Only request geolocation upon explicit user click!
  const handleUseCurrentLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        let detectedName = `Location (${lat.toFixed(2)}, ${lon.toFixed(2)})`;

        // Attempt reverse geocode to get a human-readable city/place name
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3500);

          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14`,
            {
              headers: { "Accept-Language": "en" },
              signal: controller.signal,
            }
          );
          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            const address = data.address || {};
            const neighborhood = address.neighbourhood || address.suburb || address.quarter;
            const city = address.city || address.town || address.village || address.municipality;
            const stateOrCountry = address.state || address.country;

            const components = [neighborhood, city, stateOrCountry].filter(Boolean);
            if (components.length > 0) {
              detectedName = components.slice(0, 2).join(", ");
            } else if (data.name) {
              detectedName = data.name;
            }
          }
        } catch {
          // Fall back to coordinate description if offline/interrupted
        } finally {
          setIsLocating(false);
          setSelectedLocation({
            placeName: detectedName,
            latitude: lat,
            longitude: lon,
          });
        }
      },
      (err) => {
        setIsLocating(false);
        console.warn("Geolocation prompt was not granted or failed:", err);
        if (err.code === 1) {
          setGeoError("Location access was denied. You can search or type any place below.");
        } else if (err.code === 2) {
          setGeoError("Location unavailable. You can search or type any place below.");
        } else {
          setGeoError("Could not retrieve current location. You can search or type any place below.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const handleApplyCustomName = (customName: string) => {
    const trimmed = customName.trim();
    if (!trimmed) return;
    setSelectedLocation({
      placeName: trimmed,
      latitude: selectedLocation?.latitude ?? null,
      longitude: selectedLocation?.longitude ?? null,
    });
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleConfirm = () => {
    if (selectedLocation && selectedLocation.placeName.trim()) {
      onSelectLocation({
        placeName: selectedLocation.placeName.trim(),
        latitude: selectedLocation.latitude ?? null,
        longitude: selectedLocation.longitude ?? null,
      });
      onClose();
    }
  };

  const handleRemove = () => {
    onRemoveLocation();
    onClose();
  };

  return (
    <div
      id="location-picker-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200 font-sans"
      onClick={onClose}
    >
      <div
        id="location-picker-modal-card"
        className="w-full max-w-lg bg-white rounded-2xl border border-[#e9e6f0] shadow-2xl overflow-hidden flex flex-col text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e9e6f0] flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold font-heading text-slate-900">
                {currentLocation ? "Reflection Location" : "Add Location"}
              </h3>
              <p className="text-xs text-slate-500 font-sans">
                Keep place context with your private reflection
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Option A: Use Current Location (Zero background tracking, explicit click only) */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80">
            <button
              id="use-current-location-btn"
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-white hover:bg-emerald-50 text-slate-800 hover:text-emerald-800 border border-slate-200/90 text-xs font-medium transition cursor-pointer shadow-2xs disabled:opacity-60"
            >
              {isLocating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  <span>Locating your current position...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Use Current Location</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-slate-500 text-center mt-2 leading-relaxed">
              ReflectAI only accesses your GPS coordinates when you click this button.
            </p>
          </div>

          {/* Geo error banner */}
          {geoError && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{geoError}</span>
            </div>
          )}

          {/* Option B: Place Search */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Or search for a city, landmark, or venue
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                id="location-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    e.preventDefault();
                    handleApplyCustomName(searchQuery.trim());
                  }
                }}
                placeholder="e.g. Kyoto, Central Park, Cafe Grumpy, Kyoto Bamboo Grove..."
                className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white"
              />
              {isSearching && (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400 absolute right-3 top-2.5" />
              )}
            </div>

            {/* Quick action: use custom typed text */}
            {searchQuery.trim() && (
              <button
                type="button"
                onClick={() => handleApplyCustomName(searchQuery.trim())}
                className="mt-1.5 text-left w-full px-3 py-1.5 text-xs text-emerald-700 hover:bg-emerald-50 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Use custom place name: &ldquo;<strong>{searchQuery.trim()}</strong>&rdquo;</span>
              </button>
            )}

            {/* Search results list */}
            {searchResults.length > 0 && (
              <div className="mt-2 border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white overflow-hidden shadow-xs">
                {searchResults.map((result, idx) => (
                  <button
                    key={`${result.placeName}-${idx}`}
                    type="button"
                    onClick={() => {
                      setSelectedLocation(result);
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs hover:bg-emerald-50 transition flex items-center justify-between text-slate-800 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{result.placeName}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">Select</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Currently Selected Location Preview Card */}
          {selectedLocation && (
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-emerald-700 tracking-wider">
                      Selected Location
                    </span>
                    <input
                      type="text"
                      value={selectedLocation.placeName}
                      onChange={(e) =>
                        setSelectedLocation({
                          ...selectedLocation,
                          placeName: e.target.value,
                        })
                      }
                      className="text-xs font-semibold text-slate-900 bg-transparent border-b border-emerald-300 focus:outline-none focus:border-emerald-600 w-full mt-0.5"
                      title="Click to customize place name"
                    />
                    {typeof selectedLocation.latitude === "number" &&
                      typeof selectedLocation.longitude === "number" && (
                        <p className="text-[10px] text-emerald-600 mt-1">
                          GPS: {selectedLocation.latitude.toFixed(4)},{" "}
                          {selectedLocation.longitude.toFixed(4)}
                        </p>
                      )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedLocation(null)}
                  className="text-emerald-700 hover:text-rose-600 text-xs p-1"
                  title="Clear selection"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-[#e9e6f0] bg-slate-50/70 flex items-center justify-between gap-2">
          {/* Left: Remove location option if entry already had one */}
          {currentLocation ? (
            <button
              id="remove-location-btn"
              type="button"
              onClick={handleRemove}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Location</span>
            </button>
          ) : (
            <div />
          )}

          {/* Right: Cancel & Confirm */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="confirm-location-btn"
              type="button"
              onClick={handleConfirm}
              disabled={!selectedLocation || !selectedLocation.placeName.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium transition disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Confirm Location</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
