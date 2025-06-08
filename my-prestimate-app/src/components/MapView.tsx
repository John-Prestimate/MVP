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

// --- Service config for all pricing/logic/geometry ---
const SERVICE_CONFIG = {
  house: {
    label: (stories: number) => `${stories}-story House Wash`,
    calc: (geom: any, { storyCount }: { storyCount: number }) => {
      const perimeter = getLength(geom) * 3.28084;
      const surfaceArea = perimeter * storyCount * 9;
      return {
        measurement: parseFloat(surfaceArea.toFixed(0)),
        cost: parseFloat((surfaceArea * 0.25).toFixed(2)),
        unit: 'ft²',
      };
    },
    geometry: 'Polygon',
    requiresBuildingClick: true,
    requiresDraw: false,
  },
  roof: {
    label: () => 'Roof Wash',
    calc: (geom: any) => {
      const area = getArea(geom) * 10.7639;
      return {
        measurement: parseFloat(area.toFixed(0)),
        cost: parseFloat((area * 0.30).toFixed(2)),
        unit: 'ft²',
      };
    },
    geometry: 'Polygon',
    requiresBuildingClick: true,
    requiresDraw: false,
  },
  fence: {
    label: (height: number) => `${height}ft Fence Wash`,
    calc: (geom: any, { fenceHeight }: { fenceHeight: number }) => {
      const length = getLength(geom) * 3.28084;
      const measurement = parseFloat((length * fenceHeight).toFixed(0));
      return {
        measurement,
        cost: parseFloat((measurement * 0.40).toFixed(2)),
        unit: 'ft',
      };
    },
    geometry: 'LineString',
    requiresBuildingClick: false,
    requiresDraw: true,
  },
  driveway: {
    label: () => 'Driveway Wash',
    calc: (geom: any) => {
      const area = getArea(geom) * 10.7639;
      return {
        measurement: parseFloat(area.toFixed(0)),
        cost: parseFloat((area * 0.20).toFixed(2)),
        unit: 'ft²',
      };
    },
    geometry: 'Polygon',
    requiresBuildingClick: false,
    requiresDraw: true,
  },
  deck: {
    label: () => 'Deck Wash',
    calc: (geom: any) => {
      const area = getArea(geom) * 10.7639;
      return {
        measurement: parseFloat(area.toFixed(0)),
        cost: parseFloat((area * 0.20).toFixed(2)),
        unit: 'ft²',
      };
    },
    geometry: 'Polygon',
    requiresBuildingClick: false,
    requiresDraw: true,
  },
  patio: {
    label: () => 'Patio Wash',
    calc: (geom: any) => {
      const area = getArea(geom) * 10.7639;
      return {
        measurement: parseFloat(area.toFixed(0)),
        cost: parseFloat((area * 0.20).toFixed(2)),
        unit: 'ft²',
      };
    },
    geometry: 'Polygon',
    requiresBuildingClick: false,
    requiresDraw: true,
  },
};

const supabase = createClient(
  'https://kmmkfdoyehmjxnfbisxo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttbWtmZG95ZWhtam54ZmJpc3hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0ODk3MzMsImV4cCI6MjA2NDA2NTczM30.50cLLw7muIHarMgkbQsD-Sg0M5hqL20mY5p3Do55SHY'
);

const projectId = uuidv4();

const MENU_WIDTH = 340;

const MapView = () => {
  const mapRef = useRef<Map | null>(null);
  const markerLayerRef = useRef<VectorLayer | null>(null);
  const buildingLayerRef = useRef<VectorLayer | null>(null);
  const drawingLayerRef = useRef<VectorLayer>(new VectorLayer({ source: new VectorSource() }));
  const drawInteractionRef = useRef<Draw | null>(null);
  const confirmedAddressRef = useRef<string | null>(null);

  // For current state in event handlers
  const [serviceType, setServiceType] = useState('house');
  const serviceTypeRef = useRef(serviceType);
  useEffect(() => { serviceTypeRef.current = serviceType; }, [serviceType]);

  const [storyCount, setStoryCount] = useState(1);
  const storyCountRef = useRef(storyCount);
  useEffect(() => { storyCountRef.current = storyCount; }, [storyCount]);

  const [fenceHeight, setFenceHeight] = useState(6);
  const fenceHeightRef = useRef(fenceHeight);
  useEffect(() => { fenceHeightRef.current = fenceHeight; }, [fenceHeight]);

  const [addressInput, setAddressInput] = useState('');
  const [drawMode, setDrawMode] = useState<'Polygon' | 'LineString'>(SERVICE_CONFIG['house'].geometry as 'Polygon' | 'LineString');
  const [estimates, setEstimates] = useState<any[]>([]);
  const [lockedAddress, setLockedAddress] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 20, left: 20 });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Clear confirmed address if the user edits input
  useEffect(() => {
    confirmedAddressRef.current = null;
    setLockedAddress(null);
  }, [addressInput]);

  // Auto-set draw mode and select tool when service changes
  useEffect(() => {
    const config = SERVICE_CONFIG[serviceTypeRef.current];
    setDrawMode(config.geometry as 'Polygon' | 'LineString');
    setTimeout(() => {
      if (config.requiresDraw) {
        addDrawInteraction();
      } else {
        removeDrawInteraction();
      }
      setupBuildingSelect();
    }, 0);
    // eslint-disable-next-line
  }, [serviceType]);

  // Keep building select up-to-date when building layer changes
  useEffect(() => {
    setupBuildingSelect();
    // eslint-disable-next-line
  }, [buildingLayerRef.current]);

  // Only enable building select when serviceType is house or roof
  const setupBuildingSelect = () => {
    if (!mapRef.current || !buildingLayerRef.current) return;
    mapRef.current.getInteractions().forEach(i => {
      if (i instanceof Select) mapRef.current?.removeInteraction(i);
    });
    if (serviceTypeRef.current !== "house" && serviceTypeRef.current !== "roof") return;
    const select = new Select({
      condition: click,
      layers: [buildingLayerRef.current],
      style: new Style({
        stroke: new Stroke({ color: '#FF0000', width: 2 }),
        fill: new Fill({ color: 'rgba(255,0,0,0.2)' }),
      }),
    });
    mapRef.current.addInteraction(select);
    select.on('select', async (e) => {
      const feature = e.selected[0];
      if (!feature) return;
      const currentService = serviceTypeRef.current;
      const config = SERVICE_CONFIG[currentService];
      if (!config.requiresBuildingClick) {
        alert('Building click is only supported for House or Roof Wash. Use the drawing tool for other services.');
        return;
      }
      const geom = feature.getGeometry();
      if (geom.getType() !== config.geometry) {
        alert(`Please use a ${config.geometry} for ${currentService} estimates.`);
        return;
      }
      const address =
        confirmedAddressRef.current ||
        `Lat: ${toLonLat(geom.getFirstCoordinate())[1].toFixed(5)}, Lon: ${toLonLat(geom.getFirstCoordinate())[0].toFixed(5)}`;
      await handleEstimate({
        geometry: geom,
        service: currentService,
        address,
        storyCount: storyCountRef.current,
        fenceHeight: fenceHeightRef.current,
      });
    });
  };

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
    const config = SERVICE_CONFIG[service];
    let calcResult, description;
    if (service === 'house') {
      calcResult = config.calc(geometry, { storyCount });
      description = config.label(storyCount!);
    } else if (service === 'fence') {
      calcResult = config.calc(geometry, { fenceHeight });
      description = config.label(fenceHeight!);
    } else if (service === 'roof') {
      calcResult = config.calc(geometry);
      description = config.label();
    } else {
      calcResult = config.calc(geometry);
      description = config.label();
    }
    const estimate = {
      id: uuidv4(),
      project_id: projectId,
      address,
      service_type: service,
      measurement: calcResult.measurement,
      unit: calcResult.unit,
      estimated_cost: calcResult.cost,
      description,
    };
    setEstimates((prev) => [...prev, estimate]);
    await saveEstimateToSupabase(estimate);
    await sendEstimateEmail(estimate);
  };

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
    console.log('Buildings loaded:', features.length);
    const vectorSource = new VectorSource({ features });
    if (buildingLayerRef.current) {
      buildingLayerRef.current.setSource(vectorSource);
    } else {
      const vectorLayer = new VectorLayer({
        source: vectorSource,
        style: new Style({
          stroke: new Stroke({ color: '#00FFFF', width: 1 }),
          fill: new Fill({ color: 'rgba(0,255,255,0.1)' }),
        }),
      });
      buildingLayerRef.current = vectorLayer;
      mapRef.current?.addLayer(vectorLayer);
    }
    setupBuildingSelect();
  };

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

  const addDrawInteraction = () => {
    if (!mapRef.current) return;
    removeDrawInteraction();
    const config = SERVICE_CONFIG[serviceTypeRef.current];
    if (!config.requiresDraw) return;
    const draw = new Draw({
      source: drawingLayerRef.current.getSource()!,
      type: config.geometry,
    });
    draw.on('drawend', async (e) => {
      const geometry = e.feature.getGeometry();
      if (geometry.getType() !== config.geometry) {
        alert(`Please use a ${config.geometry} for ${serviceTypeRef.current} estimates.`);
        return;
      }
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

  useEffect(() => {
    if (mapRef.current) return;
    const map = new Map({
      target: 'map',
      layers: [
        new TileLayer({
          source: new XYZ({
            url: 'https://api.maptiler.com/tiles/satellite/{z}/{x}/{y}.jpg?key=33WqaD71YQyANT8jMxRO',
            tileSize: 512,
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
    if (mapRef.current) {
      mapRef.current.getInteractions().forEach(i => {
        if (i instanceof Select) mapRef.current?.removeInteraction(i);
      });
      setupBuildingSelect();
    }
  };

  const handleUndo = () => {
    const source = drawingLayerRef.current.getSource();
    const features = source?.getFeatures();
    if (features?.length) {
      source?.removeFeature(features[features.length - 1]);
    }
  };

  const canDraw = SERVICE_CONFIG[serviceType].requiresDraw;
  const needsBuildingClick = SERVICE_CONFIG[serviceType].requiresBuildingClick;

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
            <select
              value={serviceType}
              onChange={e => setServiceType(e.target.value)}
              style={{ width: 190, fontSize: 15, padding: '2px 5px' }}
            >
              <option value="house">House Wash</option>
              <option value="roof">Roof Wash</option>
              <option value="fence">Fence Wash</option>
              <option value="driveway">Driveway Wash</option>
              <option value="deck">Deck Wash</option>
              <option value="patio">Patio Wash</option>
            </select>
          </div>
          {serviceType === 'house' && (
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
          {serviceType === 'fence' && (
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
            {needsBuildingClick && (
              <>Click a building outline on the map to estimate.</>
            )}
            {canDraw && (
              <>Draw a {drawMode === 'Polygon' ? 'polygon' : 'line'} on the map to estimate.</>
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