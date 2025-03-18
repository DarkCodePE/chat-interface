"use client";

import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = "pk.eyJ1Ijoib3JsYW5kb2t1YW4iLCJhIjoiY204ODl1NjZ1MGU4czJtb2FjdjZ0Z3pqbiJ9.QDnkyIdSffpVMt00EvfuAg";

interface Plant {
    id: string;
    name: string;
    address: string;
    phone: string;
    hours: string;
    coordinates: string;
    distance_km?: number;
    duration_min?: number;
    distance_text?: string;
    duration_text?: string;
}

interface MapboxMapProps {
    plants: Plant[];
    userLocation?: [number, number];
    height?: string;
    width?: string;
    className?: string;
}

const MapboxMap: React.FC<MapboxMapProps> = ({
                                                 plants,
                                                 userLocation,
                                                 height = "300px",
                                                 width = "100%",
                                                 className = ""
                                             }) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const [mapLoaded, setMapLoaded] = useState(false);

    useEffect(() => {
        if (!mapContainer.current) return;

        const defaultCenter: [number, number] = [-77.0428, -12.0464];

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v11',
            center: userLocation || defaultCenter,
            zoom: userLocation ? 11 : 9,
            attributionControl: false
        });

        map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

        map.current.on('load', () => setMapLoaded(true));

        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, [userLocation]);

    useEffect(() => {
        if (!mapLoaded || !map.current) return;

        document.querySelectorAll('.mapboxgl-marker').forEach(marker => marker.remove());

        const bounds = new mapboxgl.LngLatBounds();

        if (userLocation) {
            new mapboxgl.Marker({ color: '#3886FF' })
                .setLngLat(userLocation)
                .setPopup(new mapboxgl.Popup({ offset: 25 }).setText('Tu ubicación'))
                .addTo(map.current);
            bounds.extend(userLocation);
        }

        plants.forEach((plant, index) => {
            const coords = plant.coordinates.split(',').map(Number) as [number, number];

            const el = document.createElement('div');
            el.className = 'plant-marker';
            el.style.backgroundColor = index === 0 ? '#4CAF50' : '#FF9800';
            el.style.width = index === 0 ? '24px' : '20px';
            el.style.height = index === 0 ? '24px' : '20px';
            el.style.borderRadius = '50%';
            el.style.border = '2px solid white';
            el.style.boxShadow = '0 0 0 2px rgba(0,0,0,0.2)';
            el.style.cursor = 'pointer';
            el.style.display = 'flex';
            el.style.alignItems = 'center';
            el.style.justifyContent = 'center';
            el.style.color = 'white';
            el.style.fontWeight = 'bold';
            el.style.fontSize = '12px';
            el.innerHTML = (index + 1).toString();

            new mapboxgl.Marker(el)
                .setLngLat(coords)
                .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`
                    <h3 style="font-weight: bold;">${plant.name}</h3>
                    <p>${plant.address}</p>
                    <p>📞 ${plant.phone}</p>
                    <p>⏰ ${plant.hours}</p>
                    ${plant.distance_text ? `<p>🚗 ${plant.distance_text} (${plant.duration_text})</p>` : ''}
                `))
                .addTo(map.current);

            bounds.extend(coords);
        });

        if (plants.length > 0) {
            map.current.fitBounds(bounds, {
                padding: 50,
                maxZoom: 14,
                duration: 1000
            });
        }
    }, [mapLoaded, plants, userLocation]);

    return (
        <div ref={mapContainer} style={{ height, width }} className={`rounded-lg border border-muted ${className}`}>
            <style jsx global>{`
                .mapboxgl-popup-content {
                    padding: 15px;
                    border-radius: 8px;
                    max-width: 250px;
                }
            `}</style>
        </div>
    );
};

export default MapboxMap;
