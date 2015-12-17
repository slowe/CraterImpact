(function(E) {

	var images = {};
	images.crater = { 'img': new Image(), 'w':0, 'h':0 };
	images.sphinx = { 'img': new Image(), 'w':42, 'h':20 };
	images.bigBen = { 'img': new Image(), 'w':17, 'h':96 };
	images.eiffel = { 'img': new Image(), 'w':127, 'h':324 };
	images.empire = { 'img': new Image(), 'w':146, 'h':449 };
	images.cnTower = { 'img': new Image(), 'w':77, 'h':554 };
	images.burj = { 'img': new Image(), 'w':170, 'h':800 };
	
	var overlay;
	var crater = null;	// Hold the map crater overlay object
	USGSOverlay.prototype = new google.maps.OverlayView();
	
	//================================================================================
	// Prepares the view for displaying the results.
	CraterImpact.prototype.prepareView = function(){
		this.log('prepareView')

		this.setValues();

		this.dataProvider = new DataProvider();	//for passing data to and from the back end.

		// Show first tab of results
		this.resultTab(1);

		// Add events
		E('#cpLocation').on('change',{me:this},function(e){ e.data.me.selectLocation(e.currentTarget); });
		E('#cpLocationMoon').on('change',{me:this},function(e){ e.data.me.selectLocation(e.currentTarget); });
		E('#cpLocationMars').on('change',{me:this},function(e){ e.data.me.selectLocation(e.currentTarget); });
		E('#cpLandmark').on('change',{me:this},function(e){ e.data.me.selectLandmark(e.currentTarget); });
		E('#BT_Back').on('click',{me:this},function(e){ e.data.me.goBack(); });
		E('#BT_Data').on('click',{me:this},function(e){ e.data.me.resultTab(3); });
		E('#BT_CraterDepth').on('click',{me:this},function(e){ e.data.me.resultTab(2); });
		E('#BT_CraterPlace').on('click',{me:this},function(e){ e.data.me.resultTab(1); });

		this.drawCrater("");	// nothing has been selected yet.

		return this;
	}
	
	// Swap fragments
	CraterImpact.prototype.resultTab = function(tabNo){
		E('#ImpactCalc_Data_View').css({'display':(tabNo==3 ? 'block':'none')});
		E('#ImpactCalc_Crater_Depth').css({'display':(tabNo==2 ? 'block':'none')});
		E('#ImpactCalc_Output_Map').css({'display':(tabNo==1 ? 'block':'none')});

		return this;
	}

	//=========================================================================================
	// Called when the building comobo box is selected on the crater screen
	CraterImpact.prototype.drawCrater = function(building){

		this.log('drawCrater',building);
		this.selectedBuilding = parseInt(building);

		var c = document.getElementById("Crater_Area");
		var ctx = c.getContext("2d");

		var craterBaseThickness = 29;

		canvasReset(ctx, c);

		if(building != "" && images[building]){

			var cd = this.dataProvider.impactor.crDepth;

			var _loc1 = cd / 92;

			var h = images[building].h / _loc1;
			var w = images[building].w / _loc1;
			ctx.drawImage(images[building].img,c.width/2.0 - w/2.0 , c.height - (craterBaseThickness + h), w, h);

		} //end if

		ctx.drawImage(images.crater.img,(c.width-716.0)/2.0,c.height-121.0);

		if(typeof this.dataProvider.impactor != 'undefined') this.drawScale();
		return this;
	}
	
	//=======================================================================================
	// draw the scale line beneath the crater.
	CraterImpact.prototype.drawScale = function(){
		var c=document.getElementById("Crater_Area");
		var ctx=c.getContext("2d");

		ctx.font = '10pt Arial';

		 var diam = nbFormat(this.dataProvider.impactor.crDiam)+"m";
		 var depth = nbFormat(this.dataProvider.impactor.crDepth)+"m"; 

		 var dl =depth.length;
		 var dil = diam.length;

		ctx.fillText(diam, c.width/2 -(dil*4.2), c.height - 18);
		ctx.fillText(depth, c.width -165 -(dl*4.2), c.height - 70);	   
		return this;
	}

	//======================================================================================
	// Resets a canvas clearing any path lines or images presented. Any transforms are cleared 
	// then restored so that the clearRect command does not itself become transformed.
	function canvasReset(ctx, canvas){
		// Store the current transformation matrix
		ctx.save();

		// Use the identity matrix while clearing the canvas
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.beginPath();

		// Restore the transform
		ctx.restore();
	}
	
	//======================================================================================
	// Update the landmark used for depth comparison
	CraterImpact.prototype.selectLandmark = function(select){
		this.log('selectLandmark',select)
		if(!select) return this;
		option = select.options[select.selectedIndex];
		if(!option) return this;
		this.drawCrater(E(option).attr('data-key'));
		return this;
	}

	//======================================================================================
	// Scroll the map to a predefined location on the map
	CraterImpact.prototype.selectLocation = function(select){
		this.log('selectLocation',select,this.value.planet)

		if(this.map == null) this.initializeMap();

		if(!select) return this;
		var i = select.selectedIndex;
		if(i == 0) i++;	// If no option is selected, we use the first one
		option = select.options[i];
		if(!option) return this;
		this.cmbLocation = parseInt(E(option).attr('value'));
		var lat = parseFloat(E(option).attr('data-lat'));
		var lon = parseFloat(E(option).attr('data-lon'));
		
		var z = E(option).attr('data-z');
		if(z) z = parseInt(z);
		
		// Work out the best fit map size for our crater
		var h = height(E('#map_canvas').e[0]);
		var angle = 0.1;
		var circ = 2*Math.PI*this.planets[this.value.planet].R*1000;
		var d = this.dataProvider.impactor.crDiam;
		var goodzoom = Math.round(-1 + Math.log(h * circ / d / 256) / Math.LN2);
		if(goodzoom > z) z = goodzoom;

		if(!lat || !lon || !z) return this;

		if(this.map){
			this.map.setZoom(z);
			this.map.setCenter(new google.maps.LatLng(lat,lon));
		}

		return this;
	}
	
	//======================================================================================
	// Set up the map
	CraterImpact.prototype.initializeMap = function(){

		this.log('initialising map');
		var _obj = this;

		planet = this.value.planet;

		this.resultTab(1);

		this.drawCrater("");	// nothing has been selected yet.

		this.setValues();

		this.mapTypeIds = new Array();
		this.mapTypes = {};

		// set up the map types
		this.mapTypes['moon'] = {
			getTileUrl: function(coord, zoom){
				return getHorizontallyRepeatingTileUrl(coord, zoom, function(coord, zoom) {
					var bound = Math.pow(2, zoom);
					return "http://mw1.google.com/mw-planetary/lunar/lunarmaps_v1/clem_bw/" + zoom + "/" + coord.x + "/" + (bound - coord.y - 1) + '.jpg';
				});
			},
			tileSize: new google.maps.Size(256, 256),
			isPng: false,
			maxZoom: 9,
			minZoom: 0,
			radius: 1738000,
			name: 'Moon',
			credit: 'Image Credit: NASA/USGS'
		};

		this.mapTypes['sky'] = {
			getTileUrl: function(coord, zoom){
				return getHorizontallyRepeatingTileUrl(coord, zoom, function(coord, zoom){
					return "http://mw1.google.com/mw-planetary/sky/skytiles_v1/" + coord.x + "_" + coord.y + '_' + zoom + '.jpg';
				});
			},
			tileSize: new google.maps.Size(256, 256),
			isPng: false,
			maxZoom: 13,
			radius: 57.2957763671875,
			name: 'Sky',
			credit: 'Image Credit: SDSS, DSS Consortium, NASA/ESA/STScI'
		};

		this.mapTypes['mars_elevation'] = {
			getTileUrl: function(coord, zoom){
				return getHorizontallyRepeatingTileUrl(coord, zoom, function(coord, zoom){
					return getMarsTileUrl("http://mw1.google.com/mw-planetary/mars/elevation/", coord, zoom);
				});
			},
			tileSize: new google.maps.Size(256, 256),
			isPng: false,
			maxZoom: 8,
			radius: 3396200,
			name: 'Mars Elevation',
			credit: 'Image Credit: NASA/JPL/GSFC'
		};

		this.mapTypes['mars_visible'] = {
			getTileUrl: function(coord, zoom){
				return getHorizontallyRepeatingTileUrl(coord, zoom, function(coord, zoom){
					return getMarsTileUrl("http://mw1.google.com/mw-planetary/mars/visible/", coord, zoom);
				});
			},
			tileSize: new google.maps.Size(256, 256),
			isPng: false,
			maxZoom: 9,
			radius: 3396200,
			name: 'Mars Visible',
			credit: 'Image Credit: NASA/JPL/ASU/MSSS'
		};

		this.mapTypes['mars_infrared'] = {
			getTileUrl: function(coord, zoom){
				return getHorizontallyRepeatingTileUrl(coord, zoom, function(coord, zoom){
					return getMarsTileUrl("http://mw1.google.com/mw-planetary/mars/infrared/", coord, zoom);
				});
			},
			tileSize: new google.maps.Size(256, 256),
			isPng: false,
			maxZoom: 9,
			radius: 3396200,
			name: 'Mars Infrared',
			credit: 'Image Credit: NASA/JPL/ASU'
		};


		// push all mapType keys in to a mapTypeId array to set in the mapTypeControlOptions
		for(var key in this.mapTypes){
			this.mapTypeIds.push(key);
		}

		var planetCode = "earth";
		var mapOptions;

		if(planet == 'Mars'){
			planetCode = 'mars_elevation';
			mapOptions = {
				zoom: 5,
				center: new google.maps.LatLng(62.281819, -150.287132),
				mapTypeControl:false,
				streetViewControl:false,
				scaleControl: true,
				draggableCursor: 'url(imgs/crosshairsS.png) 32 32, crosshair',
				mapTypeControlOptions: {
					mapTypeIds: this.mapTypeIds,
					style: google.maps.MapTypeControlStyle.SMALL
				}
			};

		}else if(planet == 'Moon'){
			planetCode = 'moon';
			mapOptions = {
				zoom: 5,
				center: new google.maps.LatLng(62.281819, -150.287132),
				mapTypeControl:false,
				streetViewControl:false,
				scaleControl: true,
				draggableCursor: 'url(imgs/crosshairsS.png) 32 32, crosshair',
				mapTypeControlOptions: {
					mapTypeIds: this.mapTypeIds,
					style: google.maps.MapTypeControlStyle.SMALL
				}
			};

		}else{
			// Will always be Earth if it's not Mars or Moon because we
			// set it earlier.
			mapOptions = {
				zoom: 10,
				center: new google.maps.LatLng(51.390209,-3.179855),
				mapTypeId: google.maps.MapTypeId.SATELLITE,
				draggableCursor: 'url(imgs/crosshairsS.png) 32 32, crosshair',
				scaleControl: true,
				streetViewControl: false
			};
		}

		this.map = new google.maps.Map(document.getElementById('map_canvas'),mapOptions);

		// Setup a copyright/credit line, emulating the standard Google style
		var creditNode = document.createElement('div');
		creditNode.id = 'credit-control';
		creditNode.style.fontSize = '11px';
		creditNode.style.fontFamily = 'Arial, sans-serif';
		creditNode.style.margin = '0 2px 2px 0';
		creditNode.style.whitespace = 'nowrap';
		creditNode.index = 0;

		// push the credit/copyright custom control
		this.map.controls[google.maps.ControlPosition.BOTTOM_RIGHT].push(creditNode);

		// add the new map types to map.mapTypes
		for(key in this.mapTypes){
			this.map.mapTypes.set(key, new google.maps.ImageMapType(this.mapTypes[key]));
		}

		// Listen for mouse clicks.
		google.maps.event.addListener(this.map, 'click', function(event) { _obj.addCrater(event.latLng); });
		
		if(planet != 'Earth') this.map.setMapTypeId(planetCode);

		return this;
	}

	//==========================================================================================
	// Called when the go back button is pressed.
	CraterImpact.prototype.goBack = function(){
		window.location = "input.html?" + (this.lang ? 'lang='+this.lang : '') + (this.value.dist ? '&dist='+this.value.dist : '') + (this.value.diam ? '&diam='+this.value.diam : '')+(this.value.trag ? '&trag='+this.value.trag : '') + (this.value.velo ? '&velo='+this.value.velo : '') + (this.value.pjd ? '&pjd='+this.value.pjd : '') + (this.value.tgd ? '&tgd='+this.value.tgd : '') + (this.value.wlvl ? '&wlvl='+this.value.wlvl : '') + (this.value.planet ? '&planet='+this.value.planet : '');
	}



	//==================================================================================
	// Adds a crater on the map at the selected location to the calculated size.
	CraterImpact.prototype.addCrater = function(location_){
		this.log('addCrater',location_,this.dataProvider.impactor.crDiam)
		var location1 = location_;
		this.dataProvider.setCbSelectDepthObject(this.selectedBuilding);
		var lat = location1.lat();
		var lng = location1.lng();
		this.dataProvider.setLatitude(parseFloat(lat));
		this.dataProvider.setLongitude( parseFloat(lng));
		this.dataProvider.setCbLocation(parseInt(this.cmbLocation));

		lox = location_;
		this.log(crater,lox)
		// if crater exists remove from map.
		if(crater != null) crater.setMap(null);

		var zoom = this.map.getZoom();

		var lat = lox.lat();
		var lng = lox.lng();

		var imageBounds = craterBounds(lat, lng, this.dataProvider.impactor.crDiam);
		crater = new google.maps.GroundOverlay('imgs/craterImpact.png', imageBounds);
		// Add new ground overlay for the crater.
		crater.setMap(this.map);

		this.log(crater, this.map, imageBounds)

	}
	
	//=================================================================================
	CraterImpact.prototype.processResults = function(){

		lang = "en";
		if(this.query.lang) lang = this.query.lang;
		this.loadLanguage(lang);

		var planetname = this.query.planet;
		this.log(planetname)

		var _obj = this;
		if(google) google.maps.event.addDomListener(window, 'load', _obj.initializeMap);

		// Remove unwanted DOM elements
		if(planetname == "Earth"){
			E('.forEarth').css({'display':'block'});
			E('.forMoon').css({'display':'none'});
			E('.forMars').css({'display':'none'});
		}else if(planetname == "Moon"){
			E('.forEarth').css({'display':'none'});
			E('.forMoon').css({'display':'block'});
			E('.forMars').css({'display':'none'});
		}else if(planetname == "Mars"){
			E('.forEarth').css({'display':'none'});
			E('.forMoon').css({'display':'none'});
			E('.forMars').css({'display':'block'});
		}

		var mapTypes = {};
		var lang;
		var planet;

		/* Images for the crater screen*/
		images.crater.img.src = 'imgs/crater1.png';
		images.sphinx.img.src = 'imgs/spynx.png';
		images.bigBen.img.src = 'imgs/bigBen.png';
		images.eiffel.img.src = 'imgs/eifel_tower.png';
		images.empire.img.src = 'imgs/empire_state.png';
		images.cnTower.img.src = 'imgs/cn_tower.png';
		images.burj.img.src = 'imgs/burj_dubai.png';

		this.cmbLocation = 0;	// The location combo box
		this.selectedBuilding = 0;	// The selected building

		//input values from previous screen
		var dist = this.value.dist;
		var diam = this.value.diam;
		var traj = this.value.traj;
		var velo = this.value.velo;
		var pjd = this.value.pjd;
		var tgd = this.value.tgd;
		var wlvl = this.value.wlvl;

		var calcs; // Will do the calcs

		// Locations for crater placement
		var lox;

		// For drawing scale on crater screen
		var leftArrow = new Image();
		var rightArrow = new Image();
		leftArrow.src = 'imgs/arrowL.png';
		rightArrow.src = 'imgs/arrowR.png';

		this.prepareView();

		this.map;
		var mapTypeIds = [];

		return this;
	}
	
	// Deal with a change in language - update the DOM
	CraterImpact.prototype.updateLanguage = function(){

		this.log('updateLanguage',this.dict);

		x = this.str('lblImpactVal');
		E("#InputValues_Title").html(x);

		x = this.str('htParameter');
		E("#Thead_param").html(x);
		E("#Thead_param1").html(x);
		E("#Thead_param3").html(x);
		E("#Thead_param4").html(x);

		x = this.str('htValue');
		E("#Thead_value").html(x);
		E("#Thead_value1").html(x);
		E("#Thead_value3").html(x);
		E("#Thead_value4").html(x)

		x = this.str('lblSelect');
		E("#SelectLM_Title").html(x);
		E("#cpLocation option:eq(0)").html(x);
		E("#cpLocationMoon option:eq(0)").html(x);
		E("#cpLocationMars option:eq(0)").html(x);
		E("#cpLandmark option:eq(0)").html(x);

		E('#cpLandmark option:eq(1)').html(this.str('lblSphinx'));
		E('#cpLandmark option:eq(2)').html(this.str('lblBen'));
		E('#cpLandmark option:eq(3)').html(this.str('lblEiffel'));
		E('#cpLandmark option:eq(4)').html(this.str('lblEmpireSt'));
		E('#cpLandmark option:eq(5)').html(this.str('lblCN'));
		E('#cpLandmark option:eq(6)').html(this.str('lblBurj'));

		E("#MapInst").html(this.str('lblClickMap'));
		E("#BT_Back").html(this.str('btBack'));

		var result = this.str('result');
		x = this.str('cvsData');
		E("#BT_Data").html(x);
		E("#Data_View_Title").html(result+" - " + x);

		x = this.str('cvsDepth');
		E("#BT_CraterDepth").html(x);
		E("#Crater_Depth_Title").html(result+" - " + x);

		x = this.str('cvsSize');
		E("#BT_CraterPlace").html(x);
		E("#Crater_Size_Title").html(result+" - " +x);

		E("#LB_SelectLandmark").html(this.str('lblLandmark'));
		E("#LB_InpactValues").html(this.str('lblInVals'));
		E("#LB_Damage").html(this.str('damage').replace(/%DISTANCE%/,this.value.dist));
		E("#LB_InputEnergy").html(this.str('lblImpEnergy'));
		E("#LB_Impactor").html(this.str('lblWhatImpactor'));
		E("#LB_Fireball").html(this.str('lblFireball'));

		return this;
	}

	//============================================
	// Parse the XML for this page
	CraterImpact.prototype.onload = function(){

		this.log('onload',this.dataProvider,this.dict);

		// Pass values to data provider
		// Values from prev screen.
		this.dataProvider.setSelected_language(this.value.lang);
		this.dataProvider.setImpactDist(this.value.dist);
		this.dataProvider.setProjDiam(this.value.diam);
		this.dataProvider.setProjAngle(this.value.traj);
		this.dataProvider.setProjVel(this.value.velo);
		this.dataProvider.setCbPjDens(this.value.pjd);
		this.dataProvider.setCbTgDens(this.value.tgd);
		this.dataProvider.setSlTgDepth(this.value.wlvl);

		this.planets = {
			'Earth': {'Name':'Earth','R':6370},
			'Moon': {'Name':'Moon','G':1.622,'R':1737.4,'V':2.1958*Math.pow(10,10),'l':2.5 * Math.pow(10,39),'p':7.52* Math.pow(10,25),'rhoSurface':0.0020,'scaleHeight':65000},
			'Mars': {'Name':'Mars','G':3711,'R':3390,'V':1.6318*Math.pow(10,11),'l':3.0 * Math.pow(10,44),'p':1.5* Math.pow(10,25),'rhoSurface':0.020,'scaleHeight':11100}
		}

		// Setup the calculations
		calcs = new CraterCalcs(this.planets[this.value.planet]);			
		
		// Do calculation
		calcs = calcs.getData(this.dataProvider,this.dict);	// From CraterImpact.calculations.js
		this.dataProvider = calcs.dataProvider;

		// Once the calc is complete, update the UI with the results
		var _obj = this;
		function makeTable(d,j){
			if(!j) j = 0;
			var keys = d.keys();
			var values = d.values();
			var tableData = "";
			for(i = 0; i < keys.length-j ; i++) tableData = tableData + "<tr"+(i % 2 && i != 0 ? "" : " class=\"alt\"")+"><td>"+ keys[i]+ "</td><td>" + values[i] + "</td></tr>";
			return tableData;
		}
		function updateTables(){

			d = _obj.dataProvider;

			_obj.log('updateTables',d)

			// Sets the output array that falls on the map screeen.
			E('#ImpactValuesTable').html(makeTable(d.getDgOutputs()));

			// Sets the input array that is the first table in the Data View.
			E('#InputValuesTable').html(makeTable(d.getDgInputs()));
	
			// Sets the damage text which is the second table of the data view are.
			E("#LB_Damage").html( _obj.str('damage').replace(/%DISTANCE%/,_obj.value.dist +" km "));
			E('#DamageInfo').html(d.getTxtDamage());

			// Sets the data for the energy table which is the third table of the data view.
			E('#InputEnergyTable').html(makeTable(d.getDgEnergy()));

			// Set the what happens to the impactor text.
			E('#ImpactorInfo').html(d.getTxtImpactor());

			// Sets if a fireball has been seen which is the final table of the data view.
			//if dist is 0 do not display the exposure, the last value in the fire array.
			E('#FireballTable').html(makeTable( d.getDgFirevall() , _obj.value.dist == 0 ? 1 : 0 ));

			_obj.drawScale();
		}		
		// Update the tables
		updateTables();

		this.selectLocation(E('#cpLocation'+(this.value.planet=="Earth" ? "": this.value.planet )).e[0]);


		return this;
	}


	// @constructor
	function USGSOverlay(bounds, image, map) {

		// Now initialize all properties.
		this.bounds_ = bounds;
		this.image_ = image;
		this.map_ = map;

		// We define a property to hold the image's div. We'll
		// actually create this div upon receipt of the onAdd()
		// method so we'll leave it null for now.
		this.div_ = null;

		// Explicitly call setMap on this overlay
		this.setMap(map);
	}

	// onAdd is called when the map's panes are ready and the overlay has been
	// added to the map.
	USGSOverlay.prototype.onAdd = function() {

		// Create the DIV and set some basic attributes.
		var div = document.createElement('div');
		div.style.borderStyle = 'none';
		div.style.borderWidth = '0px';
		div.style.position = 'absolute';

		// Create an IMG element and attach it to the DIV.
		var img = document.createElement('img');
		img.src = this.image_;
		img.style.width = '100%';
		img.style.height = '100%';
		img.style.position = 'absolute';
		div.appendChild(img);

		// Set the overlay's div_ property to this DIV
		this.div_ = div;

		// We add an overlay to a map via one of the map's panes.
		// We'll add this overlay to the overlayLayer pane.
		var panes = this.getPanes();
		panes.overlayLayer.appendChild(div);
	}

	USGSOverlay.prototype.draw = function() {
		// We use the south-west and north-east
		// coordinates of the overlay to peg it to the correct position and size.
		// To do this, we need to retrieve the projection from the overlay.
		var overlayProjection = this.getProjection();

		// Retrieve the south-west and north-east coordinates of this overlay
		// in LatLngs and convert them to pixel coordinates.
		// We'll use these coordinates to resize the div.
		var sw = overlayProjection.fromLatLngToDivPixel(this.bounds_.getSouthWest());
		var ne = overlayProjection.fromLatLngToDivPixel(this.bounds_.getNorthEast());

		// Resize the image's div to fit the indicated dimensions.
		var div = this.div_;
		div.style.left = sw.x + 'px';
		div.style.top = ne.y + 'px';
		div.style.width = (ne.x - sw.x) + 'px';
		div.style.height = (sw.y - ne.y) + 'px';

	}

	USGSOverlay.prototype.onRemove = function() {
		this.div_.parentNode.removeChild(this.div_);
		this.div_ = null;
	}

	// Normalizes the tile URL so that tiles repeat across the x axis (horizontally) like the
	// standard Google map tiles.
	function getHorizontallyRepeatingTileUrl(coord, zoom, urlfunc) {
		var y = coord.y;
		var x = coord.x;

		// tile range in one direction range is dependent on zoom level
		// 0 = 1 tile, 1 = 2 tiles, 2 = 4 tiles, 3 = 8 tiles, etc
		var tileRange = 1 << zoom;

		// don't repeat across y-axis (vertically)
		if (y < 0 || y >= tileRange) return null;

		// repeat across x-axis
		if (x < 0 || x >= tileRange) x = (x % tileRange + tileRange) % tileRange;

		return urlfunc({x:x,y:y}, zoom);
	}

	function getMarsTileUrl(baseUrl, coord, zoom) {
		var bound = Math.pow(2, zoom);
		var x = coord.x;
		var y = coord.y;
		var quads = ['t'];

		for(var z = 0; z < zoom; z++){
			bound = bound / 2;
			if(y < bound){
				if(x < bound){
					quads.push('q');
				}else{
					quads.push('r');
					x -= bound;
				}
			}else{
				if(x < bound){
					quads.push('t');
					y -= bound;
				}else{
					quads.push('s');
					x -= bound;
					y -= bound;
				}
			}
		}
		return baseUrl + quads.join('') + ".jpg";
	}

	//===================================================================================
	// Calculate the crater bounds.
	function craterBounds(lat_, lon_ ,craterDiameter){
		var lat1 = lat_;
		var lon1 = lon_;
		var d  = Math.SQRT2*craterDiameter/2.0;
		var R = 6370000;
		var brng1 = 45*Math.PI/180;
		var brng2 = 225*Math.PI/180;
		lat1 = lat1*Math.PI/180;
		lon1 = lon1*Math.PI/180;

		var lat2 = Math.asin( Math.sin(lat1)*Math.cos(d/R) + Math.cos(lat1)*Math.sin(d/R)*Math.cos(brng1) );
		var lon2 = lon1 + Math.atan2(Math.sin(brng1)*Math.sin(d/R)*Math.cos(lat1), Math.cos(d/R)-Math.sin(lat1)*Math.sin(lat2));

		var lat3 = Math.asin( Math.sin(lat1)*Math.cos(d/R) + Math.cos(lat1)*Math.sin(d/R)*Math.cos(brng2) );
		var lon3 = lon1 + Math.atan2(Math.sin(brng2)*Math.sin(d/R)*Math.cos(lat1), Math.cos(d/R)-Math.sin(lat1)*Math.sin(lat2));

		lat2 = lat2/(Math.PI/180);
		lon2 = lon2/(Math.PI/180);
		lat3 = lat3/(Math.PI/180);
		lon3 = lon3/(Math.PI/180);

		var bound = new google.maps.LatLngBounds( new google.maps.LatLng(lat3, lon3), new google.maps.LatLng(lat2,lon2));		

		return bound;
	}
	function height(el){
		if(!el) return 0;
		if('getComputedStyle' in window) return parseInt(window.getComputedStyle(el, null).getPropertyValue('height'));
		else return parseInt(el.currentStyle.height);	
	}

})(E);	// Self-closing function