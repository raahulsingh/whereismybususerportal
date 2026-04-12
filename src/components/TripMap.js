import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
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
