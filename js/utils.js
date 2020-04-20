
/***
 * Plot an img_file on a map top layer for each gps position
 * in gps_positions set as: 
 *  [
 *      { lat:  48.7541, lon: 2.62849 }
 *      ,{ lat: 49.0391, lon: 3.08025 }
 *  ]
 */
function add_images_to_object_layer(gps_positions, img_file){
    var img_width, img_height;
    var img = new Image();
    img.src = img_file;

    img.onload = function() {
        img_width = this.width;
        img_height = this.height;

        var L_img = L.icon({
            iconUrl: img.src,
            iconSize:     [img_width, img_height],
            iconAnchor: [30,img_height-1]
        });

        for (var one_position in gps_positions) {
            L.marker([gps_positions[one_position].lat,gps_positions[one_position].lon], {icon: L_img}).addTo(object_layer);
        }
    }
}
