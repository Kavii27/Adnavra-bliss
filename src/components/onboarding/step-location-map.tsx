"use client";
import dynamic from "next/dynamic";
import { useState } from "react";

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

  return (
    <div className="max-w-2xl">
      <p className="text-sm font-medium mb-2">Where is your business located?</p>
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-50">
          <div className="bg-[#3a2f22] text-[#faf6ef] rounded-2xl p-8 w-full max-w-lg space-y-4">
            <h2 className="text-xl font-semibold">Edit business location</h2>
            <div className="grid grid-cols-2 gap-4">
              <LocField
                label="Address"
                v={value.address}
                k="address"
                value={value}
                onChange={onChange}
                span2
              />
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
                onChange={(e) => onChange({ ...value, directions: e.target.value })}
                rows={3}
                placeholder="Add details to help clients find your location"
                className="mt-1 w-full rounded-md border border-[#e6dcc8] bg-[#f6efe3] px-3 py-2 text-sm text-[#3a2f22]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditing(false)}
                className="rounded-md px-4 py-2 text-sm font-medium border border-[#e6dcc8]"
              >
                Cancel
              </button>
              <button
                onClick={() => setEditing(false)}
                className="rounded-md px-4 py-2 text-sm font-medium bg-white text-[#3a2f22]"
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
        onChange={(e) => onChange({ ...value, [k]: e.target.value })}
        className="mt-1 w-full rounded-md border border-[#e6dcc8] bg-[#f6efe3] px-3 py-2 text-sm text-[#3a2f22]"
      />
    </div>
  );
}
