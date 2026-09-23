"use client";
import { MapContainer, TileLayer, Marker, Circle, Popup } from "react-leaflet";
import L from "leaflet";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

type Result = { id: string; name: string; slug: string; latitude: number; longitude: number };

export default function ResultsMap({
  center,
  results,
  radiusKm,
}: {
  center: [number, number];
  results: Result[];
  radiusKm: number;
}) {
  return (
    <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }}>
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Circle center={center} radius={radiusKm * 1000} pathOptions={{ color: "#c9a26d", fillOpacity: 0.05 }} />
      {results.map((r) => (
        <Marker key={r.id} position={[r.latitude, r.longitude]} icon={icon}>
          <Popup>
            <a href={`/${r.slug}`} className="text-sm font-medium">
              {r.name}
            </a>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
