"use client";
import { CalendarPlus } from "lucide-react";

function formatIcsDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    "T" +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    "Z"
  );
}

function escapeIcs(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function AddToCalendarButton({
  title,
  description,
  location,
  startTime,
  endTime,
}: {
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
}) {
  function handleDownload() {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const dtStamp = formatIcsDate(new Date());
    const dtStart = formatIcsDate(start);
    const dtEnd = formatIcsDate(end);
    const uid = `${Date.now()}@adnavra.lk`;

    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//ADNAVRA//Booking//EN",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${escapeIcs(title)}`,
      description ? `DESCRIPTION:${escapeIcs(description)}` : null,
      location ? `LOCATION:${escapeIcs(location)}` : null,
      "END:VEVENT",
      "END:VCALENDAR",
    ]
      .filter(Boolean)
      .join("\r\n");

    const blob = new Blob([lines], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, "_")}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleDownload}
      className="inline-flex items-center gap-1.5 rounded-md border border-[#E3E8F0] bg-white px-3 py-1.5 text-xs font-medium text-[#3a2f22] hover:bg-[#EFF4FA]"
    >
      <CalendarPlus className="h-3.5 w-3.5 text-[#8a6d4f]" /> Add to calendar
    </button>
  );
}
