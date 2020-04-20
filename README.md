# cms-frontend

Vector tiles are really small, enabling global high resolution maps, fast map loads, and efficient caching. 

![Screenshot](img/screenshot.png)

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
conda create -n gdal python
conda activate gdal
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

## Generate your own vector tiles (example with luxembourg)
Download any OpenStreetMap .pbf file you would like to render.
```
wget -P ./data/pbf https://download.geofabrik.de/europe/luxembourg-latest.osm.pbf
```
Convert .osm.pbf data to GeoJSON format specifying the data layer to extract, here: lines
```
conda activate gdal
ogr2ogr -f 'GeoJSON' -s_srs 'EPSG:4326' -t_srs 'EPSG:4326' './data/json/luxembourg.json' './data/pbf/luxembourg-latest.osm.pbf' lines
```
Having our data in a GeoJSON file, we can now generate tiles that way:
```
mkdir ./data/tiles/luxembourg
tippecanoe \
	--no-feature-limit \
	--no-tile-size-limit \
	--include={"osm_id","highway"} \
	--maximum-zoom=16 \
	--layer="luxembourg" \
	--output-to-directory "./data/tiles/luxembourg" \
	"./data/json/luxembourg.json"
```

## And finally
#### In `index.html`
If you didn't choose to use OpenStreetMap for luxembourg, specify the right information in `index.html` in place of
```
style: "map_styles/basic.json",
center: [6.1296, 49.8153], // luxembourg GPS coordonates
```

#### In `map_styles/basic.json`
Change `<your-app-base-url>` with right URL for your web server 
```
"tiles": [
	"<your-app-base-url>/data/tiles/luxembourg/{z}/{x}/{y}.pbf"
],
```
Change the following expressions with --layer name you specified with the `tippecanoe` command
```
"source-layer": "luxembourg"
```

Your app should now serve tiles.