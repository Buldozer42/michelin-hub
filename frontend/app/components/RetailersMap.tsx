"use client";

import { useEffect, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Retailer } from "./RetailersSection";

const MICHELIN_BLUE = "#27509b";

function createIcon(color: string, size: number) {
  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
    html: `<svg viewBox="0 0 24 36" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="12" cy="11" r="5" fill="white"/>
    </svg>`,
  });
}

function createUserIcon() {
  return L.divIcon({
    className: "",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    html: `<div style="width:20px;height:20px;border-radius:50%;background:#fce500;border:3px solid #000c34;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
  });
}

const defaultIcon = createIcon(MICHELIN_BLUE, 32);
const selectedIcon = createIcon("#FC4C02", 40);
const userIcon = createUserIcon();

function MapController({
  retailers,
  selectedId,
  userLocation,
}: {
  retailers: Retailer[];
  selectedId: string | null;
  userLocation: { lat: number; lng: number } | null;
}) {
  const map = useMap();
  const prevSelectedRef = useRef<string | null>(null);

  useEffect(() => {
    if (selectedId && selectedId !== prevSelectedRef.current) {
      const r = retailers.find((r) => r.id === selectedId);
      if (r) map.flyTo([r.lat, r.lng], 12, { duration: 0.8 });
    }
    prevSelectedRef.current = selectedId;
  }, [selectedId, retailers, map]);

  useEffect(() => {
    if (userLocation && !selectedId) {
      map.flyTo([userLocation.lat, userLocation.lng], 8, { duration: 1 });
    }
  }, [userLocation, selectedId, map]);

  useEffect(() => {
    if (retailers.length === 0) return;
    if (selectedId || userLocation) return;
    const bounds = L.latLngBounds(retailers.map((r) => [r.lat, r.lng]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [retailers, selectedId, userLocation, map]);

  return null;
}

interface Props {
  retailers: Retailer[];
  selectedId: string | null;
  userLocation: { lat: number; lng: number } | null;
  onSelectRetailer: (id: string) => void;
}

export default function RetailersMap({ retailers, selectedId, userLocation, onSelectRetailer }: Props) {
  const center = useMemo<[number, number]>(() => {
    if (userLocation) return [userLocation.lat, userLocation.lng];
    return [48.2, 6.0];
  }, [userLocation]);

  return (
    <MapContainer
      center={center}
      zoom={5}
      style={{ width: "100%", height: "100%", minHeight: 480 }}
      zoomControl={true}
      scrollWheelZoom={true}
      minZoom={4}
      maxBounds={[
        [34, -15],
        [72, 42],
      ]}
      maxBoundsViscosity={1.0}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapController retailers={retailers} selectedId={selectedId} userLocation={userLocation} />

      {retailers.map((r) => (
        <Marker
          key={r.id}
          position={[r.lat, r.lng]}
          icon={selectedId === r.id ? selectedIcon : defaultIcon}
          eventHandlers={{ click: () => onSelectRetailer(r.id) }}
        >
          <Popup>
            <div style={{ minWidth: 180 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#000c34" }}>{r.name}</div>
              <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                {r.address}<br />{r.postalCode} {r.city}
              </div>
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  marginTop: 8,
                  padding: "6px 12px",
                  background: "#27509b",
                  color: "white",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                Visiter le site
              </a>
            </div>
          </Popup>
        </Marker>
      ))}

      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
          <Popup>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#000c34" }}>Votre position</div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
