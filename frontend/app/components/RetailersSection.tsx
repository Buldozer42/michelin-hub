"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";

const RetailersMap = dynamic(() => import("./RetailersMap"), { ssr: false });

export interface Retailer {
  id: string;
  name: string;
  url: string;
  country: string;
  city: string;
  address: string;
  postalCode: string;
  lat: number;
  lng: number;
}

export const RETAILERS: Retailer[] = [
  { id: "r1", name: "Probikeshop", url: "https://www.probikeshop.fr", country: "FR", city: "Lyon", address: "15 Rue de la Republique", postalCode: "69001", lat: 45.7640, lng: 4.8357 },
  { id: "r2", name: "Alltricks", url: "https://www.alltricks.fr", country: "FR", city: "Paris", address: "42 Boulevard Voltaire", postalCode: "75011", lat: 48.8606, lng: 2.3708 },
  { id: "r3", name: "Materiel-velo.com", url: "https://www.materiel-velo.com", country: "FR", city: "Toulouse", address: "8 Rue Alsace-Lorraine", postalCode: "31000", lat: 43.6047, lng: 1.4442 },
  { id: "r4", name: "Tredz", url: "https://www.tredz.co.uk", country: "UK", city: "Swansea", address: "10 High Street", postalCode: "SA1 1LE", lat: 51.6214, lng: -3.9436 },
  { id: "r5", name: "BikeTart", url: "https://www.biketart.com", country: "UK", city: "Bristol", address: "25 Park Street", postalCode: "BS1 5PG", lat: 51.4545, lng: -2.5879 },
  { id: "r6", name: "Evans Cycles", url: "https://www.evanscycles.com", country: "UK", city: "London", address: "178 Oxford Street", postalCode: "W1D 1NR", lat: 51.5145, lng: -0.1427 },
  { id: "r7", name: "Bike24", url: "https://www.bike24.com", country: "DE", city: "Dresden", address: "Breitscheidstr. 40", postalCode: "01237", lat: 51.0504, lng: 13.7373 },
  { id: "r8", name: "Bike-Components", url: "https://www.bike-components.de", country: "DE", city: "Wuerzburg", address: "Kaiserstr. 12", postalCode: "97070", lat: 49.7913, lng: 9.9534 },
  { id: "r9", name: "Amazon.de", url: "https://www.amazon.de", country: "DE", city: "Munich", address: "Marcel-Breuer-Str. 12", postalCode: "80807", lat: 48.1351, lng: 11.5820 },
  { id: "r10", name: "Deporvillage", url: "https://www.deporvillage.com", country: "ES", city: "Barcelona", address: "Carrer de Mallorca 200", postalCode: "08036", lat: 41.3874, lng: 2.1686 },
  { id: "r11", name: "BikeInn", url: "https://www.bikeinn.com", country: "ES", city: "Girona", address: "Carrer Migdia 37", postalCode: "17003", lat: 41.9794, lng: 2.8214 },
  { id: "r12", name: "FuturumShop", url: "https://www.futurumshop.nl", country: "NL", city: "Amsterdam", address: "Keizersgracht 120", postalCode: "1015 CW", lat: 52.3676, lng: 4.8937 },
  { id: "r13", name: "Lordgun Bicycles", url: "https://www.lordgunbicycles.com", country: "IT", city: "Milan", address: "Via Montenapoleone 8", postalCode: "20121", lat: 45.4642, lng: 9.1900 },
  { id: "r14", name: "Centrum Rowerowe", url: "https://www.centrumrowerowe.pl", country: "PL", city: "Warsaw", address: "ul. Marszalkowska 55", postalCode: "00-676", lat: 52.2297, lng: 21.0122 },
  { id: "r15", name: "Van Eyck Sports", url: "https://www.vaneycksports.be", country: "BE", city: "Herentals", address: "Lierseweg 265", postalCode: "2200", lat: 51.1769, lng: 4.8342 },
];

const COUNTRY_LABELS: Record<string, string> = {
  FR: "France", UK: "Royaume-Uni", DE: "Allemagne", ES: "Espagne",
  IT: "Italie", NL: "Pays-Bas", BE: "Belgique", PL: "Pologne",
};

const COUNTRY_FLAGS: Record<string, string> = {
  FR: "\u{1F1EB}\u{1F1F7}", UK: "\u{1F1EC}\u{1F1E7}", DE: "\u{1F1E9}\u{1F1EA}",
  ES: "\u{1F1EA}\u{1F1F8}", IT: "\u{1F1EE}\u{1F1F9}", NL: "\u{1F1F3}\u{1F1F1}",
  BE: "\u{1F1E7}\u{1F1EA}", PL: "\u{1F1F5}\u{1F1F1}",
};

function groupByCountry(retailers: Retailer[]) {
  const groups: Record<string, Retailer[]> = {};
  for (const r of retailers) {
    if (!groups[r.country]) groups[r.country] = [];
    groups[r.country].push(r);
  }
  return groups;
}

export default function RetailersSection() {
  const grouped = useMemo(() => groupByCountry(RETAILERS), []);
  const countries = Object.keys(grouped);
  const [activeCountry, setActiveCountry] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLabel, setSearchLabel] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const displayed = useMemo(() => {
    const list = activeCountry ? grouped[activeCountry] : RETAILERS;
    if (!userLocation) return list;
    return [...list].sort((a, b) => {
      const dA = Math.hypot(a.lat - userLocation.lat, a.lng - userLocation.lng);
      const dB = Math.hypot(b.lat - userLocation.lat, b.lng - userLocation.lng);
      return dA - dB;
    });
  }, [activeCountry, grouped, userLocation]);

  const handleSearch = useCallback(async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setSearching(true);
    setSearchError("");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&addressdetails=1&viewbox=-12,35,40,72&bounded=1`,
        { headers: { "User-Agent": "MichelinVeloHub/1.0" } }
      );
      const data = await res.json();
      if (!data || data.length === 0) {
        setSearchError("Aucun resultat pour cette recherche en Europe");
        return;
      }
      const loc = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      setUserLocation(loc);
      setSearchLabel(data[0].display_name?.split(",").slice(0, 3).join(",") ?? q);
      setSelectedId(null);
      setActiveCountry(null);
    } catch {
      setSearchError("Erreur de recherche");
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  const handleSelectRetailer = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchLabel("");
    setUserLocation(null);
    setSearchError("");
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Enter") handleSearch(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSearch]);

  const distanceTo = useCallback((r: Retailer) => {
    if (!userLocation) return null;
    const R = 6371;
    const dLat = ((r.lat - userLocation.lat) * Math.PI) / 180;
    const dLon = ((r.lng - userLocation.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((userLocation.lat * Math.PI) / 180) *
      Math.cos((r.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }, [userLocation]);

  return (
    <section>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-[#27509b] rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
            </div>
            <h1 className="font-title text-[#000c34] text-2xl">Trouver un revendeur</h1>
          </div>
          <p className="text-gray-400 text-sm ml-11">
            Revendeurs agrees Michelin Velo en Europe — {RETAILERS.length} points de vente
          </p>
        </div>

        {/* Location search */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ville, code postal, region..."
              className="w-64 rounded-xl px-4 py-2.5 pr-8 text-sm border border-gray-200 outline-none focus:border-[#27509b] bg-gray-50 focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button onClick={handleClearSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            disabled={searching || !searchQuery.trim()}
            className="bg-[#27509b] text-white rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-[#1e3f7a] transition-colors disabled:opacity-50 flex items-center gap-2 min-h-[42px]"
          >
            {searching ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
            Rechercher
          </button>
        </div>
      </div>

      {searchError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-2.5">
          {searchError}
        </div>
      )}

      {userLocation && (
        <div className="mb-4 bg-[#27509b]/5 border border-[#27509b]/20 text-[#27509b] text-sm rounded-xl px-4 py-2.5 flex items-center justify-between">
          <span className="font-semibold">Resultats tries par proximite : {searchLabel}</span>
          <button onClick={handleClearSearch} className="text-xs font-bold hover:underline">Reinitialiser</button>
        </div>
      )}

      {/* Country filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => setActiveCountry(null)}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
            activeCountry === null
              ? "bg-[#27509b] text-white"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          }`}
        >
          Tous ({RETAILERS.length})
        </button>
        {countries.map((code) => (
          <button
            key={code}
            onClick={() => { setActiveCountry(activeCountry === code ? null : code); setSelectedId(null); }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
              activeCountry === code
                ? "bg-[#27509b] text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {COUNTRY_FLAGS[code] ?? ""} {COUNTRY_LABELS[code] ?? code} ({grouped[code].length})
          </button>
        ))}
      </div>

      {/* Map + List */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Map */}
        <div className="lg:col-span-3 bg-gray-100 rounded-2xl overflow-hidden border border-gray-200" style={{ minHeight: 480 }}>
          <RetailersMap
            retailers={displayed}
            selectedId={selectedId}
            userLocation={userLocation}
            onSelectRetailer={handleSelectRetailer}
          />
        </div>

        {/* List */}
        <div className="lg:col-span-2 space-y-2 max-h-[480px] overflow-y-auto pr-1">
          {displayed.map((r) => {
            const dist = distanceTo(r);
            const isSelected = selectedId === r.id;
            return (
              <button
                key={r.id}
                onClick={() => handleSelectRetailer(r.id)}
                className={`w-full text-left flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
                  isSelected
                    ? "border-[#27509b] bg-[#27509b]/5 shadow-md"
                    : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 ${
                  isSelected ? "bg-[#27509b] text-white text-sm font-black" : "bg-gray-50"
                }`}>
                  {isSelected ? (
                    <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                  ) : (
                    COUNTRY_FLAGS[r.country] ?? "🌐"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-bold text-sm ${isSelected ? "text-[#27509b]" : "text-[#000c34]"}`}>
                    {r.name}
                  </div>
                  <div className="text-gray-400 text-[11px] truncate">
                    {r.address}, {r.postalCode} {r.city}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {dist !== null && (
                    <div className="text-[#27509b] text-xs font-black">{dist} km</div>
                  )}
                  <div className="text-gray-300 text-[10px]">{COUNTRY_LABELS[r.country]}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
