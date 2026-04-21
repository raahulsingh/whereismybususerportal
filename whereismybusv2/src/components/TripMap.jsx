import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function TripMap({ currentLat, currentLng }) {
  if (!currentLat || !currentLng) {
    return (
      <div style={{ padding: "10px", color: "gray" }}>
        Bus current location not available.
      </div>
    );
  }

  const position = [currentLat, currentLng];

  return (
    <div style={{ height: "280px", width: "100%", marginTop: "20px" }}>
      <MapContainer center={position} zoom={14} style={{ height: "100%", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={position}>
          <Popup>Bus is here</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
