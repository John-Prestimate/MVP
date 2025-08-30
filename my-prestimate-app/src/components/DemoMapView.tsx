import React, { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { fromLonLat } from 'ol/proj';
import { Draw } from 'ol/interaction';
import { Fill, Stroke, Style } from 'ol/style';

const DEMO_CENTER = fromLonLat([-98.5795, 39.8283]); // Center of USA

const DemoMapView: React.FC = () => {
  const mapRef = useRef<Map | null>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const drawRef = useRef<Draw | null>(null);
  const vectorSourceRef = useRef<VectorSource>(new VectorSource());
  const [drawMode, setDrawMode] = useState<'Polygon' | 'LineString'>('Polygon');
  const [address, setAddress] = useState('');

  // Initialize map
  useEffect(() => {
    if (mapRef.current || !mapDivRef.current) return;
    const tileLayer = new TileLayer({
      source: new (require('ol/source/OSM').default)(),
    });
    const vectorLayer = new VectorLayer({
      source: vectorSourceRef.current,
      style: new Style({
        fill: new Fill({ color: 'rgba(0, 123, 255, 0.2)' }),
        stroke: new Stroke({ color: '#007bff', width: 2 }),
      }),
    });
    const map = new Map({
      target: mapDivRef.current,
      layers: [tileLayer, vectorLayer],
      view: new View({ center: DEMO_CENTER, zoom: 4 }),
    });
    mapRef.current = map;
    return () => { map.setTarget(undefined); };
  }, []);

  // Drawing interaction
  useEffect(() => {
    if (!mapRef.current) return;
    if (drawRef.current) {
      mapRef.current.removeInteraction(drawRef.current);
    }
    const draw = new Draw({
      source: vectorSourceRef.current,
      type: drawMode,
    });
    drawRef.current = draw;
    mapRef.current.addInteraction(draw);
    return () => {
      if (mapRef.current && drawRef.current) {
        mapRef.current.removeInteraction(drawRef.current);
      }
    };
  }, [drawMode]);

  // Mock address search: recenters map to a fixed location
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapRef.current) return;
    // Demo: always center to New York
    mapRef.current.getView().setCenter(fromLonLat([-74.006, 40.7128]));
    mapRef.current.getView().setZoom(12);
  };

  return (
    <div style={{ width: '100%', height: '400px', position: 'relative', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <form onSubmit={handleSearch} style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, background: 'rgba(255,255,255,0.9)', padding: 8, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <input
          type="text"
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="Search address (demo)"
          style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid #ccc', width: 180 }}
        />
        <button type="submit" style={{ marginLeft: 8, padding: '6px 12px', borderRadius: 4, background: '#007bff', color: '#fff', border: 'none' }}>Go</button>
      </form>
      <div style={{ position: 'absolute', top: 60, left: 16, zIndex: 10, background: 'rgba(255,255,255,0.9)', padding: 8, borderRadius: 8 }}>
        <label style={{ marginRight: 8 }}>Draw mode:</label>
        <select value={drawMode} onChange={e => setDrawMode(e.target.value as 'Polygon' | 'LineString')} style={{ padding: '4px 8px', borderRadius: 4 }}>
          <option value="Polygon">Polygon</option>
          <option value="LineString">Line</option>
        </select>
      </div>
      <div ref={mapDivRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default DemoMapView;
