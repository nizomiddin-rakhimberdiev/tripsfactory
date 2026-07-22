"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import type { RoutePoint } from "@/lib/content/types";

/**
 * Brand colours, kept in sync with the tokens in globals.css. Leaflet renders
 * outside React and cannot read CSS custom properties, so they are literal.
 * The route runs in maroon and lands on gold — start and finish read at a glance.
 */
const BRAND_MAROON = "#6e1218";
const BRAND_GOLD = "#a9762f";

function markerHtml(n: number, color: string) {
  return `<div style="width:32px;height:32px;border-radius:50%;background:${color};border:3px solid #fff9f0;box-shadow:0 2px 8px rgba(74,52,38,.35);display:flex;align-items:center;justify-content:center;color:#fff9f0;font-weight:600;font-size:14px;font-family:system-ui,sans-serif">${n}</div>`;
}

export function TourRouteMap({ points }: { points: RoutePoint[] }) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!elRef.current || mapRef.current) return;

    (async () => {
      const mod = (await import("leaflet")) as unknown as {
        default: typeof import("leaflet");
      };
      const L = mod.default;
      if (cancelled || !elRef.current) return;

      const map = L.map(elRef.current, {
        scrollWheelZoom: false,
        zoomControl: true,
      });
      mapRef.current = map;

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          attribution: "&copy; OpenStreetMap &copy; CARTO",
          maxZoom: 19,
        },
      ).addTo(map);

      const latlngs = points.map((p) => [p.lat, p.lng] as [number, number]);

      if (latlngs.length > 1) {
        L.polyline(latlngs, {
          color: BRAND_MAROON,
          weight: 4,
          opacity: 0.85,
        }).addTo(map);
      }

      points.forEach((p, i) => {
        const isLast = i === points.length - 1;
        const color = isLast ? BRAND_GOLD : BRAND_MAROON;
        const icon = L.divIcon({
          className: "tf-marker",
          html: markerHtml(i + 1, color),
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16],
        });
        L.marker([p.lat, p.lng], { icon })
          .addTo(map)
          .bindPopup(
            `<div style="font-family:system-ui,sans-serif"><strong style="font-size:14px">${p.name}</strong>${
              p.note
                ? `<div style="color:#6f6459;font-size:12px;margin-top:2px">${p.note}</div>`
                : ""
            }</div>`,
          );
      });

      if (latlngs.length === 1) {
        map.setView(latlngs[0], 11);
      } else if (latlngs.length > 1) {
        map.fitBounds(L.latLngBounds(latlngs), {
          padding: [50, 50],
          maxZoom: 9,
        });
      } else {
        map.setView([41.3, 64.5], 5);
      }
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [points]);

  return (
    <div
      ref={elRef}
      className="relative z-0 h-[420px] w-full overflow-hidden rounded-2xl border border-border"
    />
  );
}
