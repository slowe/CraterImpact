// Define one global variable - constructor
var CraterImpact;

(function(S) {

	var wide = 0;
	var tall = 0;

	function height(el){
		if(!el) return 0;
		if(el.offsetHeight) return parseInt(el.offsetHeight)
		if('getComputedStyle' in window) return parseInt(window.getComputedStyle(el, null).getPropertyValue('height'));
		if(el.currentStyle) return parseInt(el.currentStyle.height);
		return 0;
	}

	// Very basic YAML parser. Only deals with simple key/value pairs
	function YAML2JSON(str,format,a,z){
		var newdata = {};
		if(typeof str==="string"){
			str = str.replace(/\r/,'');
			str = str.split(/[\n]/);
		}else return newdata;
		if(typeof a!=="number") a = 1;
		if(typeof z!=="number") z = str.length;

		var idx;
		for(var i = a; i < z; i++){
			if(str[i] == "---") continue;
			var idx = str[i].indexOf(":");
			if(idx > 0) newdata[str[i].substr(0,idx)] = str[i].substr(idx+1).replace(/^[\t\s]*/,"").replace(/^\"(.*)\"$/,"$1");
		}
		return newdata;
	}
	
	// Define our main function
	CraterImpact = function(inp){

		this.dict = {};
		this.lang = "";
		this.gmap = false;
		this.scaling = 13;	// Factor to downsize asteroid by for display
		this.languages = { "cy": "Cymraeg", "de": "Deutsch", "gr": "E&lambda;&lambda;&eta;&nu;&iota;&kappa;&#x3AC;", "en": "English", "es": "Espa&ntilde;ol", "et": "Eesti keel", "fr": "Fran&ccedil;ais", "it": "Italiano", "pl": "Polski", "pt": "Portugu&ecirc;s", "ro": "Rom&acirc;n&#x103;" };
		this.planets = {
			'Earth': {'key':'bodyEarth','img':'imgs/earth_small.png','Name':'Earth','R':6370},
			'Moon': {'key':'bodyMoon','img':'imgs/moon_small.png','Name':'Moon','G':1.622,'R':1737.4,'V':2.1958*Math.pow(10,10),'l':2.5 * Math.pow(10,39),'p':7.52* Math.pow(10,25),'rhoSurface':4e-15,'scaleHeight':0},//rhoSurface old value = 0.0020, replaced with value calculated using estimated composition from http://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html. Scale height previously 65000
			'Mars': {'key':'bodyMars','img':'imgs/mars_small.png','Name':'Mars','G':3711,'R':3390,'V':1.6318*Math.pow(10,11),'l':3.0 * Math.pow(10,44),'p':1.5* Math.pow(10,25),'rhoSurface':0.020,'scaleHeight':11100}
		}
		this.delim = " &#x276F; ";
		this.defaults = {
			"lang": "en",
			"dist": 0,
			"diam": 0,
			"traj": 45,	// Most likely impact angle (Shoemaker 1965)
			"velo": 0,
			"pjd": 0,
			"tjd": 0,
			"wlvl": 0,
			"planet": "Earth"
		}
		this.values = {};
		this.query = {};

		// Reset values to defaults		
		for(var v in this.defaults) this.values[v] = (this.query[v]) ? this.query[v] : this.defaults[v];

		this.parseQueryString();
		this.setValues();
		
		// Country codes at http://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
		this.lang = (typeof this.query.lang==="string") ? this.query.lang : (navigator ? (navigator.userLanguage||navigator.systemLanguage||navigator.language||browser.language) : this.lang);
		this.log('new crater',this.query);
		
		// Open the acknowledgements
		S('#ACK a').on('click',{me:this},function(e){
			S('#acknowledgements').css({'display': 'block'});
			var h = height(S('#ACK_inner').e[0]);
			S('#ACK_inner').css({'top':((tall-h)/2)+'px'});
		});

		// Add close buttons to modal dialogs
		var m = S('.modal-inner');
		for(var i = 0; i < m.e.length; i++){
			var el = S(m.e[i]);
			el.html('<div class="close"><button>&times;</button></div>'+el.html())
		}
		// Attach events to close buttons
		S('.modal-inner .close button').on('click',function(e){
			S(e.currentTarget).parent().parent().parent().css({'display': 'none'});
		});
		
		// Remove unwanted DOM elements
		if(this.values.planet) S('body').addClass(this.values.planet)

		// Deal with the language menu
		S('#MenuLanguage .choice').on('click',{},function(e){
			var ul = S('#MenuLanguage ul');
			ul.css({'display':(ul.css('display')=='block' ? 'none' : 'block')});
		});

		// Deal with the planet menu
		S('#PlanetChoice .choice').on('click',{},function(e){
			var ul = S('#PlanetChoice ul');
			ul.css({'display':(ul.css('display')=='block' ? 'none' : 'block')});
		});

		S('#header .dropdown ul').css({'display':'none'});

		var _obj = this;
		// We'll need to change the sizes when the window changes size
		window.addEventListener('resize',function(e){ _obj.resize(); });
		this.resize();

		return this;
	}

	CraterImpact.prototype.resize = function(){
		var el,h, t, head;
		wide = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
		tall = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
		head = height(S('#header').e[0]);

		// Update main panel
		var els = [S('.main'),S('.modal-inner')];
		for(var i = 0; i < els.length; i++){
			for(var j = 0; j < els[i].e.length; j++){
				h = height(els[i].e[j]);
				t = ((tall-h)/2);
				if(t < head) t = head;
				S(els[i].e[j]).css({'top':((!isNaN(h) && h > head && tall > h) ? t+'px' : head+'px')});
			}
		}

		// Update acknowledgement popup
		el = S('#ACK_inner');
		h = height(el.e[0]);
		if(h > 0 && tall > h) el.css({'top':((tall-h)/2)+'px'});
		
		return this;
	}

	// Parse the query string
	CraterImpact.prototype.parseQueryString = function(){
		var r = {};
		var q = location.search;
		var key,val,i,qs;
		if(q && q != '#'){
			// remove the leading ? and trailing &
			q = q.replace(/^\?/,'').replace(/\&$/,'');
			qs = q.split('&');
			for(i = 0; i < qs.length; i++){
				key = qs[i].split('=')[0];
				val = qs[i].split('=')[1];
				if(/^[0-9\.]+$/.test(val)) val = parseFloat(val);	// convert floats
				r[key] = val;
			}
		}
		this.testmode = (r['debug']) ? true : false;
		this.query = r;

		return this;
	}

	// Set defaults if not provided
	CraterImpact.prototype.setValues = function(){
		this.values = {};
		for(var v in this.defaults){
			this.values[v] = (this.query[v]) ? (parseInt(this.query[v]) ? parseInt(this.query[v]) : this.query[v]) : this.defaults[v];
		}

		this.log('setValues',this.value)
		return this;
	}

	// Switch to the appropriate planet
	CraterImpact.prototype.loadPlanet = function(p,callback){
		this.log('setPlanet',p);

		// Set the planet value
		this.values.planet = p;

		// Get the current URL
		var loc = window.location.href;

		// Remove everything after the query string
		if(loc.indexOf('?') > 0) loc = loc.substr(0,loc.indexOf('?'));

		// Set the destination to the current page
		var dest = loc;

		// If we are changing to something other than Earth and the rock 
		// type isn't ignious, we need to zap it and go back to the input
		if(p != "Earth" && this.values.tjd != "i"){
			this.values.tjd = undefined;
			// Set the destination to the input values page
			dest = "input.html";
		}

		// Update the URL
		window.location = dest+"?" + (this.lang ? 'lang='+this.lang : '') + (this.values.dist ? '&dist='+this.values.dist : '') + (this.values.diam ? '&diam='+this.values.diam : '')+(this.values.traj ? '&traj='+this.values.traj : '') + (this.values.velo ? '&velo='+this.values.velo : '') + (this.values.pjd ? '&pjd='+this.values.pjd : '') + (this.values.tjd ? '&tjd='+this.values.tjd : '') + (this.values.wlvl && this.values.planet == "Earth" ? '&wlvl='+this.values.wlvl : '') + (this.values.planet ? '&planet='+this.values.planet : '');
	};

	// Load a language file
	CraterImpact.prototype.loadLanguage = function(l,callback){
		this.log('setLanguage',l,callback);
		this.lang = l;
		var ul = S('#MenuLanguage ul');
		function updateLang(data,attr){
			this.log('loadLanguage',this.lang,'success');
			this.dict = YAML2JSON(data);

			// Update common elements
			S('#AppTitle a').html(this.str('lblTitle'));
			S('#ACK a').html(this.str('lbAcknow'));

			if(typeof this.updateLanguage==="function") this.updateLanguage();
			if(typeof this.onload==="function") this.onload();
			if(typeof callback==="function") callback.call(this);

			// Update current language
			if(S('#MenuLanguage').e.length > 0){
				S('#MenuLanguage .choice').html(this.languages[this.lang])
				// Update choices
				var list = "";
				for(var l in this.languages) if(l != this.lang) list += '<li id="'+l+'">'+this.languages[l]+'</li>';
				// Remove current event
				S('#MenuLanguage li').off('click');
				// Update list
				ul.html(list);
				ul.css({'display':'none'});
				// Add events to list items
				S('#MenuLanguage li').on('click',{me:this},function(e){
					// Hide the menu
					ul.css({'display':''});
					// Load the new language
					e.data.me.loadLanguage(S(e.currentTarget).attr('id'),callback);
				});
			}
			// Update planet if that exists
			if(S('#PlanetChoice').length > 0){
				if(this.values.planet && this.planets[this.values.planet]){
					var list = "";
					for(var p in this.planets){
						if(p != this.values.planet) list += '<li id="'+p+'"><button><img src="'+this.planets[p].img+'" title="'+this.str(this.planets[p].key)+'" /><span>'+this.str(this.planets[p].key)+'</span></button></li>';
					}
					S('#PlanetChoice li').off('click');
					var ulp = S('#PlanetChoice ul');
					ulp.html(list);
					ulp.css({'display':'none'});
					S('#PlanetChoice li').on('click',{me:this},function(e){
						ulp.css({'display':''});
						e.data.me.loadPlanet(S(e.currentTarget).attr('id'))
					});
					S('#PlanetChoice .choice').html('<img src="'+this.planets[this.values.planet].img+'" /><span>'+this.str(this.planets[this.values.planet].key)+'</span>')
				}
			}
		}
		function failLang(e){
			this.log('loadLanguage',this.lang,'fail');
			if(this.lang.length > 2) this.loadLanguage(this.lang.substr(0,2),callback)
		}
		S().ajax('lang/'+l+'.txt',{'complete':updateLang,'this':this,'error':failLang});
	}

	CraterImpact.prototype.str = function(str){
		return (this.dict[str]) ? this.dict[str] : "UNKNOWN KEY";
	}
	

	// Log messages
	CraterImpact.prototype.log = function(){
		//if(!this.testmode) return this;
		var args = Array.prototype.slice.call(arguments, 0);
		if(console && typeof console.log==="function") console.log('CRATER IMPACT:',args);
		return this;
	}


})(S);	// Self-closing function