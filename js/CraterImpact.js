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
		this.lang = "en";
		this.gmap = false;
		this.scaling = 13;	// Factor to downsize asteroid by for display
		this.languages = { "cy": "Cymraeg", "de": "Deutsch", "gr": "E&lambda;&lambda;&eta;&nu;&iota;&kappa;&#x3AC;", "en": "English", "es": "Espa&ntilde;ol", "fr": "Fran&ccedil;ais", "it": "Italiano", "pl": "Polski", "pt": "Portugu&ecirc;s", "ro": "Rom&acirc;n&#x103;" };
		this.delim = " &#x276F; ";
		this.defaults = {
			"lang": "en",
			"dist": 0,
			"diam": 0,
			"traj": 45,	// Most likely impact angle (Shoemaker 1965)
			"velo": 0,
			"pjd": 0,
			"tgd": 0,
			"wlvl": 0,
			"planet": "Earth"
		}
		this.values = {};
		this.query = {};

		// Reset values to defaults		
		for(var v in this.defaults) this.values[v] = (this.query[v]) ? this.query[v] : this.defaults[v];

		this.parseQueryString();
		this.setValues();
		if(this.query.lang) this.lang = this.query.lang;
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
		
		// Deal with the language menu
		S('#MenuLanguage .choice').on('click',{},function(e){
			var ul = S('#MenuLanguage ul');
			ul.css({'display':(ul.css('display')=='block' ? 'none' : 'block')});
		});

		var _obj = this;
		// We'll need to change the sizes when the window changes size
		window.addEventListener('resize',function(e){ _obj.resize(); });
		this.resize();

		return this;
	}

	CraterImpact.prototype.resize = function(){
		var el,h;
		wide = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
		tall = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

		// Update main panel
		var els = [S('.main'),S('.modal-inner')];
		for(var i = 0; i < els.length; i++){
			for(var j = 0; j < els[i].e.length; j++){
				h = height(els[i].e[j]);
				S(els[i].e[j]).css({'top':((!isNaN(h) && h > 0 && tall > h) ? ((tall-h)/2)+'px' : '')});
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

	// Load a language file
	CraterImpact.prototype.loadLanguage = function(l){
		this.log('setLanguage',l);
		this.lang = l;
		var ul = S('#MenuLanguage ul');
		function updateLang(data,attr){
			this.log('updating with',data,attr)
			this.dict = YAML2JSON(data);

			// Update common elements
			S('#AppTitle a').html(this.str('lblTitle'));
			S('#ACK a').html(this.str('lbAcknow'));

			if(typeof this.updateLanguage==="function") this.updateLanguage();
			if(typeof this.onload==="function") this.onload();

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
				// Add events to list items
				S('#MenuLanguage li').on('click',{me:this},function(e){
					// Hide the menu
					ul.css({'display':''});
					// Load the new language
					e.data.me.loadLanguage(S(e.currentTarget).attr('id'));
				});
			}
		}
		S().ajax('lang/'+l+'.txt',{'complete':updateLang,'this':this});
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