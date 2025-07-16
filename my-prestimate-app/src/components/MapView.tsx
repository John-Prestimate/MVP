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
import { Draw } from 'ol/interaction';
import { getArea, getLength } from 'ol/sphere';
import { supabase } from '../supabaseClient'; // Use shared client
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { v4 as uuidv4 } from 'uuid';

const projectId = uuidv4();
const MENU_WIDTH = 340;

// Fallback static config for robust operation
const DEFAULT_SERVICE_TYPES = [
  { key: 'house', label: 'House Wash', unit: 'ft²', base_price: 0.25 },
  { key: 'roof', label: 'Roof Wash', unit: 'ft²', base_price: 0.30 },
  { key: 'fence', label: 'Fence Wash', unit: 'ft', base_price: 0.40 },
  { key: 'driveway', label: 'Driveway Wash', unit: 'ft²', base_price: 0.20 },
  { key: 'deck', label: 'Deck Wash', unit: 'ft²', base_price: 0.20 },
  { key: 'patio', label: 'Patio Wash', unit: 'ft²', base_price: 0.20 },
];

// Helper to get user ID from URL
function getUserIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('user');
}

// Define Customer type for correct typing
interface Customer {
  id: string;
  created_at: string;
  subscription_tier: string;
  subscription_active: boolean;
  // Add more fields as needed
}

const MapView = () => {
  // --- Customer subscription info ---
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loadingCustomer, setLoadingCustomer] = useState(true);

  useEffect(() => {
    const userId = getUserIdFromUrl();
    if (!userId) {
      setLoadingCustomer(false);
      return;
    }
    async function fetchCustomer() {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('id', userId)
        .single();
      setCustomer(data);
      setLoadingCustomer(false);
    }
    fetchCustomer();
  }, []);

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
  // const [lockedAddress, setLockedAddress] = useState<string | null>(null); // Unused
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
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Load service_types from Supabase for the logged-in user
  useEffect(() => {
    async function loadServices() {
      setLoadingServices(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setServiceTypes(DEFAULT_SERVICE_TYPES);
          setServiceType(DEFAULT_SERVICE_TYPES[0].key);
          setLoadingServices(false);
          return;
        }
        const { data } = await supabase
          .from('business_settings')
          .select('service_types')
          .eq('user_id', user.id)
          .single();
        if (
          !data?.service_types ||
          !Array.isArray(data.service_types) ||
          data.service_types.length === 0
        ) {
          setServiceTypes(DEFAULT_SERVICE_TYPES);
          setServiceType(DEFAULT_SERVICE_TYPES[0].key);
        } else {
          setServiceTypes(data.service_types);
          setServiceType(data.service_types[0].key);
        }
      } catch (err) {
        setServiceTypes(DEFAULT_SERVICE_TYPES);
        setServiceType(DEFAULT_SERVICE_TYPES[0].key);
        // Optionally log error
        console.error('Failed to load services from backend, using default config.', err);
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
    // Only run if the container is available and map is not already initialized
    if (!mapContainerRef.current || mapRef.current) return;

    // Defensive: double-check the container exists
    const container = mapContainerRef.current;
    if (!container) {
      console.error("Map container not found! (double-check)");
      return;
    }

    const map = new Map({
      target: container,
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
  }, [mapContainerRef.current]); // Depend on ref

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
      let address = confirmedAddressRef.current;
      if (!address) {
        if (
          geometry &&
          typeof (geometry as any).getFirstCoordinate === 'function'
        ) {
          const coords = (geometry as any).getFirstCoordinate();
          address = `Lat: ${toLonLat(coords)[1].toFixed(5)}, Lon: ${toLonLat(coords)[0].toFixed(5)}`;
        } else {
          address = 'Unknown location';
        }
      }
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
        // setLockedAddress(label);
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

  // --- Subscription logic helpers ---
  // Returns true if the user is in their 30-day free trial
  function isTrialActive() {
    if (!customer || !customer.created_at) return false;
    const created = new Date(customer.created_at);
    const now = new Date();
    const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 30;
  }

  // Returns true if the user is Pro
  function isPro() {
    return customer && customer.subscription_tier === 'Pro';
  }

  // Returns true if the user is Basic
  function isBasic() {
    return customer && customer.subscription_tier === 'Basic';
  }

  // --- Feature Gating ---
  // Reason: Block estimator if trial expired, not subscribed, or subscription is inactive (per Stripe webhook)
  const isTrial = isTrialActive();
  const isProUser = isPro();
  const isBasicUser = isBasic();
  const isSubscriptionActive = customer && (customer.subscription_active === true);
  const isBlocked = (!isProUser && !isBasicUser && !isTrial) || !isSubscriptionActive;

  // --- Estimate count for Basic plan enforcement ---
  const [basicEstimateCount, setBasicEstimateCount] = useState<number>(0);

  useEffect(() => {
    // Only fetch for Basic users
    if (!isBasicUser || !customer?.id) return;
    async function fetchEstimateCount() {
      const { count } = await supabase
        .from('estimates')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', customer?.id); // Fix: use optional chaining
      if (typeof count === 'number') {
        setBasicEstimateCount(count);
      }
    }
    fetchEstimateCount();
  }, [isBasicUser, customer]);

  const BASIC_ESTIMATE_LIMIT = 100;
  const isBasicLimitReached = isBasicUser && basicEstimateCount >= BASIC_ESTIMATE_LIMIT;

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
    if (isBlocked) return;
    if (isBasicLimitReached) return;
    const svc = serviceTypes.find(s => s.key === service);
    if (!svc) return;
    let measurement = 0;
    if (svc.unit === 'ft²') {
      measurement = parseFloat((getArea(geometry) * 10.7639).toFixed(0));
    } else if (svc.unit === 'ft') {
      measurement = parseFloat((getLength(geometry) * 3.28084 * (fenceHeight || 1)).toFixed(0));
    }
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
      address: (isProUser || isTrial) ? address : '', // Basic: no address
      service_type: svc.key,
      measurement,
      unit: svc.unit,
      estimated_cost: cost,
      description,
      user_id: customer?.id || null, // For tracking
    };
    setEstimates((prev) => [...prev, estimate]);
    await saveEstimateToSupabase(estimate);
    await sendEstimateEmail(estimate);
    if (isBasicUser) setBasicEstimateCount(c => c + 1);
  };

  // --- Save estimate to DB and email (feature gated) ---
  const sendEstimateEmail = async (estimate: any) => {
    try {
      await fetch('https://formspree.io/f/mqabzklw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: (isProUser || isTrial) ? estimate.address : undefined, // Basic: no address
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
    // setLockedAddress(null);
    confirmedAddressRef.current = null;
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

  // --- Render ---
  if (loadingCustomer) return <div>Loading customer data...</div>;
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Map container */}
      <div
        ref={mapContainerRef}
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          touchAction: 'none',
          height: '100vh', // Ensures the map is visible
        }}
      />
      {/* Menu panel (collapsed by default) */}
      <div
        className="menu-panel"
        style={{
          width: MENU_WIDTH,
          backgroundColor: '#fff',
          borderLeft: '1px solid #ddd',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Draggable handle */}
        <div
          className="menu-drag-handle"
          style={{
            width: '100%',
            height: 10,
            backgroundColor: '#f0f0f0',
            cursor: 'ns-resize',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
          onMouseDown={handleMenuMouseDown}
        />
        {/* Service type selection */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: 'bold', marginBottom: 8, display: 'block' }}>
            Select Service Type
          </label>
          <select
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            disabled={loadingServices}
            style={{
              width: '100%',
              padding: 8,
              fontSize: 14,
              borderRadius: 4,
              border: '1px solid #ccc',
            }}
          >
            {serviceTypes.map((type) => (
              <option key={type.key} value={type.key}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        {/* Address input and search */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: 'bold', marginBottom: 8, display: 'block' }}>
            Enter Address
          </label>
          <input
            type="text"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            placeholder="e.g. 123 Main St, Anytown, USA"
            style={{
              width: '100%',
              padding: 8,
              fontSize: 14,
              borderRadius: 4,
              border: '1px solid #ccc',
            }}
          />
          <button
            onClick={handleSearch}
            style={{
              marginTop: 8,
              width: '100%',
              padding: 10,
              fontSize: 14,
              borderRadius: 4,
              border: 'none',
              backgroundColor: '#007bff',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Search
          </button>
        </div>
        {/* Story and height inputs (for fence/house estimates) */}
        {(serviceType === 'house' || serviceType === 'fence') && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 'bold', marginBottom: 8, display: 'block' }}>
              Number of Stories
            </label>
            <input
              type="number"
              value={storyCount}
              onChange={(e) => setStoryCount(Math.max(1, parseInt(e.target.value)))}
              min="1"
              style={{
                width: '100%',
                padding: 8,
                fontSize: 14,
                borderRadius: 4,
                border: '1px solid #ccc',
              }}
            />
            {serviceType === 'fence' && (
              <>
                <label style={{ fontWeight: 'bold', marginTop: 16, marginBottom: 8, display: 'block' }}>
                  Fence Height (ft)
                </label>
                <input
                  type="number"
                  value={fenceHeight}
                  onChange={(e) => setFenceHeight(Math.max(1, parseInt(e.target.value)))}
                  min="1"
                  style={{
                    width: '100%',
                    padding: 8,
                    fontSize: 14,
                    borderRadius: 4,
                    border: '1px solid #ccc',
                  }}
                />
              </>
            )}
          </div>
        )}
        {/* Draw/Reset buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto' }}>
          <button
            onClick={handleReset}
            style={{
              padding: 10,
              fontSize: 14,
              borderRadius: 4,
              border: 'none',
              backgroundColor: '#dc3545',
              color: '#fff',
              cursor: 'pointer',
              flex: 1,
              marginRight: 8,
            }}
          >
            Reset
          </button>
          <button
            onClick={() => setDrawMode(drawMode === 'Polygon' ? 'LineString' : 'Polygon')}
            style={{
              padding: 10,
              fontSize: 14,
              borderRadius: 4,
              border: 'none',
              backgroundColor: '#28a745',
              color: '#fff',
              cursor: 'pointer',
              flex: 1,
            }}
          >
            {drawMode === 'Polygon' ? 'Draw Line' : 'Draw Area'}
          </button>
        </div>
        {/* Estimates list (collapsed by default) */}
        <div
          style={{
            marginTop: 16,
            padding: 16,
            borderRadius: 4,
            border: '1px solid #ddd',
            backgroundColor: '#f9f9f9',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Estimates</div>
            {estimates.length === 0 ? (
            <div style={{ color: '#666', fontSize: 14 }}>No estimates generated yet.</div>
            ) : (
            estimates.map((estimate) => (
              <div
              key={estimate.id}
              style={{
                padding: 8,
                borderRadius: 4,
                border: '1px solid #007bff',
                backgroundColor: '#fff',
                marginBottom: 8,
              }}
              >
              <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{estimate.description}</div>
              <div style={{ color: '#555', fontSize: 13, marginBottom: 4 }}>
                Address: {estimate.address}
              </div>
              <div style={{ color: '#555', fontSize: 13, marginBottom: 4 }}>
                Service Type: {estimate.service_type}
              </div>
              <div style={{ color: '#555', fontSize: 13, marginBottom: 4 }}>
                Measurement: {estimate.measurement} {estimate.unit}
              </div>
              <div style={{ color: '#555', fontSize: 13, marginBottom: 4 }}>
                Estimated Cost: ${estimate.estimated_cost.toFixed(2)}
              </div>
              </div>
            ))
            )}
        </div>
      </div>
    </div>
  );
};

export default MapView;