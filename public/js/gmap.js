const mapLocation = { lat: 47.02860829477348, lng: 28.835138018816963 };
let map;

function initialize() {
  const mapOptions = {
    zoom: 16,
    center: mapLocation,
    scrollwheel: false,
    mapId: "6f21240791d72da52cfbde70"
  };

  map = new google.maps.Map(document.getElementById("map"), mapOptions);

  const contentString = `
    <div class="map-info">
      <div><span style="font-family:'Odswald', sans-serif; font-size: 15px; font-weight: 700">GOR ARCHITECURE</span></div>
      <div class="map-address-row">
        <i class="fa fa-map-marker"></i>
        <span class="text"><a href="https://www.google.com/maps?q=Alexandru+cel+Bun+91,+Chișinau,+Moldova" style="text-decoration: none;" target="_blank" class="header-address">Alexandru cel Bun 91, Chișinau, Moldova</a></span>
      </div>
      <div class="map-address-row">
        <i class="fa fa-phone"></i>
        <span class="text"><a href="tel:+37379337000" style="text-decoration: none;">+373 79 337 000</a><br></span>
      </div>
      <div class="map-address-row">
        <span class="map-email">
          <i class="fa fa-envelope"></i>
          <span class="text"><a href="mailto:info@gorarchitecture.md" style="text-decoration: none;">info@gorarchitecture.md</a> <br></span>
        </span>
      </div>
    </div>
  `;

  const infowindow = new google.maps.InfoWindow({
    content: contentString
  });

  // ✅ Use only AdvancedMarkerElement
  const marker = new google.maps.marker.AdvancedMarkerElement({
    map,
    position: mapLocation,
    title: "GOR Architecture",
    gmpDraggable: true // This is the correct way to make it draggable
  });

  marker.addListener("gmp-click", () => {
    infowindow.open(map, marker);
  });
}
