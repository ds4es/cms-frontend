/***
 * Map objects are managed with the 3 layer:
 *  - mb_layer: Custom map layer powered by MapBox GL JS
 *  - osm_layer: OpenStreetMap layer powered by Leaflet
 *  - object_layer: Image layer powered by Leaflet and top layer the one mouse actions take place
 * 
 * In your index.html you need to define the following constants with relevant values:
 * const INITIAL_CENTER_LON = 2.333333;
 * const INITIAL_CENTER_LAT = 48.866667;
 * const INITIAL_ZOOM = 11;
 * 
 * const MIN_ZOOM = 5;
 * const MAX_ZOOM = 17;
 * 
 * const MAP_STYLE = "map_styles/basic_ile-de-france.json";
 */

/**
 * Load a custom layer with MapBox GL  
 */
mapboxgl.accessToken = "not-needed-unless-using-mapbox-styles";

var mb_layer, osm_layer, object_layer, mapbox_layer_base_style, current_zoom, new_zoom, need_to_be_processed;

function init() {

    $.getJSON(MAPBOX_LAYER_BASE_STYLE_FILE, function(json) {

        mapbox_layer_base_style = json;
        mapbox_layer_base_style.sources.composite.tiles = [TILESOURCE_URL];
        mapbox_layer_base_style.layers[0]['source-layer'] = SOURCE_LAYER;

        // document.write(JSON.stringify(mapbox_layer_base_style));

        mb_layer = new mapboxgl.Map({
            container: "mb_layer",
            style: mapbox_layer_base_style,
            center: [INITIAL_CENTER_LON,INITIAL_CENTER_LAT], // Paris centier
            minZoom: MIN_ZOOM,
            zoom: INITIAL_ZOOM,
            maxZoom: MAX_ZOOM
        });

    }).then(function() { // $.getJSON returns a Deferred
        /**
         * Initialize a map object to display an OpenStreetMap layer  
         */      
        osm_layer = L.map('osm_layer').setView({
            lon: INITIAL_CENTER_LON,
            lat: INITIAL_CENTER_LAT,   
            minZoom: MIN_ZOOM+1,
            maxZoom: MAX_ZOOM+1,
        }, INITIAL_ZOOM+1);

        /**
         * Initialize a map object to plot images, symboles, etc.. on a dedicated layer  
         */     
        object_layer = L.map('object_layer', {
            minZoom: MIN_ZOOM+1,
            maxZoom: MAX_ZOOM+1,
        }).setView({
            lon: INITIAL_CENTER_LON,
            lat: INITIAL_CENTER_LAT,
        }, INITIAL_ZOOM+1);

        // Load OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>',
            zoomControl: false
        }).addTo(osm_layer);

        /**
         * Using MapBox and Leaflet objects in a synchronous way is a bit 
         * tricky, the following script is made to tackle this problem
         */
        current_zoom = mb_layer.getZoom();

        // to avoid an endless loop caused by event listeners
        need_to_be_processed = false;

        // Fire just after the map completes a transition from one view 
        // to another, as the result of either user interaction or methods
        osm_layer.on('moveend', function(e) {

            dirty_process_to_realign_map_layers();

        });

        // To synchronize changes from object_layer to osm_layer
        object_layer.sync(osm_layer);

    });

}

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

// To synchronise MapBox and OpenStreetMap layers
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

// Update coverage information on the MapBox Layer 
function update_mapbox_layer(coverage_data_file) {
    // var map_style_to_load;
    var coverage_data;

    /*
    var promise_1 = $.getJSON(MAPBOX_LAYER_BASE_STYLE_FILE, function(mapbox_layer_base_style) {
        map_style_to_load = mapbox_layer_base_style;
    }); // $.getJSON returns a Deferred
    */

    var promise_2 = $.getJSON(coverage_data_file, function(json) {
        coverage_data = json;
    }); // $.getJSON returns a Deferred

    var all_promises = $.when(promise_2); // $.when(promise_1, promise_2); // $.when groups several Deferreds

    all_promises.done(function () {
        map_style_to_load = mapbox_layer_base_style;

        // Append each coverage information to the 'layers' property
        // when all files have been successfully loaded
        for (var i =0; i< coverage_data.length ;i++) {
            map_style_to_load['layers'].push(coverage_data[i]);
        } 
        //document.write(JSON.stringify(map_style_to_load));
        mb_layer.setStyle(map_style_to_load);
    });

    all_promises.fail(function () {
      // something to call in case one or more files fail
    });

    all_promises.always(function () {
      // something to always call (like, say, hiding a "loading" indicator)
    });
}

