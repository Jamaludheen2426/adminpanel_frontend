'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Search, LocateFixed, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LatLng {
    lat: number;
    lng: number;
}

interface MapPickerProps {
    value?: LatLng | null;
    onChange: (coords: LatLng | null) => void;
    label?: string;
    /** When this string changes the map silently geocodes it and flies to the area (no pin dropped). */
    flyToQuery?: string;
}

const DEFAULT_CENTER: LatLng = { lat: 20.5937, lng: 78.9629 }; // India centre
const DEFAULT_ZOOM = 5;
const PINNED_ZOOM  = 15;
const AREA_ZOOM    = 10; // zoom used when auto-centering on a selected region

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildPinIcon(L: any) {
    return L.divIcon({
        html: `<div style="
            width:36px;height:36px;
            background:hsl(221.2 83.2% 53.3%);
            border:3px solid white;
            border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);
            box-shadow:0 2px 8px rgba(0,0,0,0.35);
        "></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        className: '',
    });
}

async function nominatimSearch(query: string): Promise<LatLng | null> {
    try {
        const url  = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
        const res  = await fetch(url, { headers: { 'Accept-Language': 'en' } });
        const data = await res.json();
        if (!data.length) return null;
        return { lat: +parseFloat(data[0].lat).toFixed(7), lng: +parseFloat(data[0].lon).toFixed(7) };
    } catch {
        return null;
    }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MapPicker({ value, onChange, label = 'Office Location', flyToQuery }: MapPickerProps) {
    const mapRef       = useRef<any>(null);
    const markerRef    = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const leafletRef   = useRef<any>(null);

    const [ready,       setReady]       = useState(false);
    const [search,      setSearch]      = useState('');
    const [searching,   setSearching]   = useState(false);
    const [locating,    setLocating]    = useState(false);
    const [pinned,      setPinned]      = useState<LatLng | null>(value ?? null);
    const [searchError, setSearchError] = useState('');

    // ─── Sync external value ──────────────────────────────────────────────────
    useEffect(() => { setPinned(value ?? null); }, [value]);

    // ─── Load Leaflet (browser only) ──────────────────────────────────────────
    useEffect(() => {
        if (typeof window === 'undefined') return;
        import('leaflet').then((L) => {
            leafletRef.current = L.default ?? L;
            setReady(true);
        });
    }, []);

    // ─── Init map once Leaflet is loaded ──────────────────────────────────────
    useEffect(() => {
        if (!ready || !containerRef.current || mapRef.current) return;

        const L = leafletRef.current;
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        const center = pinned ?? DEFAULT_CENTER;
        const zoom   = pinned ? PINNED_ZOOM : DEFAULT_ZOOM;

        const map = L.map(containerRef.current, {
            center: [center.lat, center.lng],
            zoom,
            zoomControl: true,
            // Disable scroll-wheel zoom so page scrolling works normally;
            // it re-enables only when the user clicks inside the map.
            scrollWheelZoom: false,
        });

        // Re-enable scroll-zoom on click inside, disable again on mouse-leave
        const el = containerRef.current;
        const enableScroll  = () => map.scrollWheelZoom.enable();
        const disableScroll = () => map.scrollWheelZoom.disable();
        el?.addEventListener('click',      enableScroll);
        el?.addEventListener('mouseleave', disableScroll);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a>',
            maxZoom: 19,
        }).addTo(map);

        const pinIcon = buildPinIcon(L);

        if (pinned) {
            markerRef.current = L.marker([pinned.lat, pinned.lng], { icon: pinIcon, draggable: true }).addTo(map);
            markerRef.current.on('dragend', () => {
                const p = markerRef.current.getLatLng();
                const c = { lat: +p.lat.toFixed(7), lng: +p.lng.toFixed(7) };
                setPinned(c); onChange(c);
            });
        }

        map.on('click', (e: any) => {
            const coords: LatLng = { lat: +e.latlng.lat.toFixed(7), lng: +e.latlng.lng.toFixed(7) };
            const icon = buildPinIcon(L);
            if (markerRef.current) {
                markerRef.current.setLatLng([coords.lat, coords.lng]);
            } else {
                markerRef.current = L.marker([coords.lat, coords.lng], { icon, draggable: true }).addTo(map);
                markerRef.current.on('dragend', () => {
                    const p = markerRef.current.getLatLng();
                    const c = { lat: +p.lat.toFixed(7), lng: +p.lng.toFixed(7) };
                    setPinned(c); onChange(c);
                });
            }
            setPinned(coords); onChange(coords);
        });

        mapRef.current = map;

        return () => {
            el?.removeEventListener('click',      enableScroll);
            el?.removeEventListener('mouseleave', disableScroll);
            map.remove();
            mapRef.current  = null;
            markerRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready]);

    // ─── Place / move a marker and fly to it ──────────────────────────────────
    const placeMarker = useCallback((coords: LatLng | null) => {
        const map = mapRef.current;
        const L   = leafletRef.current;
        if (!map || !L) return;

        if (!coords) {
            if (markerRef.current) { markerRef.current.remove(); markerRef.current = null; }
            return;
        }

        const icon = buildPinIcon(L);
        if (markerRef.current) {
            markerRef.current.setLatLng([coords.lat, coords.lng]);
        } else {
            markerRef.current = L.marker([coords.lat, coords.lng], { icon, draggable: true }).addTo(map);
            markerRef.current.on('dragend', () => {
                const p = markerRef.current.getLatLng();
                const c = { lat: +p.lat.toFixed(7), lng: +p.lng.toFixed(7) };
                setPinned(c); onChange(c);
            });
        }
        map.flyTo([coords.lat, coords.lng], PINNED_ZOOM, { animate: true, duration: 0.8 });
    }, [onChange]);

    // ─── Auto-centre map when flyToQuery changes (country / state / city) ─────
    const prevFlyQuery = useRef<string>('');
    useEffect(() => {
        if (!flyToQuery || flyToQuery === prevFlyQuery.current) return;
        prevFlyQuery.current = flyToQuery;

        const map = mapRef.current;
        if (!map) return; // map not init yet; will start centred on default/pinned

        nominatimSearch(flyToQuery).then((coords) => {
            if (!coords) return;
            // Only pan the view — NEVER drop a pin automatically
            map.flyTo([coords.lat, coords.lng], AREA_ZOOM, { animate: true, duration: 1 });
        });
    }, [flyToQuery]);

    // ─── Manual search ────────────────────────────────────────────────────────
    const handleSearch = async () => {
        if (!search.trim()) return;
        setSearching(true); setSearchError('');
        try {
            const coords = await nominatimSearch(search);
            if (!coords) { setSearchError('No results found. Try a different search.'); return; }
            setPinned(coords); onChange(coords); placeMarker(coords);
        } catch {
            setSearchError('Search failed. Check your connection.');
        } finally {
            setSearching(false);
        }
    };

    // ─── GPS locate ───────────────────────────────────────────────────────────
    const handleLocate = () => {
        if (!navigator.geolocation) { setSearchError('Geolocation not supported.'); return; }
        setLocating(true); setSearchError('');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const coords: LatLng = { lat: +pos.coords.latitude.toFixed(7), lng: +pos.coords.longitude.toFixed(7) };
                setPinned(coords); onChange(coords); placeMarker(coords);
                setLocating(false);
            },
            () => { setSearchError('Could not get your location.'); setLocating(false); },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

    // ─── Clear ────────────────────────────────────────────────────────────────
    const handleClear = () => {
        setPinned(null); onChange(null); placeMarker(null);
        setSearch(''); setSearchError('');
        if (mapRef.current) mapRef.current.setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], DEFAULT_ZOOM);
    };

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="space-y-3">
            {/* Label + clear */}
            <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    {label}
                </Label>
                {pinned && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                        <X className="h-3 w-3" /> Clear pin
                    </button>
                )}
            </div>

            {/* Search bar */}
            <div className="flex gap-2">
                <Input
                    placeholder="Search address or place..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setSearchError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                    className="flex-1"
                />
                <Button type="button" variant="secondary" onClick={handleSearch} disabled={searching} className="shrink-0">
                    <Search className="h-4 w-4" />
                    <span className="ml-1.5 hidden sm:inline">{searching ? 'Searching…' : 'Search'}</span>
                </Button>
                <Button type="button" variant="outline" onClick={handleLocate} disabled={locating} title="Use my current location" className="shrink-0 px-3">
                    <LocateFixed className={`h-4 w-4 ${locating ? 'animate-pulse text-primary' : ''}`} />
                </Button>
            </div>

            {searchError && <p className="text-xs text-destructive">{searchError}</p>}

            {/*
                Map container.
                z-index:0 keeps the map BELOW Radix UI Select portals (z ~50+),
                so dropdown lists always render on top of the map tiles.
            */}
            <div
                className="relative rounded-xl overflow-hidden border border-border shadow-sm"
                style={{ zIndex: 0 }}
            >
                {/* Loading skeleton */}
                {!ready && (
                    <div className="h-[360px] flex items-center justify-center bg-muted/40">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <MapPin className="h-6 w-6 animate-bounce text-primary" />
                            <span className="text-sm">Loading map…</span>
                        </div>
                    </div>
                )}

                {/* Leaflet mount point */}
                <div
                    ref={containerRef}
                    style={{ height: '360px', width: '100%', display: ready ? 'block' : 'none' }}
                />

                {/* "Click to pin" instruction shown before first pin */}
                {ready && !pinned && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[400] pointer-events-none">
                        <div className="bg-background/90 backdrop-blur-sm text-xs text-muted-foreground px-3 py-1.5 rounded-full border border-border shadow-sm flex items-center gap-1.5">
                            <MapPin className="h-3 w-3" />
                            Click on the map to drop a pin
                        </div>
                    </div>
                )}

                {/* Scroll-zoom hint */}
                {ready && (
                    <div className="absolute top-2 right-10 z-[400] pointer-events-none">
                        <div className="bg-background/80 backdrop-blur-sm text-[10px] text-muted-foreground px-2 py-1 rounded border border-border shadow-sm">
                            Click map to enable scroll zoom
                        </div>
                    </div>
                )}
            </div>

            {/* Coordinates display */}
            {pinned ? (
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Latitude</Label>
                        <div className="flex items-center h-9 px-3 rounded-md border border-border bg-muted/40 text-sm font-mono text-foreground">
                            {pinned.lat.toFixed(7)}
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Longitude</Label>
                        <div className="flex items-center h-9 px-3 rounded-md border border-border bg-muted/40 text-sm font-mono text-foreground">
                            {pinned.lng.toFixed(7)}
                        </div>
                    </div>
                </div>
            ) : (
                <p className="text-xs text-muted-foreground">
                    No location pinned yet. Click the map, search for an address, or use GPS.
                </p>
            )}
        </div>
    );
}
