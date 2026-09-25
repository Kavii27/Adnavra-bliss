"use client";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useEffect, useState } from "react";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapCenterUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  const [latitude, longitude] = center;

  useEffect(() => {
    map.setView([latitude, longitude], map.getZoom(), { animate: false });
  }, [latitude, longitude, map]);

  return null;
}

function DraggableMarker({
  position,
  onMove,
}: {
  position: [number, number];
  onMove: (lat: number, lng: number) => void;
}) {
  const [pos, setPos] = useState(position);
  const [latitude, longitude] = position;

  useEffect(() => {
    setPos([latitude, longitude]);
  }, [latitude, longitude]);

  useMapEvents({
    click(event) {
      const nextPosition: [number, number] = [event.latlng.lat, event.latlng.lng];
      setPos(nextPosition);
      onMove(event.latlng.lat, event.latlng.lng);
    },
  });

  return (
    <Marker
      position={pos}
      draggable
      icon={icon}
      eventHandlers={{
        dragend: (event) => {
          const markerPosition = event.target.getLatLng();
          setPos([markerPosition.lat, markerPosition.lng]);
          onMove(markerPosition.lat, markerPosition.lng);
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
  const center: [number, number] = [latitude || 6.9271, longitude || 79.8612];

  return (
    <div className="isolate h-80 overflow-hidden rounded-lg border border-[#e6dcc8]">
      <div className="relative h-full w-full">
        <MapContainer center={center} zoom={13} className="h-full w-full">
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapCenterUpdater center={center} />
          <DraggableMarker position={center} onMove={onMove} />
        </MapContainer>
      </div>
    </div>
  );
}
