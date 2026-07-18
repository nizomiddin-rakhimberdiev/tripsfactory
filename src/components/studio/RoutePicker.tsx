"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, LayerGroup, LeafletMouseEvent } from "leaflet";
import type { RoutePoint } from "@/lib/content/types";
import { IconTrash, IconChevron } from "./icons";

function markerHtml(n: number, color: string) {
  return `<div style="width:30px;height:30px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:13px;font-family:system-ui">${n}</div>`;
}

export function RoutePicker({
  value,
  onChange,
}: {
  value: RoutePoint[];
  onChange: (v: RoutePoint[]) => void;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const LRef = useRef<typeof import("leaflet") | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  function redraw() {
    const L = LRef.current;
    const layer = layerRef.current;
    if (!L || !layer) return;
    layer.clearLayers();
    const pts = valueRef.current;
    if (pts.length > 1) {
      L.polyline(
        pts.map((p) => [p.lat, p.lng] as [number, number]),
        { color: "#0e7490", weight: 3, opacity: 0.7 },
      ).addTo(layer);
    }
    pts.forEach((p, i) => {
      const color = i === pts.length - 1 ? "#d97706" : "#0e7490";
      const icon = L.divIcon({
        className: "",
        html: markerHtml(i + 1, color),
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });
      const m = L.marker([p.lat, p.lng], { icon, draggable: true }).addTo(layer);
      m.bindTooltip(p.name);
      m.on("dragend", () => {
        const ll = m.getLatLng();
        const cur = [...valueRef.current];
        cur[i] = {
          ...cur[i],
          lat: Number(ll.lat.toFixed(5)),
          lng: Number(ll.lng.toFixed(5)),
        };
        onChangeRef.current(cur);
      });
    });
  }

  useEffect(() => {
    let cancelled = false;
    if (!elRef.current || mapRef.current) return;
    (async () => {
      const mod = (await import("leaflet")) as unknown as {
        default: typeof import("leaflet");
      };
      const L = mod.default;
      if (cancelled || !elRef.current) return;
      LRef.current = L;
      const map = L.map(elRef.current, { scrollWheelZoom: true });
      mapRef.current = map;
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        { attribution: "&copy; OSM &copy; CARTO", maxZoom: 19 },
      ).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      const pts = valueRef.current;
      if (pts.length) {
        map.fitBounds(
          L.latLngBounds(pts.map((p) => [p.lat, p.lng] as [number, number])),
          { padding: [40, 40], maxZoom: 9 },
        );
      } else {
        map.setView([41.3, 64.5], 5);
      }
      map.on("click", (e: LeafletMouseEvent) => {
        const cur = valueRef.current;
        onChangeRef.current([
          ...cur,
          {
            name: `Nuqta ${cur.length + 1}`,
            lat: Number(e.latlng.lat.toFixed(5)),
            lng: Number(e.latlng.lng.toFixed(5)),
          },
        ]);
      });
      redraw();
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    redraw();
  }, [value]);

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <p className="s-field__help">
        Xaritani bosib bekat qo'shing. Markerni surib joyini o'zgartiring.
        Pastdagi ro'yxatda nom bering, tartibini o'zgartiring yoki o'chiring.
      </p>
      <div
        ref={elRef}
        style={{
          height: 360,
          width: "100%",
          borderRadius: "var(--s-radius-lg)",
          overflow: "hidden",
          border: "1px solid var(--s-border)",
          position: "relative",
          zIndex: 0,
        }}
      />
      {value.length === 0 ? (
        <p className="s-field__help">Hali bekat yo'q — xaritani bosing.</p>
      ) : (
        <div className="s-repeat">
          {value.map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="s-repeat__num" style={{ width: 18 }}>
                {i + 1}
              </span>
              <input
                className="s-input"
                value={p.name}
                placeholder="Bekat nomi"
                onChange={(e) => {
                  const next = [...value];
                  next[i] = { ...next[i], name: e.target.value };
                  onChange(next);
                }}
              />
              <div style={{ display: "flex", gap: 2 }}>
                <button
                  type="button"
                  className="s-btn s-btn--icon s-btn--ghost s-btn--sm"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  title="Yuqoriga"
                >
                  <IconChevron style={{ transform: "rotate(-90deg)" }} />
                </button>
                <button
                  type="button"
                  className="s-btn s-btn--icon s-btn--ghost s-btn--sm"
                  onClick={() => move(i, 1)}
                  disabled={i === value.length - 1}
                  title="Pastga"
                >
                  <IconChevron style={{ transform: "rotate(90deg)" }} />
                </button>
                <button
                  type="button"
                  className="s-btn s-btn--icon s-btn--danger s-btn--sm"
                  onClick={() => onChange(value.filter((_, j) => j !== i))}
                  title="O'chirish"
                >
                  <IconTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
