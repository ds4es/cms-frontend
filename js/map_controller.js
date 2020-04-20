/***
 * Map objects are managed with the 3 layer:
 *  - mb_layer: Custom map layer powered by MapBox GL JS
 *  - osm_layer: OpenStreetMap layer powered by Leaflet
 *  - object_layer: Image layer powered by Leaflet and top layer the one mouse actions take place
 */

/**
 * Load a custom layer with MapBox GL  
 */
mapboxgl.accessToken = "not-needed-unless-using-mapbox-styles";
var mb_layer = new mapboxgl.Map({
    container: "mb_layer",
    style: "map_styles/basic_ile-de-france.json",
    center: [2.333333,48.866667], // Paris centier
    minZoom: 5,
    zoom: 11,
    maxZoom: 17
});
// The control is let to 
// mb_layer.addControl(new mapboxgl.NavigationControl());

/**
 * Initialize a map object to display an OpenStreetMap layer  
 */      
var osm_layer = L.map('osm_layer').setView({
    lon: 2.3522,
    lat: 48.8566,
}, 12);

/**
 * Initialize a map object to plot images, symboles, etc.. on a dedicated layer  
 */     
var object_layer = L.map('object_layer', {
    minZoom: 6,
    maxZoom: 18,
}).setView({
    lon: 2.3522,
    lat: 48.8566,
}, 12);


// Load OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    minZoom: 6,
    maxZoom: 18,
    attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    zoomControl: false
}).addTo(osm_layer);

/**
 * Using MapBox and Leaflet objects in a synchronous way is a bit 
 * tricky, the following script is made to tackle this problem
 */
var current_zoom = mb_layer.getZoom();
var new_zoom;

// to avoid an endless loop caused by event listeners
var need_to_be_processed = false;

// Correct the zoom level for the MapBox layer
function correct_zoom_for_osm_layer() {
    return new Promise(function(resolve, reject) {
        setTimeout(function() {
            resolve(mb_layer.setZoom(new_zoom-1));
        }, 500);
    });
}

// Realign the MapBox layer with the OpenStreetMap layer
function realign_map_for_osm_layer() {
    return new Promise(function(resolve, reject) {
        setTimeout(function() {
            resolve(mb_layer.panTo(osm_layer.getCenter()));
        }, 500);
    });
}

function dirty_process_to_realign_map_layers(){
	// to avoid an endless loop caused by event listeners
    need_to_be_processed = !need_to_be_processed;
    // to avoid an endless loop caused by event listeners
    if(need_to_be_processed == true) {
        new Promise(function(resolve, reject) {

            setTimeout(() => resolve(1), 500);

            zoom_change = osm_layer.getZoom() - current_zoom;

            if (zoom_change > 0)
                zoom_change = Math.ceil(zoom_change);
            else
                zoom_change = Math.floor(zoom_change);

            // new zoom that should be applied
            new_zoom = current_zoom + zoom_change;
            // memorized for later adjustment
            current_zoom = new_zoom;

            // correct zoom for MapBox layer
            osm_layer.setZoom(new_zoom);


        }).then(function(result) {

          // correct zoom for OpenStreetMap layer
          return correct_zoom_for_osm_layer();

        }).then(function(result) {

          // Realign OpenStreetMap layer with MapBox layer
          return realign_map_for_osm_layer();

        });
    }
}

// Fire just after the map completes a transition from one view 
// to another, as the result of either user interaction or methods
osm_layer.on('moveend', function(e) {

    dirty_process_to_realign_map_layers();

});

// To synchronize changes from object_layer to osm_layer
object_layer.sync(osm_layer);