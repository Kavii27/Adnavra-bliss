"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { LocateFixed } from "lucide-react";

const MapPicker = dynamic(() => import("./map-picker"), { ssr: false });

export type LocationFields = {
  address: string;
  district: string;
  city: string;
  county: string;
  state: string;
  postcode: string;
  directions: string;
  latitude: number;
  longitude: number;
};

export function StepLocationMap({
  value,
  onChange,
}: {
  value: LocationFields;
  onChange: (v: LocationFields) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setGeoError("Geolocation isn't supported in this browser.");
      return;
    }

    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({
          ...value,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocating(false);
      },
      () => {
        setGeoError("Couldn't get your location — drag the pin manually instead.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }

  return (
    <div className="max-w-2xl">
      <p className="mb-2 text-sm font-medium">Where is your business located?</p>
      <button
        type="button"
        onClick={useMyLocation}
        disabled={locating}
        className="mb-3 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#e6dcc8] bg-white px-4 py-2 text-sm font-medium text-[#3a2f22] hover:bg-[#f6efe3] disabled:opacity-50"
      >
        <LocateFixed className="h-4 w-4" />
        {locating ? "Locating…" : "Use my current location"}
      </button>
      {geoError && <p className="mb-2 text-xs text-red-600">{geoError}</p>}
      <MapPicker
        latitude={value.latitude}
        longitude={value.longitude}
        onMove={(lat, lng) => onChange({ ...value, latitude: lat, longitude: lng })}
      />
      <div className="mt-4 flex items-center justify-between rounded-lg border border-[#e6dcc8] bg-[#f6efe3] px-4 py-3">
        <div>
          <p className="text-sm font-medium">{value.city || "Set your location"}</p>
          <p className="text-xs text-[#a89880]">Sri Lanka</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-sm font-medium text-[#c9a26d] hover:underline"
        >
          Edit
        </button>
      </div>
      <p className="mt-2 text-xs text-[#a89880]">Drag the map to adjust the pin position.</p>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
          <div className="max-h-[calc(100dvh-3rem)] w-full max-w-lg space-y-4 overflow-y-auto overscroll-contain rounded-2xl bg-[#3a2f22] p-8 text-[#faf6ef]">
            <h2 className="text-xl font-semibold">Edit business location</h2>
            <div className="grid grid-cols-2 gap-4">
              <LocField label="Address" v={value.address} k="address" value={value} onChange={onChange} span2 />
              <LocField label="District" v={value.district} k="district" value={value} onChange={onChange} />
              <LocField label="City" v={value.city} k="city" value={value} onChange={onChange} />
              <LocField label="County" v={value.county} k="county" value={value} onChange={onChange} />
              <LocField label="State" v={value.state} k="state" value={value} onChange={onChange} />
              <LocField label="Postcode" v={value.postcode} k="postcode" value={value} onChange={onChange} />
            </div>
            <div>
              <label className="text-xs text-[#a89880]">Directions</label>
              <textarea
                value={value.directions}
                onChange={(event) => onChange({ ...value, directions: event.target.value })}
                rows={3}
                placeholder="Add details to help clients find your location"
                className="mt-1 w-full rounded-md border border-[#e6dcc8] bg-[#f6efe3] px-3 py-2 text-sm text-[#3a2f22]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-md border border-[#e6dcc8] px-4 py-2 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-md bg-white px-4 py-2 text-sm font-medium text-[#3a2f22]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LocField({
  label,
  v,
  k,
  value,
  onChange,
  span2,
}: {
  label: string;
  v: string;
  k: keyof LocationFields;
  value: LocationFields;
  onChange: (v: LocationFields) => void;
  span2?: boolean;
}) {
  return (
    <div className={span2 ? "col-span-2" : ""}>
      <label className="text-xs text-[#a89880]">{label}</label>
      <input
        value={v}
        onChange={(event) => onChange({ ...value, [k]: event.target.value })}
        className="mt-1 w-full rounded-md border border-[#e6dcc8] bg-[#f6efe3] px-3 py-2 text-sm text-[#3a2f22]"
      />
    </div>
  );
}
