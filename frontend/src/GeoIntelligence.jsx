import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  Activity, ArrowUpRight, BedDouble, Building2, ChevronRight,
  Droplets, LocateFixed, MapPin, Navigation, Phone, Search,
  RefreshCw, ShieldCheck, SlidersHorizontal, Wrench, X,
} from "lucide-react";
import "./GeoIntelligence.css";

const API = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const SHIVALIK_COLLEGE = { latitude: 30.33603, longitude: 77.870868 };
const SOURCES = [
  ["hospitals", "/api/hospitals/"],
  ["blood", "/api/blood/public"],
  ["icu", "/api/icu/public"],
  ["organs", "/api/organs/public"],
  ["equipment", "/api/equipment/public"],
];
const CATEGORIES = ["All resources", "Blood", "ICU beds", "Organs", "Equipment"];

function distanceKm(a, b) {
  const rad = value => value * Math.PI / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const lat1 = rad(a.latitude);
  const lat2 = rad(b.latitude);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function inventoryFor(hospital, data) {
  return {
    blood: data.blood.filter(item => item.hospital_id === hospital.id),
    icu: data.icu.filter(item => item.hospital_id === hospital.id),
    organs: data.organs.filter(item => item.hospital_id === hospital.id),
    equipment: data.equipment.filter(item => item.hospital_id === hospital.id),
  };
}

function inventorySummary(items, type) {
  if (type === "blood") return items.map(item => `${item.blood_group} ${item.units_available} units`).join(" · ");
  if (type === "icu") return items.map(item => `${item.available_beds} ICU beds available`).join(" · ");
  if (type === "organs") return items.map(item => `${item.organ_name}${item.available ? " available" : ""}`).join(" · ");
  return items.map(item => `${item.equipment_name} · ${item.quantity_available} available`).join(" · ");
}

function matchesQuery(hospital, inventory, query, category) {
  const categoryKey = { Blood: "blood", "ICU beds": "icu", Organs: "organs", Equipment: "equipment" }[category];
  const candidates = categoryKey ? [[categoryKey, inventory[categoryKey]]] : Object.entries(inventory);
    const term = query.trim().replaceAll("−", "-").toLowerCase();
  return candidates.some(([type, items]) => {
    if (!items.length) return false;
    if (!term) return true;
    const resourceWords = { blood: "blood", icu: "icu beds bed", organs: "organ organs", equipment: "equipment medical equipment" }[type];
    const words = [hospital.name, hospital.city, hospital.state, resourceWords, ...items.map(item => Object.values(item).filter(v => typeof v === "string" || typeof v === "number").join(" "))].join(" ").toLowerCase();
    return term.split(/\s+/).filter(Boolean).every(word => words.includes(word));
  });
}

function hasCoordinates(hospital) {
  return hospital.latitude !== null && hospital.latitude !== undefined && hospital.latitude !== "" &&
    hospital.longitude !== null && hospital.longitude !== undefined && hospital.longitude !== "" &&
    Number.isFinite(Number(hospital.latitude)) && Number.isFinite(Number(hospital.longitude));
}

function parseCoordinates(value) {
  const match = value.trim().match(/^(-?\d{1,2}(?:\.\d+)?)\s*[, ]\s*(-?\d{1,3}(?:\.\d+)?)$/);
  if (!match) return null;
  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180 ? { latitude, longitude } : null;
}

function MapFocus({ hospitals, origin, selected }) {
  const map = useMap();
  useEffect(() => {
    const hospitalPoints = hospitals.filter(hasCoordinates).map(h => [Number(h.latitude), Number(h.longitude)]);
    const points = [...hospitalPoints, ...(origin ? [[origin.latitude, origin.longitude]] : [])];
    if (selected && hasCoordinates(selected)) {
      map.flyTo([Number(selected.latitude), Number(selected.longitude)], Math.max(map.getZoom(), 13), { duration: .65 });
    } else if (origin) {
      map.setView([origin.latitude, origin.longitude], 12, { animate: true });
    } else if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points), { padding: [42, 42], maxZoom: 12, animate: true });
    } else if (points.length === 1) {
      map.setView(points[0], 12, { animate: true });
    }
  }, [map, hospitals, origin, selected]);
  return null;
}

function hospitalIcon(active) {
  return L.divIcon({
    className: `geo-leaflet-icon ${active ? "active" : ""}`,
    html: '<span class="geo-leaflet-pin"><i></i></span>',
    iconSize: [34, 42],
    iconAnchor: [17, 38],
    tooltipAnchor: [0, -34],
  });
}

function userIcon() {
  return L.divIcon({
    className: "geo-user-icon",
    html: '<span class="geo-user-pin"><i></i></span>',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function MapPanel({ hospitals, origin, originLabel, selected, onSelect, onRefresh }) {
  const located = hospitals.filter(hasCoordinates);

  return <section className="geo-map-card" aria-label="Hospital map">
    <div className="geo-map-top"><div><span className="geo-kicker">LIVE NETWORK MAP</span><h2>{origin ? `Hospitals near ${originLabel}` : "Hospital network map"}</h2></div><div className="geo-map-top-actions"><span className="geo-map-count"><i /> {located.length} mapped</span><button className="geo-refresh-button" onClick={onRefresh} title="Refresh hospital coordinates" aria-label="Refresh hospital coordinates"><RefreshCw size={14} /></button></div></div>
    <div className="geo-map-canvas geo-leaflet-canvas">
      <MapContainer className="geo-leaflet-map" center={[SHIVALIK_COLLEGE.latitude, SHIVALIK_COLLEGE.longitude]} zoom={12} scrollWheelZoom zoomControl>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <MapFocus hospitals={located} origin={origin} selected={selected} />
        {located.map(h => <Marker key={h.id} position={[Number(h.latitude), Number(h.longitude)]} icon={hospitalIcon(selected?.id === h.id)} eventHandlers={{ click: () => onSelect(h) }}>
          <Tooltip direction="top" offset={[0, -4]}><strong>{h.name}</strong><br />{h.city}{h.state ? `, ${h.state}` : ""}</Tooltip>
        </Marker>)}
        {origin && <Marker position={[origin.latitude, origin.longitude]} icon={userIcon()}><Tooltip direction="top">{originLabel}</Tooltip></Marker>}
      </MapContainer>
      {!located.length && <div className="geo-map-empty-overlay"><strong>No hospital coordinates yet</strong><span>Add latitude and longitude to a hospital profile to place it on the map.</span></div>}
      <div className="geo-map-legend"><span><i className="geo-legend-hospital" /> Hospital</span><span><i className="geo-legend-you" /> {originLabel}</span></div>
    </div>
    <div className="geo-map-bottom"><span><ShieldCheck size={15} /> Verified hospital network</span><span>Drag to explore · scroll to zoom</span></div>
  </section>;
}

export default function GeoIntelligence() {
  const [data, setData] = useState({ hospitals: [], blood: [], icu: [], organs: [], equipment: [] });
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All resources");
  const origin = SHIVALIK_COLLEGE;
  const [locationMessage, setLocationMessage] = useState("Starting point: Shivalik College of Engineering, Dehradun.");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setLoadError("");
    Promise.all(SOURCES.map(async ([key, path]) => {
      const response = await fetch(`${API}${path}`);
      if (!response.ok) throw new Error(`Could not load ${key}`);
      return [key, await response.json()];
    })).then(entries => { if (mounted) setData(Object.fromEntries(entries)); })
      .catch(() => { if (mounted) setLoadError("We couldn’t load the live hospital network. Please check your connection and try again."); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [refreshKey]);

  const results = useMemo(() => data.hospitals.map(hospital => {
    const inventory = inventoryFor(hospital, data);
    const coordinateSearch = parseCoordinates(query);
    const hasCategoryItems = Object.values(inventory).some(items => items.length > 0);
    const categoryKey = { Blood: "blood", "ICU beds": "icu", Organs: "organs", Equipment: "equipment" }[category];
    const matches = coordinateSearch
      ? (categoryKey ? inventory[categoryKey].length > 0 : hasCategoryItems)
      : matchesQuery(hospital, inventory, query, category);
    const hasLocation = hasCoordinates(hospital);
    const distanceFrom = coordinateSearch || origin;
    const distance = distanceFrom && hasLocation ? distanceKm(distanceFrom, { latitude: Number(hospital.latitude), longitude: Number(hospital.longitude) }) : null;
    return { hospital, inventory, matches, distance, hasLocation };
  }).filter(result => result.matches).sort((a, b) => {
    if (origin || parseCoordinates(query)) return (a.distance ?? Infinity) - (b.distance ?? Infinity);
    return a.hospital.name.localeCompare(b.hospital.name);
  }), [data, query, category, origin]);

  const coordinateSearch = parseCoordinates(query);
  const mapOrigin = coordinateSearch || origin;
  const originLabel = coordinateSearch ? "Entered coordinates" : "Shivalik College";
  const mapHospitals = useMemo(() => results.map(result => result.hospital), [results]);

  useEffect(() => {
    if (selected && !results.some(result => result.hospital.id === selected.id)) setSelected(null);
  }, [results, selected]);

  function findNearby() {
    setSelected(null);
    setLocationMessage("Hospitals sorted by distance from Shivalik College of Engineering.");
  }

  return <main className="geo-page">
    <header className="geo-hero">
      <div className="geo-hero-top">
        <div className="geo-hero-copy"><span className="geo-eyebrow"><Activity size={15} /> HEALTHCARE GEO INTELLIGENCE</span><h1>Find care, <em>closer.</em></h1><p>Search critical resources across verified hospitals and see the closest options first.</p></div>
        <figure className="geo-hero-photo"><img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1000&q=85" alt="Doctors reviewing patient care together" /><figcaption><span>CONNECTED CARE</span><strong>When every minute matters.</strong></figcaption></figure>
        <div className="geo-live-pill"><span /> NETWORK LIVE <b>{data.hospitals.length.toString().padStart(2, "0")}</b></div>
      </div>
      <div className="geo-search-card">
      <div className="geo-search-input"><Search size={20} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search blood, kidney, equipment, hospital, or lat, lon" aria-label="Search hospitals and medical resources or enter coordinates" />{query && <button onClick={() => setQuery("")} aria-label="Clear search"><X size={17} /></button>}</div>
        <button className="geo-nearby-button is-active" onClick={findNearby}><LocateFixed size={17} />Find Nearby</button>
        <div className="geo-categories" role="group" aria-label="Filter by resource category"><SlidersHorizontal size={15} />{CATEGORIES.map(item => <button key={item} className={category === item ? "selected" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div>
        {locationMessage && <p className="geo-location-message" role="status">{locationMessage}</p>}
      </div>
    </header>

    <div className="geo-content">
      <MapPanel hospitals={mapHospitals} origin={mapOrigin} originLabel={originLabel} selected={selected} onSelect={hospital => setSelected(hospital)} onRefresh={() => setRefreshKey(key => key + 1)} />
      <section className="geo-results-panel">
        <div className="geo-results-head"><div><span className="geo-kicker">RESOURCE DIRECTORY</span><h2>{mapOrigin ? "Closest matches" : "Available near your network"}</h2><p>{coordinateSearch ? <>Near coordinates <strong>{coordinateSearch.latitude.toFixed(4)}, {coordinateSearch.longitude.toFixed(4)}</strong></> : query ? <>Results for <strong>“{query}”</strong></> : "Current availability across registered hospitals"}</p></div><span className="geo-result-count">{results.length} {results.length === 1 ? "hospital" : "hospitals"}</span></div>
        {loading ? <div className="geo-state"><span className="geo-loader" />Connecting to hospital network…</div> : loadError ? <div className="geo-state geo-state-error">{loadError}</div> : results.length === 0 ? <div className="geo-state"><Search size={23} /><strong>No matching hospitals found</strong><span>Try another resource or choose a different category.</span></div> : <div className="geo-hospital-list">
          {results.map(({ hospital, inventory, distance, hasLocation }) => <article key={hospital.id} className={`geo-hospital-card ${selected?.id === hospital.id ? "is-selected" : ""}`} onClick={() => setSelected(hospital)}>
            <div className="geo-hospital-card-top"><div className="geo-hospital-mark"><Building2 size={19} /></div><div className="geo-hospital-name"><h3>{hospital.name}</h3><p><MapPin size={13} />{hospital.city}{hospital.state ? `, ${hospital.state}` : ""}</p></div>{mapOrigin && distance !== null ? <span className="geo-distance"><Navigation size={13} />{distance < 10 ? distance.toFixed(1) : Math.round(distance)} km</span> : mapOrigin && !hasLocation ? <span className="geo-no-coordinate">Pin unavailable</span> : <ArrowUpRight size={17} className="geo-card-arrow" />}</div>
            <div className="geo-resource-tags">
              {inventory.blood.length > 0 && <span className="blood-tag"><Droplets size={13} />{inventory.blood.slice(0, 2).map(item => `${item.blood_group} · ${item.units_available}`).join(" / ")}</span>}
              {inventory.icu.length > 0 && <span className="icu-tag"><BedDouble size={13} />{inventory.icu.reduce((sum, item) => sum + Number(item.available_beds || 0), 0)} ICU beds</span>}
              {inventory.organs.length > 0 && <span className="organ-tag"><Activity size={13} />{inventory.organs.length} organ listings</span>}
              {inventory.equipment.length > 0 && <span className="equipment-tag"><Wrench size={13} />{inventory.equipment.length} equipment</span>}
            </div>
            {selected?.id === hospital.id && <div className="geo-selected-detail"><div>{Object.entries(inventory).filter(([, rows]) => rows.length).map(([type, rows]) => <p key={type}><strong>{type === "icu" ? "ICU" : type[0].toUpperCase() + type.slice(1)}:</strong> {inventorySummary(rows, type)}</p>)}</div>{hospital.phone && <a href={`tel:${hospital.phone}`} onClick={e => e.stopPropagation()}><Phone size={14} />Call hospital</a>}</div>}
          </article>)}
        </div>}
        {coordinateSearch && <button className="geo-clear-location" onClick={() => setQuery("")}>Clear coordinate search <ChevronRight size={16} /></button>}
      </section>
    </div>
    <section className="geo-care-strip" aria-label="Healthcare network highlights">
      <article className="geo-care-tile care-blood"><div><span>RESOURCE NETWORK</span><strong>Blood banks</strong><small>Find a matching group nearby</small></div></article>
      <article className="geo-care-tile care-clinical"><div><span>HOSPITAL CARE</span><strong>Critical care</strong><small>See ICU availability by location</small></div></article>
      <article className="geo-care-tile care-equipment"><div><span>MEDICAL SUPPORT</span><strong>Equipment</strong><small>Locate essential equipment</small></div></article>
    </section>
    <footer className="geo-footer"><span><ShieldCheck size={15} /> Hospital-reported availability</span><span>Resource details can change. Contact hospitals to confirm.</span></footer>
  </main>;
}
