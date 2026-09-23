"use client";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useState } from "react";
import { LocateFixed } from "lucide-react";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function DraggableMarker({
  position,
  onMove,
}: {
  position: [number, number];
  onMove: (lat: number, lng: number) => void;
}) {
  const [pos, setPos] = useState(position);
  useMapEvents({
    click(e) {
      setPos([e.latlng.lat, e.latlng.lng]);
      onMove(e.latlng.lat, e.latlng.lng);
    },
  });
  return (
    <Marker
      position={pos}
      draggable
      icon={icon}
      eventHandlers={{
        dragend: (e) => {
          const m = e.target.getLatLng();
          setPos([m.lat, m.lng]);
          onMove(m.lat, m.lng);
        },
      }}
    />
  );
}

export default function MapPicker({
  latitude,
  longitude,
  onMove,
}: {
  latitude: number;
  longitude: number;
  onMove: (lat: number, lng: number) => void;
}) {
  // Default to Colombo, Sri Lanka if no coordinates are set yet
  const center: [number, number] = [latitude || 6.9271, longitude || 79.8612];
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported in this browser.");
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        onMove(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setLocating(false);
        setGeoError("Couldn't get your location. Drag the map instead.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  return (
    <div className="isolate rounded-lg overflow-hidden border border-[#e6dcc8]" style={{ height: 320 }}>
      <div className="relative h-full w-full">
        <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <DraggableMarker position={center} onMove={onMove} />
        </MapContainer>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="absolute right-3 top-3 z-[500] inline-flex items-center gap-1.5 rounded-lg border border-[#e6dcc8] bg-[#faf6ef]/95 px-3 py-1.5 text-xs font-medium text-[#3a2f22] shadow hover:bg-[#f6efe3] disabled:opacity-60"
        >
          <LocateFixed className="h-3.5 w-3.5" />
          {locating ? "Locating…" : "Use my location"}
        </button>
        {geoError && (
          <p className="absolute bottom-3 left-3 z-[500] rounded-md bg-[#3a2f22]/90 px-2.5 py-1.5 text-xs text-[#faf6ef]">
            {geoError}
          </p>
        )}
      </div>
    </div>
  );
}
