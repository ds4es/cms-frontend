# cms-frontend

Vector tiles are really small, enabling global high resolution maps, fast map loads, and efficient caching. 

## Installation

```
sudo dnf install wget git expat sqlite-devel proj-devel libnsl
```

Git clone this repo where it will be serve by a web server (like Apache or Nginx)
```
cd /path/to/my/web/server
git clone https://github.com/ds4es/cms-frontend
cd cms-frontend
```

Pull all git submodules
```
git submodule update --init --recursive
```

#### Install GDAL (with Anaconda things are much more easier)
Install Anaconda
```
# Browse to your Downloads directory
mkdir -p ~/Downloads && cd ~/Downloads
# Download one lastest Anaconda installer suiting your OS
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh
# Add execute rights for this installer
chmod +x Miniconda3-latest-Linux-x86_64.sh
# Launch the installation script
./Miniconda3-latest-Linux-x86_64.sh
# Add the Anaconda bin folder location to your PATH variable.
echo 'export PATH="$HOME/miniconda3/bin:$PATH"' | tee -a ~/.bashrc
# Reload ~/.bashrc
. ~/.bashrc
```

Install GDAL
```
conda activate gdal
conda create -n gdal python
conda install -c conda-forge gdal
# Check the installation
ogr2ogr --version
```

#### Build and install tippecanoe
```
cd lib/tippecanoe
make
sudo make install
cd ../../
```

## Generate your own vector tiles (example with Andorra)
Download any OpenStreetMap .pbf file you would like to render.
```
wget -P ./data/pbf https://download.geofabrik.de/europe/andorra-latest.osm.pbf
```
Convert .osm.pbf data to GeoJSON format specifying the data layer to extract, here: lines
```
ogr2ogr -f 'GeoJSON' -s_srs 'EPSG:4326' -t_srs 'EPSG:4326' './data/json/andorra.json' './data/pbf/andorra-latest.osm.pbf' lines
```
Having our data in a GeoJSON file, we can now generate tiles that way:
```
tippecanoe \
	--no-feature-limit \
	--no-tile-size-limit \
	--include={"osm_id","highway"} \
	--maximum-zoom=16 \
	--layer="andorra"
	--output-to-directory "./data/tiles/andorra" \
	"./data/json/andorra.json"
```

## And finally
#### In `index.html`
If you didn't choose to use OpenStreetMap for Andorra, specify the right information in `index.html` in place of
```
style: "map_styles/basic.json",
center: [1.5218, 42.5063], // Andorra GPS coordonates
```

#### In `map_styles/basic.json`
Change `<your-app-base-url>` with right URL for your web server 
```
"tiles": [
	"<your-app-base-url>/data/tiles/andorra/{z}/{x}/{y}.pbf"
],
```
Change the following expressions with --layer name you specified with the `tippecanoe` command
```
"source-layer": "andorra"
```

Your app should now serve tiles.