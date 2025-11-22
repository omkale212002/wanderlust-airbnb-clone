console.log("Map token:", mapToken); // this will print the token from EJS

mapboxgl.accessToken = mapToken; // ✅ use dynamic token from backend

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/satellite-streets-v11',
  center: coordinates, // [lng, lat]
  zoom: 9
});

const marker = new mapboxgl.Marker()
  .setLngLat(coordinates) // [lng, lat]
  .setPopup(new mapboxgl.Popup().setHTML(`<h3>Exact location provided after booking</h3>`)) // add popup
  .addTo(map);
