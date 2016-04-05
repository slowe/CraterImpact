S(document).ready(function(){

	// ISO 3166 country code conversion
	var cc = {'AD':'Andorra','AE':'United Arab Emirates','AF':'Afghanistan','AG':'Antigua and Barbuda','AI':'Anguilla','AL':'Albania','AM':'Armenia','AO':'Angola','AQ':'Antarctica','AR':'Argentina','AS':'American Samoa','AT':'Austria','AU':'Australia','AW':'Aruba','AX':'Åland Islands','AZ':'Azerbaijan','BA':'Bosnia and Herzegovina','BB':'Barbados','BD':'Bangladesh','BE':'Belgium','BF':'Burkina Faso','BG':'Bulgaria','BH':'Bahrain','BI':'Burundi','BJ':'Benin','BL':'Saint Barthélemy','BM':'Bermuda','BN':'Brunei Darussalam','BO':'Bolivia','BQ':'Bonaire, Sint Eustatius and Saba','BR':'Brazil','BS':'Bahamas','BT':'Bhutan','BV':'Bouvet Island','BW':'Botswana','BY':'Belarus','BZ':'Belize','CA':'Canada','CC':'Cocos (Keeling) Islands','CD':'Congo, the Democratic Republic of the','CF':'Central African Republic','CG':'Congo','CH':'Switzerland','CI':'Côte d\'Ivoire','CK':'Cook Islands','CL':'Chile','CM':'Cameroon','CN':'China','CO':'Colombia','CR':'Costa Rica','CU':'Cuba','CV':'Cabo Verde','CW':'Curaçao','CX':'Christmas Island','CY':'Cyprus','CZ':'Czech Republic','DE':'Germany','DJ':'Djibouti','DK':'Denmark','DM':'Dominica','DO':'Dominican Republic','DZ':'Algeria','EC':'Ecuador','EE':'Estonia','EG':'Egypt','EH':'Western Sahara','ER':'Eritrea','ES':'Spain','ET':'Ethiopia','FI':'Finland','FJ':'Fiji','FK':'Falkland Islands (Malvinas)','FM':'Micronesia, Federated States of','FO':'Faroe Islands','FR':'France','GA':'Gabon','GB':'UK','GD':'Grenada','GE':'Georgia','GF':'French Guiana','GG':'Guernsey','GH':'Ghana','GI':'Gibraltar','GL':'Greenland','GM':'Gambia','GN':'Guinea','GP':'Guadeloupe','GQ':'Equatorial Guinea','GR':'Greece','GS':'South Georgia and the South Sandwich Islands','GT':'Guatemala','GU':'Guam','GW':'Guinea-Bissau','GY':'Guyana','HK':'Hong Kong','HM':'Heard Island and McDonald Islands','HN':'Honduras','HR':'Croatia','HT':'Haiti','HU':'Hungary','ID':'Indonesia','IE':'Ireland','IL':'Israel','IM':'Isle of Man','IN':'India','IO':'British Indian Ocean Territory','IQ':'Iraq','IR':'Iran, Islamic Republic of','IS':'Iceland','IT':'Italy','JE':'Jersey','JM':'Jamaica','JO':'Jordan','JP':'Japan','KE':'Kenya','KG':'Kyrgyzstan','KH':'Cambodia','KI':'Kiribati','KM':'Comoros','KN':'Saint Kitts and Nevis','KP':'Korea, Democratic People\'s Republic of','KR':'Korea, Republic of','KW':'Kuwait','KY':'Cayman Islands','KZ':'Kazakhstan','LA':'Lao People\'s Democratic Republic','LB':'Lebanon','LC':'Saint Lucia','LI':'Liechtenstein','LK':'Sri Lanka','LR':'Liberia','LS':'Lesotho','LT':'Lithuania','LU':'Luxembourg','LV':'Latvia','LY':'Libya','MA':'Morocco','MC':'Monaco','MD':'Moldova, Republic of','ME':'Montenegro','MF':'Saint Martin (French part)','MG':'Madagascar','MH':'Marshall Islands','MK':'Macedonia, the former Yugoslav Republic of','ML':'Mali','MM':'Myanmar','MN':'Mongolia','MO':'Macao','MP':'Northern Mariana Islands','MQ':'Martinique','MR':'Mauritania','MS':'Montserrat','MT':'Malta','MU':'Mauritius','MV':'Maldives','MW':'Malawi','MX':'Mexico','MY':'Malaysia','MZ':'Mozambique','NA':'Namibia','NC':'New Caledonia','NE':'Niger','NF':'Norfolk Island','NG':'Nigeria','NI':'Nicaragua','NL':'Netherlands','NO':'Norway','NP':'Nepal','NR':'Nauru','NU':'Niue','NZ':'New Zealand','OM':'Oman','PA':'Panama','PE':'Peru','PF':'French Polynesia','PG':'Papua New Guinea','PH':'Philippines','PK':'Pakistan','PL':'Poland','PM':'Saint Pierre and Miquelon','PN':'Pitcairn','PR':'Puerto Rico','PS':'Palestine, State of','PT':'Portugal','PW':'Palau','PY':'Paraguay','QA':'Qatar','RE':'Réunion','RO':'Romania','RS':'Serbia','RU':'Russian Federation','RW':'Rwanda','SA':'Saudi Arabia','SB':'Solomon Islands','SC':'Seychelles','SD':'Sudan','SE':'Sweden','SG':'Singapore','SH':'Saint Helena, Ascension and Tristan da Cunha','SI':'Slovenia','SJ':'Svalbard and Jan Mayen','SK':'Slovakia','SL':'Sierra Leone','SM':'San Marino','SN':'Senegal','SO':'Somalia','SR':'Suriname','SS':'South Sudan','ST':'Sao Tome and Principe','SV':'El Salvador','SX':'Sint Maarten','SY':'Syrian Arab Republic','SZ':'Swaziland','TC':'Turks and Caicos Islands','TD':'Chad','TF':'French Southern Territories','TG':'Togo','TH':'Thailand','TJ':'Tajikistan','TK':'Tokelau','TL':'Timor-Leste','TM':'Turkmenistan','TN':'Tunisia','TO':'Tonga','TR':'Turkey','TT':'Trinidad and Tobago','TV':'Tuvalu','TW':'Taiwan, Province of China','TZ':'Tanzania','UA':'Ukraine','UG':'Uganda','UM':'US Minor Outlying Islands','US':'USA','UY':'Uruguay','UZ':'Uzbekistan','VA':'Holy See','VC':'Saint Vincent and the Grenadines','VE':'Venezuela','VG':'British Virgin Islands','VI':'Virgin Islands, U.S.','VN':'Viet Nam','VU':'Vanuatu','WF':'Wallis and Futuna','WS':'Samoa','YE':'Yemen','YT':'Mayotte','ZA':'South Africa','ZM':'Zambia','ZW':'Zimbabwe'};

	var db = new Array();
	var ids = {};
	var loaded = {};
	var dir = "";
	S('#searchplace').on('keyup',function(e){
		if(e.originalEvent.keyCode==40 || e.originalEvent.keyCode==38){
			// Down=40
			// Up=38
			var li = S('.searchresults li');
			var s = -1;
			for(var i = 0; i < li.e.length; i++){
				if(S(li.e[i]).hasClass('selected')) s = i;
			}
			if(e.originalEvent.keyCode==40) s++;
			else s--;
			if(s < 0) s = li.e.length-1;
			if(s >= li.e.length) s = 0;
			S('.searchresults .selected').removeClass('selected');
			S(li.e[s]).addClass('selected');
		}else if(e.originalEvent.keyCode==13){
			selectName(S('.searchresults .selected'))
		}else{
			// Need to load the data file for the first letter
			var name = this.e[0].value.toLowerCase();
			var fl = name[0];
			if(fl && fl.match(/[a-zA-Z\'\`]/i)){
				if(!loaded[fl]){
					dir = 'geo/';
					S().ajax(dir+'ranked-'+fl+'.csv',{
						'complete': function(data){
							var line,i;
							if(typeof data==="string") data = data.replace(/\r/,'').split(/[\n]/);
							for(i = 0; i < data.length; i++){
								line = data[i].split(/\t/);
								if(line[0] && typeof ids[line[0]]==="undefined"){
									db.push({'id':fl+'-'+i,'truename':line[0],'name':(line[1] ? line[1] : line[0]),'cc':line[2],'n':parseInt(line[3])});
									ids[fl+'-'+i] = db.length-1;
								}
							}
							processResult(name);
						},
						'error': function(e){ console.log(e); }
					});
					loaded[fl] = true;
				}else processResult(name);
			}else processResult('');
		}
	});

	// Select one of the people in the drop down list
	function selectName(selected){
		// Get the ID from the DOM element's data-id attribute
		// Use that to find the index that corresponds to in the "db" hash
		var id = ids[selected.attr('data-id')];
		S().ajax('geo/cities/'+db[id].id+'.txt',{
			'complete': function(data){
				line = data.split(/\t/);
				craterimpact.setLocation(parseFloat(line[0]),parseFloat(line[1]),11);
				// Zap search results
				S('.searchresults').html('');
				S('#searchplace').e[0].value = (db[id].truename ? db[id].truename : db[id].name);
			},
			'error': function(e){ console.log(e); }
		});

	}

	function processResult(name){
		var html = "";
		var tmp = new Array();
		var li = S('.searchresults li');
		for(var i = 0 ; i < li.e.length ; i++) S(li.e[i]).off('click');
		name = name.toLowerCase();
		if(name.length >= 1){
			var names = name.split(/ /);
			var n = names.length;
			var mx = 0;
			for(var i = 0; i < db.length; i++){
				if(db[i].n > mx) mx = db[i].n;
				db[i].rank = 0;
			}
			for(var i = 0; i < db.length; i++){
				rank = 0;
				for(m = 0; m < n ; m++){
					if(db[i].name.toLowerCase().indexOf(names[m]) >= 0) rank++;
					else{
						if(db[i].truename.toLowerCase().indexOf(names[m]) >= 0) rank++;
						else rank--;
					}
				}
				if(rank > 0){
					datum = db[i];
					datum.rank = rank*db[i].n/mx;
					tmp.push(datum);
				}
			}
			tmp = sortBy(tmp,'rank');
			if(tmp.length > 0){
				S('.searchresults li').off('click');
				html = "<ol>";
				var n = Math.min(tmp.length,8);
				for(var i = 0; i < n; i++){
					html += '<li data-id="'+tmp[i].id+'" '+(i==0 ? ' class="selected"':'')+'><div class="name">'+tmp[i].truename+(tmp[i].cc && cc[tmp[i].cc] ? ', '+cc[tmp[i].cc]+'' : "")+"</div></li>";
				}
				html += "</ol>";
			}
		}
		S('.searchresults').html(html);
		var li = S('.searchresults li');
		for(var i = 0 ; i < li.e.length ; i++) S(li.e[i]).on('click',function(){ selectName(this); });
	}

	// Sort the data
	function sortBy(arr,i){
		yaxis = i;
		return arr.sort(function (a, b) {
			return a[i] < b[i] ? 1 : -1;
		});
	}

});