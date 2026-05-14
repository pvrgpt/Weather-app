// src/components/MapDisplay.jsx
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import L from 'leaflet';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot, where, Timestamp } from 'firebase/firestore';
import { motion } from 'framer-motion';
// Assuming you have react-icons installed and want to use similar icons for consistency
import { FiMapPin, FiCloudDrizzle, FiCloudRain, FiCloudLightning, FiSun } from 'react-icons/fi'; // For popups

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut", delay: 0.2 } } // Delay after ReportForm
};
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});


const lightRainIcon = new L.Icon({
  iconUrl: '/img/light-rain.png', // Example path
  iconRetinaUrl: '/img/light-rain.png', // Example path
  iconSize: [25, 25],
  iconAnchor: [12, 25],
  popupAnchor: [0, -25],
  shadowUrl: '/img/marker-shadow.png',
  shadowSize: [41, 41]
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
    default: return L.Icon.Default; // Fallback to default Leaflet icon
  }
};
// --- END OF OPTIONAL CUSTOM ICONS ---
const createClusterCustomIcon = function (cluster) {
  const childCount = cluster.getChildCount();
  const childMarkers = cluster.getAllChildMarkers();

  // Determine dominant rain status (simple version)
  const statuses = childMarkers.map(marker => marker.options.rainStatus); // We'll need to pass rainStatus to Marker options
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
  // Only show dominant status if it's a significant majority, e.g., > 50%
  const showDominant = maxCount > childCount / 2 && dominantStatus;


  let c = ' marker-cluster-';
  // Basic sizing based on count
  if (childCount < 10) c += 'small';
  else if (childCount < 30) c += 'medium';
  else c += 'large';

  // Add class based on dominant status for color
  if (showDominant) {
    c += ` marker-cluster-${dominantStatus.toLowerCase()}`;
  }


  return new L.DivIcon({
    html: `<div><span>${childCount}${showDominant ? ` (${dominantStatus.substring(0, 1)})` : ''}</span></div>`, // e.g., "15 (H)" for Heavy
    className: `marker-cluster${c}`,
    iconSize: new L.Point(40, 40)
  });
};

// Mumbai's approximate center
const defaultCenter = [19.0760, 72.8777]; // Leaflet uses [lat, lng] array

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
      orderBy('latitude'), // Firestore requirement for inequality filter
      orderBy('timestamp', 'desc'),
      limit(100) // Fetch a bit more if you expect dense reports
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
      case 'Heavy': return { icon: <FiCloudLightning className="h-4 w-4 mr-1.5 text-red-500" />, color: "text-red-600 dark:text-red-400" };
      case 'Moderate': return { icon: <FiCloudRain className="h-4 w-4 mr-1.5 text-amber-500" />, color: "text-amber-600 dark:text-amber-400" };
      case 'Light': return { icon: <FiCloudDrizzle className="h-4 w-4 mr-1.5 text-sky-500" />, color: "text-sky-600 dark:text-sky-400" };
      case 'None': return { icon: <FiSun className="h-4 w-4 mr-1.5 text-slate-500" />, color: "text-slate-600 dark:text-slate-400" };
      default: return { icon: null, color: "text-slate-700 dark:text-slate-300" };
    }
  };


  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="p-6 md:p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl"
    >
      <h2 className="text-2xl md:text-3xl font-bold text-sky-600 dark:text-sky-400 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
        Rain Reports Map <span className="text-base font-normal text-slate-500 dark:text-slate-400">(Last 6 Hours)</span>
      </h2>

      {loading && (
        <div className="animate-pulse h-[400px] bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
          <p className="text-slate-500 dark:text-slate-400">Loading map...</p>
        </div>
      )}
      {!loading && ( // Render MapContainer only when not loading to avoid issues if reports are initially empty
        <MapContainer
          center={defaultCenter}
          zoom={10}
          style={{ height: '400px', width: '100%', borderRadius: '0.75rem', zIndex: 0 }} // rounded-xl
          className="overflow-hidden" // Ensures map corners adhere to border-radius
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
                  rainStatus={report.rainStatus} // For cluster icon function
                >
                  <Popup minWidth={180}> {/* Set a minWidth for better layout */}
                    <div className="font-sans text-sm"> {/* Ensure our app font is used */}
                      <div className={`flex items-center font-semibold mb-1 ${popupStyle.color}`}>
                        {popupStyle.icon}
                        <span>{report.rainStatus} Rain</span>
                      </div>
                      <p className="text-slate-700 mb-0.5">
                        In: <span className="font-medium text-slate-800">{report.area}</span>
                      </p>
                      {report.note && (
                        <p className="text-xs text-slate-600 my-1 italic border-l-2 border-slate-300 pl-2">
                          {report.note}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 mt-1.5">
                        Reported: {report.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MarkerClusterGroup>
        </MapContainer>
      )}
      {!loading && reports.length === 0 && (
        <div className="h-[400px] bg-slate-50 dark:bg-slate-700/30 rounded-lg flex items-center justify-center">
          <p className="text-slate-500 dark:text-slate-400">No recent reports with location data to display on map.</p>
        </div>
      )}
    </motion.div>
  );
}

export default MapDisplayLeaflet;