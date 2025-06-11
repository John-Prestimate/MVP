import React, { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import { fromLonLat, toLonLat } from 'ol/proj';
import GeoJSON from 'ol/format/GeoJSON';
import osmtogeojson from 'osmtogeojson';
import { Fill, Stroke, Style, Icon, Text } from 'ol/style';
import { Select, Draw } from 'ol/interaction';
import { click } from 'ol/events/condition';
import { getArea, getLength } from 'ol/sphere';
import { createClient } from '@supabase/supabase-js';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  'https://kmmkfdoyehmjxnfbisxo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttbWtmZG95ZWhtam54ZmJpc3hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0ODk3MzMsImV4cCI6MjA2NDA2NTczM30.50cLLw7muIHarMgkbQsD-Sg0M5hqL20mY5p3Do55SHY'
);

const projectId = uuidv4();
const MENU_WIDTH = 340;

const MapView = () => {
  // --- Dynamic services loading ---
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [serviceType, setServiceType] = useState(''); // key of selected
  const serviceTypeRef = useRef(serviceType);
  useEffect(() => { serviceTypeRef.current = serviceType; }, [serviceType]);

  const [storyCount, setStoryCount] = useState(1);
  const storyCountRef = useRef(storyCount);
  useEffect(() => { storyCountRef.current = storyCount; }, [storyCount]);
  const [fenceHeight, setFenceHeight] = useState(6);
  const fenceHeightRef = useRef(fenceHeight);
  useEffect(() => { fenceHeightRef.current = fenceHeight; }, [fenceHeight]);
  const [addressInput, setAddressInput] = useState('');
  const [drawMode, setDrawMode] = useState<'Polygon' | 'LineString'>('Polygon');
  const [estimates, setEstimates] = useState<any[]>([]);
  const [lockedAddress, setLockedAddress] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 20, left: 20 });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Map/Layer refs
  const mapRef = useRef<Map | null>(null);
  const markerLayerRef = useRef<VectorLayer | null>(null);
  const buildingLayerRef = useRef<VectorLayer | null>(null);
  const drawingLayerRef = useRef<VectorLayer>(new VectorLayer({ source: new VectorSource() }));
  const drawInteractionRef = useRef<Draw | null>(null);
  const confirmedAddressRef = useRef<string | null>(null);

  // Load service_types from Supabase for the logged-in user
  useEffect(() => {
    async function loadServices() {
      setLoadingServices(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setServiceTypes([]);
        setLoadingServices(false);
        return;
      }
      const { data, error } = await supabase
        .from('business_settings')
        .select('service_types')
        .eq('user_id', user.id)
        .single();
      if (error || !data?.service_types) {
        setServiceTypes([]);
      } else {
        setServiceTypes(data.service_types);
        if (data.service_types.length > 0) setServiceType(data.service_types[0].key);
      }
      setLoadingServices(false);
    }
    loadServices();
  }, []);

  // When serviceType changes, update drawMode (if you store geometry per-service, adjust this logic)
  useEffect(() => {
    const svc = serviceTypes.find(s => s.key === serviceType);
    if (svc) {
      // crude guess: 'ft' means line, otherwise polygon
      setDrawMode(svc.unit === 'ft' ? 'LineString' : 'Polygon');
    }
  }, [serviceType, serviceTypes]);

  // Map interaction setup (minimal changes, but use serviceTypes for dynamic logic)
  useEffect(() => {
    if (mapRef.current) return;
    const map = new Map({
      target: 'map',
      layers: [
        new TileLayer({
          source: new XYZ({
            url: 'https://api.maptiler.com/maps/satellite/256/{z}/{x}/{y}.jpg?key=33WqaD71YQyANT8jMxRO',
          }),
        }),
        drawingLayerRef.current,
      ],
      view: new View({
        center: fromLonLat([-94.5621, 39.1635]),
        zoom: 17,
      }),
    });
    mapRef.current = map;
    const markerSource = new VectorSource();
    const markerLayer = new VectorLayer({
      source: markerSource,
      style: (feature) =>
        new Style({
          image: new Icon({
            src: 'https://img.icons8.com/emoji/48/round-pushpin-emoji.png',
            scale: 0.6,
            anchor: [0.5, 1],
          }),
          text: new Text({
            text: feature.get('label') || '',
            font: 'bold 14px Arial',
            fill: new Fill({ color: '#333' }),
            stroke: new Stroke({ color: '#fff', width: 2 }),
            offsetY: -30,
          }),
        }),
    });
    map.addLayer(markerLayer);
    markerLayerRef.current = markerLayer;
    fetchBuildingsInView();
    addDrawInteraction();
    // eslint-disable-next-line
  }, []);

  // Drawing logic
  const addDrawInteraction = () => {
    if (!mapRef.current) return;
    removeDrawInteraction();
    const svc = serviceTypes.find(s => s.key === serviceTypeRef.current);
    if (!svc) return;
    const draw = new Draw({
      source: drawingLayerRef.current.getSource()!,
      type: drawMode,
    });
    draw.on('drawend', async (e) => {
      const geometry = e.feature.getGeometry();
      const address =
        confirmedAddressRef.current ||
        `Lat: ${toLonLat(geometry.getFirstCoordinate())[1].toFixed(5)}, Lon: ${toLonLat(geometry.getFirstCoordinate())[0].toFixed(5)}`;
      await handleEstimate({
        geometry,
        service: serviceTypeRef.current,
        address,
        storyCount: storyCountRef.current,
        fenceHeight: fenceHeightRef.current,
      });
    });
    mapRef.current.addInteraction(draw);
    drawInteractionRef.current = draw;
  };

  const removeDrawInteraction = () => {
    if (mapRef.current && drawInteractionRef.current) {
      mapRef.current.removeInteraction(drawInteractionRef.current);
      drawInteractionRef.current = null;
    }
  };

  // When drawMode or serviceType changes, update draw tool
  useEffect(() => {
    addDrawInteraction();
    // eslint-disable-next-line
  }, [drawMode, serviceType, serviceTypes]);

  // --- Building outlines from OSM ---
  const fetchBuildingsInView = async () => {
    if (!mapRef.current) return;
    const view = mapRef.current.getView();
    const extent = view.calculateExtent(mapRef.current.getSize());
    const [minX, minY, maxX, maxY] = extent;
    const [west, south] = toLonLat([minX, minY]);
    const [east, north] = toLonLat([maxX, maxY]);
    const query = `
      [out:json];
      (
        way["building"](${south},${west},${north},${east});
      );
      out body;
      >;
      out skel qt;
    `;
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query.trim(),
    });
    const data = await response.json();
    const geojson = osmtogeojson(data);
    const format = new GeoJSON();
    const features = format.readFeatures(geojson, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857',
    });
    const vectorSource = new VectorSource({ features });
    if (buildingLayerRef.current) {
      buildingLayerRef.current.setSource(vectorSource);
    } else {
      const vectorLayer = new VectorLayer({
        source: vectorSource,
        style: new Style({
          stroke: new Stroke({ color: 'rgba(0,191,255,0.5)', width: 1 }),
          fill: new Fill({ color: 'rgba(0,191,255,0.04)' }),
        }),
      });
      buildingLayerRef.current = vectorLayer;
      mapRef.current?.addLayer(vectorLayer);
    }
  };

  // --- Address search ---
  const handleSearch = async () => {
    if (!addressInput.trim()) return;
    const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(addressInput)}.json?key=33WqaD71YQyANT8jMxRO`;
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const data = await res.json();
      if (data.features?.length > 0) {
        const feature = data.features[0];
        const [lon, lat] = feature.center;
        const coords = fromLonLat([lon, lat]);
        const label = feature.place_name || addressInput;
        confirmedAddressRef.current = label;
        setLockedAddress(label);
        const view = mapRef.current?.getView();
        if (view) {
          view.animate({ center: coords, zoom: 18, duration: 1000 });
          const marker = new Feature({ geometry: new Point(coords) });
          marker.set('label', label);
          markerLayerRef.current?.getSource()?.clear();
          markerLayerRef.current?.getSource()?.addFeature(marker);
          setTimeout(fetchBuildingsInView, 1200);
        }
      }
    } catch (err) {
      console.error('Geocoder error:', err);
    }
  };

  // --- Estimate logic (use service from DB) ---
  const handleEstimate = async ({
    geometry,
    service,
    address,
    storyCount,
    fenceHeight,
  }: {
    geometry: any;
    service: string;
    address: string;
    storyCount?: number;
    fenceHeight?: number;
  }) => {
    const svc = serviceTypes.find(s => s.key === service);
    if (!svc) return;

    let measurement = 0;
    if (svc.unit === 'ft²') {
      // area in sq ft (for polygons)
      measurement = parseFloat((getArea(geometry) * 10.7639).toFixed(0));
    } else if (svc.unit === 'ft') {
      // length in ft (for lines, like fences)
      measurement = parseFloat((getLength(geometry) * 3.28084 * (fenceHeight || 1)).toFixed(0));
    }
    // You can add custom logic per service here

    const cost = parseFloat((measurement * svc.base_price).toFixed(2));
    const description =
      svc.key === 'house' && storyCount
        ? `${storyCount}-story ${svc.label}`
        : svc.key === 'fence' && fenceHeight
        ? `${fenceHeight}ft ${svc.label}`
        : svc.label;

    const estimate = {
      id: uuidv4(),
      project_id: projectId,
      address,
      service_type: svc.key,
      measurement,
      unit: svc.unit,
      estimated_cost: cost,
      description,
    };
    setEstimates((prev) => [...prev, estimate]);
    await saveEstimateToSupabase(estimate);
    await sendEstimateEmail(estimate);
  };

  // --- Save estimate to DB and email (no changes) ---
  const sendEstimateEmail = async (estimate: any) => {
    try {
      await fetch('https://formspree.io/f/mqabzklw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: estimate.address,
          service_type: estimate.service_type,
          measurement: estimate.measurement,
          estimated_cost: estimate.estimated_cost,
          description: estimate.description,
        }),
      });
    } catch (error) {
      console.error('Formspree submission failed:', error);
    }
  };

  const saveEstimateToSupabase = async (estimate: any) => {
    try {
      await supabase.from('estimates').insert([estimate]);
    } catch (error) {
      console.error('Supabase save failed:', error);
    }
  };

  const handleReset = () => {
    drawingLayerRef.current.getSource()?.clear();
    setEstimates([]);
    markerLayerRef.current?.getSource()?.clear();
    if (buildingLayerRef.current) {
      const source = buildingLayerRef.current.getSource();
      if (source) source.clear();
    }
    setAddressInput('');
    setLockedAddress(null);
    confirmedAddressRef.current = null;
  };

  const handleUndo = () => {
    const source = drawingLayerRef.current.getSource();
    const features = source?.getFeatures();
    if (features?.length) {
      source?.removeFeature(features[features.length - 1]);
    }
  };

  // Draggable menu logic
  const handleMenuMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).className !== 'menu-drag-handle') return;
    setDragging(true);
    dragOffset.current = {
      x: e.clientX - menuPos.left,
      y: e.clientY - menuPos.top,
    };
    e.preventDefault();
  };

  useEffect(() => {
    if (!dragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      setMenuPos({
        left: Math.max(0, e.clientX - dragOffset.current.x),
        top: Math.max(0, e.clientY - dragOffset.current.y),
      });
    };
    const handleMouseUp = () => setDragging(false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, menuPos.left, menuPos.top]);

  // --- UI ---
  // Determine if "Stories" or "Fence Height" is needed for current service
  const currentSvc = serviceTypes.find(s => s.key === serviceType);
  const needsStory = currentSvc?.key === 'house';
  const needsFenceHeight = currentSvc?.key === 'fence';

  return (
    <div style={{ position: 'relative' }}>
      <div id="map" style={{ width: '100%', height: '600px' }}></div>
      <div
        style={{
          position: 'absolute',
          top: menuPos.top,
          left: menuPos.left,
          width: MENU_WIDTH,
          backgroundColor: 'white',
          borderRadius: 8,
          boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
          zIndex: 1000,
          userSelect: dragging ? 'none' : 'auto',
          minHeight: 160,
          boxSizing: 'border-box',
        }}
        onMouseDown={handleMenuMouseDown}
      >
        <div
          className="menu-drag-handle"
          style={{
            boxSizing: 'border-box',
            width: '100%',
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            background: "linear-gradient(to right, #f8fafc 70%, #e0e7ef 100%)",
            borderBottom: '1px solid #e0e7ef',
            display: 'flex',
            alignItems: 'center',
            height: 30,
            fontWeight: 600,
            letterSpacing: 0.5,
            fontSize: 15,
            cursor: 'move',
            paddingLeft: 16,
            paddingRight: 16,
          }}
        >
          Prestimate
        </div>
        <div style={{ boxSizing: 'border-box', width: '100%', padding: 16 }}>
          <div style={{ marginBottom: 10 }}>
            <label style={{ width: 100, display: 'inline-block', fontWeight: 500 }}>
              Service Type:
            </label>
            {loadingServices ? (
              <span>Loading...</span>
            ) : (
              <select
                value={serviceType}
                onChange={e => setServiceType(e.target.value)}
                style={{ width: 190, fontSize: 15, padding: '2px 5px' }}
              >
                {serviceTypes.map(svc => (
                  <option key={svc.key} value={svc.key}>
                    {svc.label}
                  </option>
                ))}
              </select>
            )}
          </div>
          {needsStory && (
            <div style={{ marginBottom: 10 }}>
              <label style={{ width: 100, display: 'inline-block', fontWeight: 500 }}>
                Stories:
              </label>
              <select
                value={storyCount}
                onChange={e => setStoryCount(Number(e.target.value))}
                style={{ width: 190, fontSize: 15, padding: '2px 5px' }}
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
              </select>
            </div>
          )}
          {needsFenceHeight && (
            <div style={{ marginBottom: 10 }}>
              <label style={{ width: 100, display: 'inline-block', fontWeight: 500 }}>
                Fence Height:
              </label>
              <select
                value={fenceHeight}
                onChange={e => setFenceHeight(Number(e.target.value))}
                style={{ width: 190, fontSize: 15, padding: '2px 5px' }}
              >
                <option value={4}>4 ft</option>
                <option value={6}>6 ft</option>
                <option value={8}>8 ft</option>
              </select>
            </div>
          )}
          <div style={{ marginBottom: 10 }}>
            <label style={{ width: 100, display: 'inline-block', fontWeight: 500 }}>
              Draw Mode:
            </label>
            <select
              value={drawMode}
              style={{ width: 190, fontSize: 15, padding: '2px 5px' }}
              disabled
            >
              <option value="Polygon">Polygon</option>
              <option value="LineString">Line</option>
            </select>
          </div>
          <div style={{ fontSize: 13, color: "#0b80ff", margin: "4px 0 10px 0", minHeight: 20 }}>
            {drawMode === 'Polygon' && (
              <>Draw a polygon on the map to estimate.</>
            )}
            {drawMode === 'LineString' && (
              <>Draw a line on the map to estimate.</>
            )}
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ width: 100, display: 'inline-block', fontWeight: 500 }}>
              Address:
            </label>
            <input
              value={addressInput}
              onChange={e => setAddressInput(e.target.value)}
              style={{ width: 133, fontSize: 15, padding: '2px 5px', marginRight: 4 }}
            />
            <button onClick={handleSearch} style={{ fontSize: 14, padding: '2px 10px' }}>
              Go
            </button>
          </div>
          <div style={{ fontSize: 12, color: lockedAddress ? 'green' : '#999', marginBottom: 10, minHeight: 18 }}>
            {lockedAddress
              ? <>Confirmed: <b>{lockedAddress}</b></>
              : <>Confirm address with "Go" before estimating.</>
            }
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <button onClick={handleReset} style={{
              flex: 1,
              fontSize: 14,
              padding: '6px 0',
              borderRadius: 5,
              border: '1px solid #e0e7ef',
              background: '#f9fafc',
              cursor: 'pointer'
            }}>
              Reset
            </button>
            <button onClick={handleUndo} style={{
              flex: 1,
              fontSize: 14,
              padding: '6px 0',
              borderRadius: 5,
              border: '1px solid #e0e7ef',
              background: '#f9fafc',
              cursor: 'pointer'
            }}>
              Undo Last Shape
            </button>
          </div>
          {estimates.length > 0 && (
            <div style={{
              marginTop: 10,
              background: '#f8fafc',
              borderRadius: 6,
              padding: '8px 10px',
              border: '1px solid #e0e7ef'
            }}>
              <strong>Estimates:</strong>
              <ul style={{ margin: '6px 0 0 10px', padding: 0, fontSize: 14 }}>
                {estimates.map((e) => (
                  <li key={e.id} style={{ marginBottom: 2 }}>
                    <strong>{e.description}</strong>: {e.measurement} {e.unit} — <b>${e.estimated_cost}</b>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapView;