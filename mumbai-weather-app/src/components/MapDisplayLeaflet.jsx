// src/components/MapDisplayLeaflet.jsx
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import L from 'leaflet';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot, where, Timestamp } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { FiCloudDrizzle, FiCloudRain, FiCloudLightning, FiSun } from 'react-icons/fi';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut", delay: 0.2 } }
};

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const lightRainIcon = new L.Icon({
  iconUrl: '/img/light-rain.png',
  iconRetinaUrl: '/img/light-rain.png',
  iconSize: [25, 25], iconAnchor: [12, 25], popupAnchor: [0, -25],
  shadowUrl: '/img/marker-shadow.png', shadowSize: [41, 41]
});
const moderateRainIcon = new L.Icon({
  iconUrl: '/img/moderate-rain.png',
  iconSize: [28, 28], iconAnchor: [14, 28], popupAnchor: [0, -28],
});
const heavyRainIcon = new L.Icon({
  iconUrl: '/img/heavy-rain.png',
  iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32],
});
const noRainIcon = new L.Icon({
  iconUrl: '/img/no.png',
  iconSize: [25, 25], iconAnchor: [12, 25], popupAnchor: [0, -25],
});

const getRainIcon = (rainStatus) => {
  switch (rainStatus) {
    case 'Light': return lightRainIcon;
    case 'Moderate': return moderateRainIcon;
    case 'Heavy': return heavyRainIcon;
    case 'None': return noRainIcon;
    default: return L.Icon.Default;
  }
};

const createClusterCustomIcon = function (cluster) {
  const childCount = cluster.getChildCount();
  const childMarkers = cluster.getAllChildMarkers();

  const statuses = childMarkers.map(marker => marker.options.rainStatus);
  const statusCounts = statuses.reduce((acc, status) => {
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  let dominantStatus = '';
  let maxCount = 0;
  for (const status in statusCounts) {
    if (statusCounts[status] > maxCount) {
      maxCount = statusCounts[status];
      dominantStatus = status;
    }
  }

  const showDominant = maxCount > childCount / 2 && dominantStatus;

  let c = ' marker-cluster-';
  if (childCount < 10) c += 'small';
  else if (childCount < 30) c += 'medium';
  else c += 'large';

  if (showDominant) {
    c += ` marker-cluster-${dominantStatus.toLowerCase()}`;
  }

  return new L.DivIcon({
    html: `<div><span>${childCount}${showDominant ? ` (${dominantStatus.substring(0, 1)})` : ''}</span></div>`,
    className: `marker-cluster${c} custom-dark-cluster`, // Added a custom class for styling
    iconSize: new L.Point(40, 40)
  });
};

const defaultCenter = [19.0760, 72.8777];

function MapDisplayLeaflet() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const reportsRef = collection(db, 'rainReports');
    const sixHoursAgo = Timestamp.fromDate(new Date(Date.now() - 6 * 60 * 60 * 1000));

    const q = query(
      reportsRef,
      where('timestamp', '>=', sixHoursAgo),
      where('latitude', '!=', null),
      orderBy('latitude'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const reportsData = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.latitude && data.longitude) {
          reportsData.push({ id: doc.id, ...data });
        }
      });
      setReports(reportsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching reports for map: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getPopupStatusStyle = (rainStatus) => {
    switch (rainStatus) {
      case 'Heavy': return { icon: <FiCloudLightning className="h-4 w-4 mr-1.5 text-red-400" />, color: "text-red-400" };
      case 'Moderate': return { icon: <FiCloudRain className="h-4 w-4 mr-1.5 text-amber-400" />, color: "text-amber-400" };
      case 'Light': return { icon: <FiCloudDrizzle className="h-4 w-4 mr-1.5 text-sky-400" />, color: "text-sky-400" };
      case 'None': return { icon: <FiSun className="h-4 w-4 mr-1.5 text-slate-400" />, color: "text-slate-300" };
      default: return { icon: null, color: "text-slate-300" };
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="p-6 md:p-8 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden"
    >
      {/* Dynamic CSS to force Leaflet into a gorgeous Dark Glass theme */}
      <style>
        {`
          /* Invert OSM Tiles to make a dark map */
          .dark-tiles {
            filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
          }
          /* Dark Glass Popup */
          .leaflet-popup-content-wrapper {
            background: rgba(15, 23, 42, 0.85) !important;
            backdrop-filter: blur(12px) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            border-radius: 1rem !important;
            color: #f1f5f9 !important;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5) !important;
          }
          .leaflet-popup-tip {
            background: rgba(15, 23, 42, 0.9) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
          }
          /* Hide Leaflet Attribution background to blend better */
          .leaflet-control-attribution {
            background: rgba(0,0,0,0.5) !important;
            color: #cbd5e1 !important;
            border-radius: 4px;
            padding: 0 4px;
          }
          .leaflet-control-attribution a { color: #38bdf8 !important; }
        `}
      </style>

      <h2 className="text-2xl md:text-3xl font-semibold text-white tracking-tight drop-shadow-md mb-6 pb-4 border-b border-white/10 flex items-baseline">
        Live Radar Map
        <span className="text-sm font-medium text-slate-400 ml-3 bg-white/5 px-3 py-1 rounded-full border border-white/10">
          Last 6 Hours
        </span>
      </h2>

      {loading && (
        <div className="animate-pulse h-[400px] w-full bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shadow-inner">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-8 w-8 text-sky-400 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-slate-400 font-medium tracking-wide">Loading live map data...</p>
          </div>
        </div>
      )}

      {!loading && (
        <div className="p-1.5 bg-white/5 border border-white/10 rounded-2xl shadow-inner backdrop-blur-sm">
          <MapContainer
            center={defaultCenter}
            zoom={10}
            style={{ height: '400px', width: '100%', borderRadius: '1rem', zIndex: 10 }}
            className="overflow-hidden"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              className="dark-tiles" // Applies the dark mode filter!
            />

            <MarkerClusterGroup
              spiderfyOnMaxZoom={true}
              showCoverageOnHover={false}
              zoomToBoundsOnClick={true}
              iconCreateFunction={createClusterCustomIcon}
            >
              {reports.map((report) => {
                const popupStyle = getPopupStatusStyle(report.rainStatus);
                return (
                  <Marker
                    key={report.id}
                    position={[report.latitude, report.longitude]}
                    icon={getRainIcon(report.rainStatus)}
                    rainStatus={report.rainStatus}
                  >
                    <Popup minWidth={200}>
                      <div className="font-sans text-sm p-1">
                        <div className={`flex items-center font-bold text-base mb-2 pb-2 border-b border-white/10 ${popupStyle.color}`}>
                          {popupStyle.icon}
                          <span>{report.rainStatus} {report.rainStatus === 'None' ? 'Reported' : 'Rain'}</span>
                        </div>
                        <p className="text-slate-300 mb-1.5 font-light">
                          Location: <span className="font-semibold text-white tracking-wide">{report.area}</span>
                        </p>
                        {report.note && (
                          <p className="text-xs text-slate-300 my-2 italic border-l-2 border-sky-500/50 pl-2.5 bg-white/5 py-1.5 pr-2 rounded-r-md">
                            "{report.note}"
                          </p>
                        )}
                        <p className="text-xs text-slate-500 mt-2 font-medium tracking-wider uppercase">
                          {report.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MarkerClusterGroup>
          </MapContainer>
        </div>
      )}

      {!loading && reports.length === 0 && (
        <div className="absolute inset-0 mt-[90px] h-[400px] flex items-center justify-center pointer-events-none z-20">
          <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 px-6 py-4 rounded-xl text-center shadow-2xl">
            <FiSun className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-300 font-medium">No recent reports found.</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default MapDisplayLeaflet;