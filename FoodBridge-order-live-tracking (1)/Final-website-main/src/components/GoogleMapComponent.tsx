import React, { useState, useEffect } from 'react';
import { listenToLiveLocations, LiveLocationRecord } from '../services/firestoreNotifications';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  MapPin,
  Calendar,
  Clock,
  AlertCircle,
  Building2,
  Utensils,
  Navigation,
  CheckCircle,
  Sparkles,
  Route,
  Zap,
  ExternalLink,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';

declare const google: any;

export interface FoodPickupLocation {
  id: string;
  title: string;
  donorName: string;
  category: string;
  quantity: string;
  servings: number;
  address: string;
  lat: number;
  lng: number;
  pickupTime: string;
  expiryTime: string;
  status: 'available' | 'claimed' | 'in_transit';
}

const DEFAULT_CENTER = { lat: 1.3000, lng: 103.8350 }; // Central area

const SAMPLE_PICKUPS: FoodPickupLocation[] = [
  {
    id: 'fp-1',
    title: 'Surplus Banquet Buffet & Bakery Pastries',
    donorName: 'Grand Hyatt Hotel & Banquet',
    category: 'Cooked Meals & Pastries',
    quantity: '45 kg',
    servings: 120,
    address: '10 Scotts Road, Orchard District',
    lat: 1.3066,
    lng: 103.8329,
    pickupTime: 'Today, 2:00 PM – 4:00 PM',
    expiryTime: 'Within 6 hours',
    status: 'available',
  },
  {
    id: 'fp-2',
    title: 'Artisan Sourdough, Baguettes & Croissants',
    donorName: 'Golden Crust Bakery & Cafe',
    category: 'Bakery',
    quantity: '28 kg',
    servings: 80,
    address: '56 Zion Road, River Valley',
    lat: 1.2931,
    lng: 103.8344,
    pickupTime: 'Today, 5:30 PM – 7:00 PM',
    expiryTime: 'Within 12 hours',
    status: 'available',
  },
  {
    id: 'fp-3',
    title: 'Packaged Fresh Salads & Bento Boxes',
    donorName: 'Marina Corporate Catering Hub',
    category: 'Packaged Meals',
    quantity: '60 boxes',
    servings: 60,
    address: '8 Marina Boulevard, Financial Centre',
    lat: 1.2801,
    lng: 103.8542,
    pickupTime: 'Today, 3:00 PM – 4:30 PM',
    expiryTime: 'Within 4 hours',
    status: 'claimed',
  },
  {
    id: 'fp-4',
    title: 'Surplus Fresh Organic Fruits & Vegetables',
    donorName: 'Central Wholesale Fresh Mart',
    category: 'Fresh Produce',
    quantity: '110 kg',
    servings: 250,
    address: '1 Pasir Panjang Wholesale Centre',
    lat: 1.2862,
    lng: 103.7828,
    pickupTime: 'Today, 1:00 PM – 5:00 PM',
    expiryTime: 'Within 24 hours',
    status: 'available',
  },
  {
    id: 'fp-5',
    title: 'Steamed Rice, Stews & Lentil Curries',
    donorName: 'Heritage Spice Banquet & Events',
    category: 'Cooked Meals',
    quantity: '35 kg',
    servings: 95,
    address: '12 Buffalo Road, Little India',
    lat: 1.3075,
    lng: 103.8512,
    pickupTime: 'Today, 6:00 PM – 8:00 PM',
    expiryTime: 'Within 5 hours',
    status: 'available',
  },
];

// Volunteer Starting Depot & Community Dropoff Hub
const VOLUNTEER_START = {
  name: 'Volunteer Station (Start)',
  lat: 1.3100,
  lng: 103.8250,
  address: 'Central Volunteer Base',
};

const DROPOFF_HUB = {
  name: 'Hope Community Food Bank (Dropoff)',
  lat: 1.2850,
  lng: 103.8400,
  address: 'Community Welfare Center Hub',
};

interface RouteRendererProps {
  selectedPickups: FoodPickupLocation[];
  travelMode: 'DRIVING' | 'BICYCLING' | 'WALKING';
  onRouteCalculated: (routeData: {
    totalDistance: string;
    totalDuration: string;
    waypointOrder: number[];
    legs: any[];
  }) => void;
}

const RouteRenderer: React.FC<RouteRendererProps> = ({
  selectedPickups,
  travelMode,
  onRouteCalculated,
}) => {
  const map = useMap();
  const routesLibrary = useMapsLibrary('routes');
  const [directionsService, setDirectionsService] = useState<any>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<any>(null);

  useEffect(() => {
    if (!routesLibrary || !map) return;

    const ds = new routesLibrary.DirectionsService();
    const dr = new routesLibrary.DirectionsRenderer({
      map,
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: '#059669', // Emerald route
        strokeWeight: 6,
        strokeOpacity: 0.85,
      },
    });

    setDirectionsService(ds);
    setDirectionsRenderer(dr);

    return () => {
      dr.setMap(null);
    };
  }, [routesLibrary, map]);

  useEffect(() => {
    if (!directionsService || !directionsRenderer || selectedPickups.length === 0) {
      if (directionsRenderer) {
        directionsRenderer.setDirections({ routes: [] });
      }
      return;
    }

    const waypoints = selectedPickups.map((p) => ({
      location: { lat: p.lat, lng: p.lng },
      stopover: true,
    }));

    const modeMap: Record<string, any> = {
      DRIVING: typeof google !== 'undefined' && google.maps ? google.maps.TravelMode.DRIVING : 'DRIVING',
      BICYCLING: typeof google !== 'undefined' && google.maps ? google.maps.TravelMode.BICYCLING : 'BICYCLING',
      WALKING: typeof google !== 'undefined' && google.maps ? google.maps.TravelMode.WALKING : 'WALKING',
    };

    directionsService.route(
      {
        origin: { lat: VOLUNTEER_START.lat, lng: VOLUNTEER_START.lng },
        destination: { lat: DROPOFF_HUB.lat, lng: DROPOFF_HUB.lng },
        waypoints,
        optimizeWaypoints: true,
        travelMode: modeMap[travelMode],
      },
      (result: any, status: any) => {
        const okStatus = typeof google !== 'undefined' && google.maps ? google.maps.DirectionsStatus.OK : 'OK';
        if (status === okStatus && result) {
          directionsRenderer.setDirections(result);

          const route = result.routes[0];
          if (route) {
            let totalDistMeters = 0;
            let totalDurationSecs = 0;

            route.legs.forEach((leg: any) => {
              totalDistMeters += leg.distance?.value || 0;
              totalDurationSecs += leg.duration?.value || 0;
            });

            const distanceKm = (totalDistMeters / 1000).toFixed(1) + ' km';
            const durationMins = Math.round(totalDurationSecs / 60) + ' mins';

            onRouteCalculated({
              totalDistance: distanceKm,
              totalDuration: durationMins,
              waypointOrder: route.waypoint_order || [],
              legs: route.legs,
            });
          }
        } else {
          console.warn('Google Maps Directions status:', status);
        }
      }
    );
  }, [directionsService, directionsRenderer, selectedPickups, travelMode]);

  return null;
};

interface GoogleMapComponentProps {
  onScheduleCalendar?: (pickup: FoodPickupLocation) => void;
}

export const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({ onScheduleCalendar }) => {
  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || '';
  const [selectedPickup, setSelectedPickup] = useState<FoodPickupLocation | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [liveDonors, setLiveDonors] = useState<LiveLocationRecord[]>([]);

  useEffect(() => {
    return listenToLiveLocations((locations) => {
      setLiveDonors(locations.filter((location) => location.role === 'donor'));
    });
  }, []);

  // Route optimization state
  const [isRouteMode, setIsRouteMode] = useState<boolean>(false);
  const [selectedRoutePickupIds, setSelectedRoutePickupIds] = useState<string[]>(['fp-1', 'fp-2', 'fp-5']);
  const [travelMode, setTravelMode] = useState<'DRIVING' | 'BICYCLING' | 'WALKING'>('DRIVING');
  const [routeData, setRouteData] = useState<{
    totalDistance: string;
    totalDuration: string;
    waypointOrder: number[];
    legs: any[];
  } | null>(null);

  const filteredPickups = SAMPLE_PICKUPS.filter((p) => {
    const matchesCat = activeCategory === 'All' || p.category.toLowerCase().includes(activeCategory.toLowerCase());
    const matchesQuery =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.donorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const selectedPickupsForRoute = SAMPLE_PICKUPS.filter((p) => selectedRoutePickupIds.includes(p.id));

  const toggleRoutePickup = (id: string) => {
    setSelectedRoutePickupIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllAvailable = () => {
    const available = SAMPLE_PICKUPS.filter((p) => p.status === 'available').map((p) => p.id);
    setSelectedRoutePickupIds(available);
  };

  // Generate Google Maps Mobile directions URL
  const getExternalMapsUrl = () => {
    if (selectedPickupsForRoute.length === 0) return '#';
    const originStr = `${VOLUNTEER_START.lat},${VOLUNTEER_START.lng}`;
    const destStr = `${DROPOFF_HUB.lat},${DROPOFF_HUB.lng}`;

    let orderedWaypoints = selectedPickupsForRoute;
    if (routeData?.waypointOrder && routeData.waypointOrder.length === selectedPickupsForRoute.length) {
      orderedWaypoints = routeData.waypointOrder.map((idx) => selectedPickupsForRoute[idx]);
    }

    const waypointsStr = orderedWaypoints.map((p) => `${p.lat},${p.lng}`).join('|');
    return `https://www.google.com/maps/dir/?api=1&origin=${originStr}&destination=${destStr}&waypoints=${waypointsStr}&travelmode=${travelMode.toLowerCase()}`;
  };

  const totalMealsSavedInRoute = selectedPickupsForRoute.reduce((sum, p) => sum + p.servings, 0);

  if (!apiKey) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-amber-900">
        <AlertCircle className="mx-auto mb-2 h-8 w-8 text-amber-600" />
        <h3 className="text-lg font-bold">Google Maps API Key Missing</h3>
        <p className="mt-1 text-sm text-amber-700">
          Please ensure <code>VITE_GOOGLE_MAPS_API_KEY</code> is configured in your environment.
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl dark:border-stone-800 dark:bg-stone-900">
      {/* Map Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 bg-stone-50/80 p-4 backdrop-blur dark:border-stone-800 dark:bg-stone-950/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <span>Live Surplus Food Radar & Route Optimizer</span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Google Maps API
              </span>
            </h3>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Directions Service • Multi-stop waypoint optimization for efficient volunteer food rescue
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Route Mode Toggle Button */}
          <button
            onClick={() => setIsRouteMode(!isRouteMode)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-sm ${
              isRouteMode
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white ring-2 ring-emerald-500/30'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-200'
            }`}
          >
            <Route className="h-4 w-4" />
            <span>{isRouteMode ? 'Hide Route Optimizer' : '⚡ Optimize Pickup Route'}</span>
          </button>

          {!isRouteMode && (
            <>
              {['All', 'Cooked Meals', 'Bakery', 'Fresh Produce'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    activeCategory === cat
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-stone-200/70 text-stone-700 hover:bg-stone-300 dark:bg-stone-800 dark:text-stone-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
              <input
                type="text"
                placeholder="Search venue or food..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-lg border border-stone-300 bg-white px-3 py-1 text-xs text-stone-800 shadow-sm focus:border-emerald-500 focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200"
              />
            </>
          )}
        </div>
      </div>

      {/* Multi-Stop Route Optimizer Control Panel */}
      {isRouteMode && (
        <div className="border-b border-emerald-100 bg-emerald-50/70 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/40 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-900 dark:text-emerald-200">
                Multi-Stop Volunteer Pickup Batch
              </h4>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-stone-500">Travel Mode:</span>
              {(['DRIVING', 'BICYCLING', 'WALKING'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setTravelMode(mode)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                    travelMode === mode
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white/80 text-stone-700 hover:bg-white dark:bg-stone-800 dark:text-stone-300'
                  }`}
                >
                  {mode}
                </button>
              ))}

              <button
                onClick={selectAllAvailable}
                className="rounded-lg border border-emerald-300 bg-white px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:bg-stone-800 dark:text-emerald-300"
              >
                Select All Available ({SAMPLE_PICKUPS.filter((p) => p.status === 'available').length})
              </button>
            </div>
          </div>

          {/* Location Waypoint Checkboxes */}
          <div className="flex flex-wrap gap-2 pt-1">
            {SAMPLE_PICKUPS.map((pickup) => {
              const isSelected = selectedRoutePickupIds.includes(pickup.id);
              return (
                <button
                  key={pickup.id}
                  onClick={() => toggleRoutePickup(pickup.id)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-600 text-white shadow-sm'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300'
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-stone-400'}`} />
                  <span className="truncate max-w-[150px]">{pickup.donorName}</span>
                  <span className="text-[10px] opacity-80">({pickup.servings} meals)</span>
                </button>
              );
            })}
          </div>

          {/* Calculated Route Summary Metric Bar */}
          {routeData && selectedPickupsForRoute.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-300/80 bg-white p-3.5 shadow-sm dark:border-emerald-800 dark:bg-stone-900">
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400">Total Distance</span>
                  <p className="font-extrabold text-stone-900 dark:text-stone-100 text-sm">{routeData.totalDistance}</p>
                </div>
                <div className="h-6 w-px bg-stone-200 dark:bg-stone-800" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400">Est. Transit Time</span>
                  <p className="font-extrabold text-stone-900 dark:text-stone-100 text-sm">{routeData.totalDuration}</p>
                </div>
                <div className="h-6 w-px bg-stone-200 dark:bg-stone-800" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400">Meals Rescued</span>
                  <p className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">{totalMealsSavedInRoute} meals</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={getExternalMapsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-2 text-xs font-bold text-white shadow hover:from-emerald-500 hover:to-teal-500 transition"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  <span>Start Navigation in Google Maps</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Live donor tracking status */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 dark:border-emerald-900/50 dark:bg-emerald-950/30">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
          </span>
          <div>
            <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">Live Donor Tracking</p>
            <p className="text-[10px] text-emerald-700 dark:text-emerald-300">Admin map updates automatically as donor GPS changes</p>
          </div>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-emerald-700 shadow-sm dark:bg-stone-900 dark:text-emerald-300">
          {liveDonors.length} {liveDonors.length === 1 ? 'donor' : 'donors'} online
        </span>
      </div>

      {/* Google Map Viewport */}
      <div className="relative h-[480px] w-full">
        <APIProvider apiKey={apiKey}>
          <Map
            defaultCenter={DEFAULT_CENTER}
            defaultZoom={12}
            mapId="DEMO_MAP_ID"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            gestureHandling="greedy"
            disableDefaultUI={false}
            className="h-full w-full"
          >
            {/* Multi-Stop Directions Route Renderer */}
            {isRouteMode && (
              <RouteRenderer
                selectedPickups={selectedPickupsForRoute}
                travelMode={travelMode}
                onRouteCalculated={(data) => setRouteData(data)}
              />
            )}

            {/* Individual Food Pickup Markers */}
            {filteredPickups.map((pickup) => {
              const isSelectedInRoute = selectedRoutePickupIds.includes(pickup.id);
              return (
                <AdvancedMarker
                  key={pickup.id}
                  position={{ lat: pickup.lat, lng: pickup.lng }}
                  onClick={() => setSelectedPickup(pickup)}
                  title={pickup.title}
                >
                  <Pin
                    background={
                      isRouteMode
                        ? isSelectedInRoute
                          ? '#059669' // Emerald
                          : '#9CA3AF' // Gray
                        : pickup.status === 'available'
                        ? '#16A34A'
                        : '#EAB308'
                    }
                    borderColor="#FFFFFF"
                    glyphColor="#FFFFFF"
                    scale={isSelectedInRoute ? 1.25 : 1.0}
                  />
                </AdvancedMarker>
              );
            })}

            {/* Live donor markers — positions come directly from Firestore snapshots */}
            {liveDonors.map((donor) => (
              <AdvancedMarker
                key={`live-donor-${donor.userId}`}
                position={{ lat: donor.lat, lng: donor.lng }}
                title={`${donor.name} • Live donor location`}
              >
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-red-600 text-white shadow-xl">
                  <span className="absolute inset-0 rounded-full bg-red-500 opacity-30 animate-ping" />
                  <span className="relative text-lg">📍</span>
                </div>
              </AdvancedMarker>
            ))}

            {/* Volunteer Start Station Marker */}
            {isRouteMode && (
              <AdvancedMarker position={{ lat: VOLUNTEER_START.lat, lng: VOLUNTEER_START.lng }} title={VOLUNTEER_START.name}>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xs shadow-lg border-2 border-white">
                  🏠
                </div>
              </AdvancedMarker>
            )}

            {/* Hope Community Dropoff Hub Marker */}
            {isRouteMode && (
              <AdvancedMarker position={{ lat: DROPOFF_HUB.lat, lng: DROPOFF_HUB.lng }} title={DROPOFF_HUB.name}>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-white font-bold text-xs shadow-lg border-2 border-white">
                  🏥
                </div>
              </AdvancedMarker>
            )}

            {/* Info Window */}
            {selectedPickup && (
              <InfoWindow
                position={{ lat: selectedPickup.lat, lng: selectedPickup.lng }}
                onCloseClick={() => setSelectedPickup(null)}
              >
                <div className="max-w-xs p-1 text-stone-900">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>{selectedPickup.donorName}</span>
                  </div>
                  <h4 className="mt-1 font-semibold text-sm leading-snug">{selectedPickup.title}</h4>

                  <div className="mt-2 space-y-1 text-xs text-stone-600">
                    <div className="flex items-center gap-1">
                      <Utensils className="h-3 w-3 text-stone-400" />
                      <span>
                        {selectedPickup.quantity} ({selectedPickup.servings} estimated servings)
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-stone-400" />
                      <span>{selectedPickup.pickupTime}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-stone-400" />
                      <span>{selectedPickup.address}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-stone-200 pt-2 gap-2">
                    <button
                      onClick={() => toggleRoutePickup(selectedPickup.id)}
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition ${
                        selectedRoutePickupIds.includes(selectedPickup.id)
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      }`}
                    >
                      <Route className="h-3 w-3" />
                      {selectedRoutePickupIds.includes(selectedPickup.id) ? 'Remove from Route' : 'Add to Route'}
                    </button>

                    {onScheduleCalendar && (
                      <button
                        onClick={() => onScheduleCalendar(selectedPickup)}
                        className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white shadow-sm hover:bg-emerald-700 transition"
                      >
                        <Calendar className="h-3 w-3" />
                        Sync
                      </button>
                    )}
                  </div>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </div>

      {/* Step-by-Step Optimized Sequence Accordion in Route Mode */}
      {isRouteMode && routeData && (
        <div className="border-t border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-900/80 space-y-2">
          <div className="flex items-center justify-between">
            <h5 className="font-bold text-xs uppercase tracking-wider text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
              <span>Optimized Volunteer Pickup Sequence</span>
            </h5>
            <span className="text-xs text-stone-500">
              {selectedPickupsForRoute.length} Stop Pickups + Final Community Dropoff
            </span>
          </div>

          <div className="space-y-1.5 text-xs pt-1">
            <div className="flex items-center gap-2 rounded-xl bg-white p-2.5 shadow-sm border border-stone-200 dark:border-stone-800 dark:bg-stone-800">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                S
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-stone-900 dark:text-stone-100 truncate">{VOLUNTEER_START.name}</p>
                <p className="text-[10px] text-stone-500">{VOLUNTEER_START.address}</p>
              </div>
              <span className="text-[10px] font-semibold text-stone-400">Start Point</span>
            </div>

            {routeData.waypointOrder.map((waypointIdx, stepNum) => {
              const pickup = selectedPickupsForRoute[waypointIdx];
              if (!pickup) return null;
              const leg = routeData.legs[stepNum];

              return (
                <div
                  key={pickup.id}
                  className="flex items-center gap-2 rounded-xl bg-white p-2.5 shadow-sm border border-emerald-100 dark:border-emerald-900/40 dark:bg-stone-800"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                    {stepNum + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-emerald-800 dark:text-emerald-300 truncate">{pickup.donorName}</p>
                    <p className="text-[10px] text-stone-500 truncate">{pickup.title} • {pickup.address}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">
                      +{pickup.servings} meals
                    </span>
                    {leg && (
                      <span className="text-[9px] text-stone-400 block">
                        {leg.distance?.text} • {leg.duration?.text}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="flex items-center gap-2 rounded-xl bg-white p-2.5 shadow-sm border border-purple-200 dark:border-purple-900/40 dark:bg-stone-800">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-600 text-[10px] font-bold text-white">
                D
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-purple-900 dark:text-purple-300 truncate">{DROPOFF_HUB.name}</p>
                <p className="text-[10px] text-stone-500">{DROPOFF_HUB.address}</p>
              </div>
              <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                Final Dropoff Hub
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Location Card Grid when not in Route Mode */}
      {!isRouteMode && (
        <div className="grid grid-cols-1 divide-y border-t border-stone-200 bg-stone-50/50 sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:border-stone-800 dark:bg-stone-900/50">
          {filteredPickups.slice(0, 3).map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedPickup(item)}
              className="cursor-pointer p-4 transition hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    {item.category}
                  </span>
                  <h5 className="font-semibold text-sm text-stone-900 dark:text-stone-100">{item.donorName}</h5>
                </div>
                <span className="rounded-full bg-stone-200/70 px-2 py-0.5 text-[10px] font-medium text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                  {item.quantity}
                </span>
              </div>
              <p className="mt-1 line-clamp-1 text-xs text-stone-600 dark:text-stone-400">{item.title}</p>
              <div className="mt-2 flex items-center justify-between text-xs text-stone-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {item.pickupTime.split(',')[0]}
                </span>
                <span className="font-medium text-emerald-700 dark:text-emerald-400">{item.servings} meals</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
