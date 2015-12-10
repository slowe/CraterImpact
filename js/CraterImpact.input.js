(function(E) {

	function makeSlider(input,html,callback){
		var inp = E(input);
		var html5Slider = E(html);
		html5Slider.addClass('noUi-target noUi-ltr noUi-horizontal noUi-background');
		noUiSlider.create(html5Slider.e[0], {
			start: parseFloat(inp.attr('value')),
			step: parseFloat(inp.attr('step')),
			range: {
				'min': parseFloat(inp.attr('min')),
				'max': parseFloat(inp.attr('max'))
			}
		});
		html5Slider.e[0].noUiSlider.on('update', function(values, handle) {
			var value = values[handle];
			if(typeof callback==="function") callback.call(inp.e[0],value)
			if(handle) inp.e[0].value = value;
			else inp.e[0].value = Math.round(value);
		});
		inp.on('change', function(){
			html5Slider.e[0].noUiSlider.set([this.attr('value')]);
		});

	}

	CraterImpact.prototype.processInput = function(){

		this.initialiseInput();

		// Update this language
		crater.loadLanguage(crater.lang);

		var planetname = crater.query.planet;
		console.log(planetname,E("#cpTgDensMarsMoon").e[0])
		if(planetname == "Earth") E("#cpTgDensMarsMoon").css({'display':'none'});
		else E("#cpTgDens").css({'display':'none'});

		this.prepareView();
	
		// Make sliders
		makeSlider('#ProjectileSize','#ProjectileSizeSlider',this.updateDiameter);
		makeSlider('#ProjectileAngle','#ProjectileAngleSlider',this.updateAngle);
		makeSlider('#ProjectileVelocity','#ProjectileVelocitySlider',this.updateVelocity);
		makeSlider('#ImpactDistance','#ImpactDistanceSlider',this.updateDistance);
		makeSlider('#WaterDepth','#WaterDepthSlider',this.updateWater);

		// Add events
		E('#cpPjDens').on('change',{me:this},function(e){ e.data.me.selectPjDensity(e.currentTarget); });
		E('#cpTgDens').on('change',{me:this},function(e){ e.data.me.selectTgDensity(e.currentTarget); });
		E('#cpTgDensMarsMoon').on('change',{me:this},function(e){ e.data.me.selectTgDensityMarsMoon(e.currentTarget); });
		E('#BT_Reset').on('click',{me:this},function(e){ e.data.me.resetValues(); });
		E('#BT_Submit').on('click',{me:this},function(e){ e.data.me.validateAndSumbit(); });
		E('#BT_Help').on('click',{me:this},function(e){ e.data.me.help(); });
		return this;
	};

	//###############################################################
	/**
	The control code for the input screen and its various elements  
	which are a mixture of HTML5.0 compatible XHTML4.0
	**/
	//###############################################################
	var distVal = 0;	/**Distance from impact zone**/
	var diameterVal = 0;	/**Diamiter of projectile.**/
	var tragAngleVal = 90;	/**Angle of impact**/
	var projVelVal = 0;	/**Object velocity.**/
	var pjDens = 0;	/**Projectile Density**/
	var tgDens = 0;	/**Target Density**/
	var waterLevel = 0;	/**The level in mtrs when water selected**/
	
	var images = {};
	function loadImage(key,src){
		images[key] = { 'img': new Image() };
		images[key].img.src = src;
	}

	loadImage('imgAngle','imgs/impactAngle.png');
	loadImage('imgAngleB','imgs/impactAngleB.png');
	loadImage('leftArrow','imgs/arrowL.png');
	loadImage('rightArrow','imgs/arrowR.png');
	loadImage('pjd1','imgs/pjd1.jpg');
	loadImage('pjd2','imgs/pjd2.jpg');
	loadImage('pjd3','imgs/pjd3.jpg');
	loadImage('pjd4','imgs/pjd4.jpg');
	loadImage('imgBlank','imgs/blank.png');

	loadImage('tgd1','imgs/tgd1.jpg');
	loadImage('tgd2','imgs/tgd2.jpg');
	loadImage('tgd3','imgs/water.jpg');
	loadImage('mntn','imgs/water.jpg');
	loadImage('refl','imgs/water_u3.jpg');
	
	// Dynamically build array of speed images.
	var speedImgs = new Array();
	for (var i = 0; i <= 9; i++){
		var img = new Image();
		img.src = 'imgs/n' + i + '.png'; 
		speedImgs[i] = img;
	}

	loadImage('speedNeedle','imgs/speedNeedle1.png');
	loadImage('speedo','imgs/speedo.png');

	var lang = "en";
	var planet = "Earth";
	
	var input_error_title;
	var input_error_diam;
	var input_error_angle;
	var input_error_vel;
	var input_error_pjd;
	var input_error_tgd;
	var input_error_water;
	var help_title;
	var help_text;
	var help_text2;

	//==============================================
	// Called at the start to prepare the view for 
	// display
	CraterImpact.prototype.prepareView = function(){
	
		this.updateVelocity(); 
		this.updateAngle();  
		this.updateDiameter();
		this.updateWater();

		return this;
	}

	//===============================================
	// Called when the distance slider is moved to a new 
	// value.
	CraterImpact.prototype.updateDistance = function(e){
		if(!e) e = E('#ImpactDistance').attr('value');
		if(isNaN(e)) e = 0;
		distVal = parseFloat(e);
		E('#DistanceAMT').html(distVal +'&nbsp;km');
	}
	
	//==============================================
	// Called when the diameter slider is moved to a new 
	// value.
	CraterImpact.prototype.updateDiameter = function(e){
		if(!e) e = E('#ProjectileSize').attr('value');
		if(isNaN(e)) e = 0;
		// Set global value
		diameterVal = parseFloat(e);
		
		// Update displayed value
		E('#ProjectileValue').html(diameterVal + '&nbsp;m');
		
		var dv = diameterVal/10;
		var y = (dv/13);
		var x =  (dv/13);
		var cY =  153.0;
		var cX =  131.0;
		
		centerImage(E('#Projectile_Img').e[0], y, x, cY, cX);
		DrawDiameterLine(dv,cX);
		return this;
	}

	//================================================
	// Draws the diameter lines for the Asteroid diameter.
	function DrawDiameterLine(width,cX){
		var c=document.getElementById("ProjectileWidth");
		var ctx=c.getContext("2d");

		canvasReset(ctx,c);

		width = width/13.0;

		var L = c.width/2 - width/2;
		var E = c.width/2 + width/2;

		ctx.moveTo(L-12,6.5);
		ctx.lineTo(E-12,6.5);

		ctx.lineWidth = 5;
		ctx.stroke();

		ctx.drawImage(images.leftArrow.img, L-22, 0);
		ctx.drawImage(images.rightArrow.img, E-15, 0);
	}

	//=============================================
	/**
	  Provides the ability to center an image within a
	  absolute div.
	  @param img The image to be centered.
	  @param iy The native image height.
	  @param ix The native image width.
	  @param cY The canvas DIVs width.
	  @param cX The canvas DIVs height.
	  **/
	function centerImage(img, iy, ix,cY,cX){
		   	   
	   var x = ix;
	   var marx = cX/2 - x/2;
	   img.style.height = x+"px";
	   img.style.left = (marx) + "px";

	   var y = iy;
	   var mary = cY/2 - y/2;
	   img.style.width = y+"px";
	   img.style.top = (mary) + "px";
	
	}

	//===============================================
	/**
	Resets a canvas clearing any path lines or images 
	presented. Any transforms are cleared then restored 
	so that the clearRect command does not itself become 
	transformed.
	**/
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

	//=================================================
	// Called when the angle slider is moved to a new 
	// value.
	CraterImpact.prototype.updateAngle = function(e){
		if(!e) e = E('#ProjectileAngle').attr('value');
		if(isNaN(e)) e = 90;
		console.log('updateAngle',e)
		var angleVal = parseFloat(e);
		var angleValI = 90 - angleVal; //Invert value

		var c = document.getElementById("Angle");
		var ctx = c.getContext("2d");
		
		canvasReset(ctx,c);
		 
		ctx.save();
		ctx.translate(79,104);//translate to where pivot point is
		 
		//Convert degrees to radian 
		var rad = angleValI * Math.PI / 180;
		ctx.rotate(rad);//rotate context
		 
		ctx.drawImage(images.imgAngle.img,-7,-85);//draw image

		ctx.translate(-79, -104);//translate back
		ctx.restore();//restore state
		
		ctx.drawImage(images.imgAngleB.img, 55,104);//draw image
		
		ctx.font = '14pt Arial';
		
		if (angleVal >= 10) ctx.fillText(''+angleVal, 125, 40);
		else ctx.fillText(''+angleVal, 130, 40);
		ctx.font = '12pt Arial';
		
		if(angleVal >= 10) ctx.fillText('o', 150, 35);
		else ctx.fillText('o', 142, 35);
			
		tragAngleVal = angleVal;
		return this;
	 }
	 
	//==============================================
	// Called when the velocity slider is moved to a new 
	// value.
	CraterImpact.prototype.updateVelocity = function(e){
		if(!e) e = E('#ProjectileVelocity').attr('value');
		if(isNaN(e)) e = 0;
		projVelVal = parseFloat(e);
		
		var c = document.getElementById("Speedo");
		var ctx = c.getContext("2d");
		var r = 60 + projVelVal*3;
	
		ctx.drawImage(images.speedo.img,0,0);
		
		// Split speed into two values.
		var str = "" + projVelVal;
		var n1 = str.charAt(0);
		
		var img;
		if(str.length > 1){
			console.log(projVelVal,n1)
			img = speedImgs[parseInt(n1)];
			//if(n1 != 9)
			ctx.drawImage(img,63,105);
			var n2 = str.charAt(1);
			img = speedImgs[parseInt(n2)];
			//if(n2 != 9)
			ctx.drawImage(img,73,105);
		}else{
			img = speedImgs[parseInt(n1)];
			//if(n1 != 9)
			ctx.drawImage(img,68,105);
		}
		
		drawImageRot(images.speedNeedle.img,65,65,32,64,r,ctx);
		ctx.restore();
		return this;
	}
	
	//==============================================
	/**
	 Rotate an item on a canvas using rotate transforms.
	 @param img The image to rotate.
	 @param x The x coordinate of the image,
	 @param y The y coordinate of the image,
	 @param width The width of the image,
	 @param height The height of the image,
	 @param deg The rotation amount in degrees,
	 @param ctx The context on which to put the image.
	 */
	function drawImageRot(img,x,y,width,height, deg,ctx){

		//Convert degrees to radian 
		var rad = deg * Math.PI / 180;

		//Set the origin to the center of the image
		ctx.translate(x + width / 2, (y + height / 2)-20);

		//Rotate the canvas around the origin
		ctx.rotate(rad);

		//draw the image    
		ctx.drawImage(img,width / 2 * (-1),((height / 2)-18) * (-1),width,height);

		//reset the canvas  
		ctx.rotate(rad * ( -1 ) );
		ctx.translate((x + width / 2) * (-1), ((y + height / 2)-20) * (-1));
		
	}

	//=============================================
	// Called when the target density list is selected.
	CraterImpact.prototype.selectTgDensity = function(tgList){
		var idx = tgList.selectedIndex;
		var tgImg =document.getElementById("TargetImage");

		switch(idx){
			case 1:
				E('#TargetFeature').css({'display':"none"});
				E('#WaterFeature').css({'display':"block"});
				this.updateWater();
				tgImg.src = images.tgd3.img.src;
				break;
			case 2:
				E('#TargetFeature').css({'display':"block"});
				E('#WaterFeature').css({'display':"none"});
				tgImg.src = images.tgd1.img.src;
				break;
			case 3:
				E('#TargetFeature').css({'display':"block"});
				E('#WaterFeature').css({'display':"none"});
				tgImg.src = images.tgd2.img.src;
				break;
			default:
				tgImg.src = images.imgBlank.img.src;
		}
		
		tgDens = idx;
		return this;
	}

	CraterImpact.prototype.selectTgDensityMarsMoon = function(tgList){
		var idx = tgList.selectedIndex;
		var tgImg = document.getElementById("TargetImage");
		 
		switch(idx){
				case 1:
				E('#TargetFeature').css({'display':"block"});
				E('#WaterFeature').css({'display':"none"});
				tgImg.src = images.tgd2.img.src;
				break;
	
			default:
				tgImg.src = images.imgBlank.img.src;
		}
		
		tgDens = 3;
		return this;
	}
	 
	//=============================================
	// Called when the target density list is selected.
	CraterImpact.prototype.selectTgDensity2 = function(x){
		var idx = x;
		var tgImg = document.getElementById("TargetImage");

		switch(idx){
			case 1:
				E('#TargetFeature').css({'display':"none"});
				E('#WaterFeature').css({'display':"block"});
				this.updateWater();
				tgImg.src = images.tgd3.img.src;
				break;
			case 2:
				E('#TargetFeature').css({'display':"block"});
				E('#WaterFeature').css({'display':"none"});
				tgImg.src = images.tgd1.img.src;
				break;
			case 3:
				E('#TargetFeature').css({'display':"block"});
				E('#WaterFeature').css({'display':"none"});
				tgImg.src = images.tgd2.img.src;
				break;
			default:
				tgImg.src = images.imgBlank.img.src;
		}
		
		tgDens = idx;
		return this;
	}

	//=============================================
	// Called when the target density list is selected.
	CraterImpact.prototype.selectPjDensity = function(pjList){
		var idx = pjList.selectedIndex;
		var pjImg = document.getElementById("ProjectileImage");
 
		switch(idx){
			case 1:
				pjImg.src = images.pjd1.img.src;
				break;
			case 2:
				pjImg.src = images.pjd2.img.src;
				break;
			case 3:
				pjImg.src = images.pjd3.img.src;
				break;
			case 4:
				pjImg.src = images.pjd4.img.src;
				break;
			default:
				pjImg.src = images.imgBlank.img.src;
		}
		
		pjDens = idx;
		return this;
	}
	 	 
	//=============================================
	// Called when the target density list is selected.
	CraterImpact.prototype.selectPjDensity2 = function(x){
		var idx = x;
		
	    var pjImg = document.getElementById("ProjectileImage");
		 
		switch(idx){
			case 1:
				pjImg.src = images.pjd1.img.src;
				break;
			case 2:
				pjImg.src = images.pjd2.img.src;
				break;
			case 3:
				pjImg.src = images.pjd3.img.src;
				break;
			case 4:
				pjImg.src = images.pjd4.img.src;
				break;
			default:
				pjImg.src = images.imgBlank.img.src;
		}//end switch
		
		pjDens = idx;
		return this;
	}
	 
	//=============================================
	// Whe the water slider has been moved.
	CraterImpact.prototype.updateWater = function(e){
		if(!e) e = E('#WaterDepth').attr('value');
		waterLevel = parseFloat(e);
		var level = waterLevel/20;

		var c = document.getElementById("WaterVis");
		var ctx = c.getContext("2d");
		
		var val = (level)-13;
		
		ctx.drawImage(images.mntn.img, 0,0);
				
		var clp = 278-level;
		
		ctx.drawImage(images.refl.img, 0, level, 343, clp, 0, clp-155, 343, clp);
		
		ctx.font = '600 12pt Arial';
		
		ctx.fillText(waterLevel+"m", 280, 24);
		
		return this;
	 }
	 
	//=============================================
	// Validate the entry
	CraterImpact.prototype.validateAndSumbit = function(){
		var passed = true;
		var msg = "";
	
		if(diameterVal <= 0){
			msg += "<li>" + input_error_diam + "</li>";
			passed = false;
		}
		
		if(tragAngleVal <= 0){
			msg += "<li>" + input_error_angle + "</li>";
			passed = false;
		}
		
		if(projVelVal <= 0){
			msg +="<li>" + input_error_vel + "</li>";
			passed = false;
		}
		
		if(pjDens <= 0){
			msg+= "<li>" + input_error_pjd + "</li>";
			passed = false;
		}
		
		if(tgDens <= 0){
			msg += "<li>" + input_error_tgd + "</li>";
			passed = false;
		}
		
		if(tgDens == 1 && waterLevel <= 0){
			passed = false;
			msg +="<li>" + input_error_water + "</li>";
		}
		
		
		if(passed == false){
			console.log("More Details Required","More Details Required/n/nTest");
		/*
			$( "#dialog-modal" ).dialog({
				  height: 220,
				  modal: true	  
			});
			*/
		
			E('#dialog_text').html("<ul>" + msg + "</ul>");
			E('#validation').css({'display':'block'});
			E("#validation .title").html(input_error_title); 
			this.resize();
		}else{
			window.location = "results.html?lang=" + lang +"&dist=" +"&planet=" + planet +"&dist=" + distVal +"&diam=" + diameterVal + "&trag=" + tragAngleVal + "&velo=" + projVelVal + "&pjd=" + pjDens + "&tgd=" + tgDens + "&wlvl=" + waterLevel;
		}
	}
	
	//============================================
	// Display the help window.
	CraterImpact.prototype.help = function(){
		E("#help .title").html(help_title); 
		E('#dialog_text2').html(help_text + "<br/><br/>" + help_text2);
		E('#help').css({'display':'block'});
		this.resize();
		return this;
	}
	
	//==============================================
	// Resets all the input fields and globals.
	CraterImpact.prototype.resetValues = function(){
		this.log('resetValues')
		distVal = 0;
		diameterVal = 0;
		tragAngleVal = 90;
		projVelVal = 0;
		pjDens = 0;
		tgDens = 0;
		waterLevel = 0;
		
		this.selectTgDensity(E("#cpPjDens").e[0]);
		this.selectPjDensity(E("#cpTgDens").e[0]);

		E('#TargetFeature').css({'display':"block"});
		E('#WaterFeature').css({'display':"none"});
		
		this.updateControls();

		return this;
	}

	//============================================
	// Can be called at any time to initialise the controls
	// to that specified in the URL params.
	CraterImpact.prototype.initialiseInput = function(){

		this.log('initialiseInput')
		lang = this.query.lang;
		if(lang == "") lang = "en";
		
		planet = this.query.planet;
		if (planet == "") planet = "Earth";
		
		var param = this.query.dist;
		distVal = (param) ? parseInt(param) : 0;
		
		param = this.query.diam;
		diameterVal = (param) ? parseInt(param) : 0;
		
		param = this.query.trag;
		tragAngleVal = (param) ? parseInt(param) : 90;
		
		param = this.query.velo;
		projVelVal = (param) ? parseInt(param) : 0;
		
		param = this.query.pjd;
		pjDens = (param) ? parseInt(param) : 0;
		
	    param = this.query.tgd;
		tgDens = (param) ? parseInt(param) : 0;
		
		param = this.query.wlvl;
		waterLevel = (param) ? parseInt(param) : 0;

		this.updateControls();
		return this;
	}

	//============================================
	// Set all the control values
	CraterImpact.prototype.updateControls = function(){
	
		this.log('updateControls');

		E("#ImpactDistance").attr("value", distVal).trigger('change');
		E("#ProjectileSize").attr("value", diameterVal).trigger('change');
		E("#ProjectileAngle").attr("value", tragAngleVal).trigger('change');
		E("#ProjectileVelocity").attr("value", projVelVal).trigger('change');
		E("#WaterDepth").attr("value", waterLevel).trigger('change');
		E("#cpPjDens").attr('value', pjDens).trigger('change'); 
		E("#cpTgDens").attr('value', tgDens).trigger('change');

		if(pjDens) E('#cpPjDens option:eq('+(pjDens+1)+')').attr('selected','selected');
		if(pjDens) E('#cpTgDens option:eq('+(tgDens+1)+')').attr('selected','selected');
		this.selectTgDensity2(parseInt(tgDens));
		this.selectPjDensity2(parseInt(pjDens));
		
		return this;
	}

	//============================================
	// Parse the XML for this page
	CraterImpact.prototype.updateLanguage = function(){

		this.log('updateLanguage');

		E('#AppTitle a').html(this.str('lblTitle'));

		var x = this.str('inputs');
		E("#Title").html(this.str('inputs'));

		x = this.str('lblValue');
		E("#Slider1_Text").html(x);
		E("#Slider2_Text").html(x);
		E("#Slider3_Text").html(x);
		E("#Slider4_Text").html(x);

		E("#Slider5_Text").html(this.str('lblDistance'));
		E("#titleProjectile").html(this.str('lblAstDiam'));
		E("#titleAngle").html(this.str('lbPjAng'));
		E("#titleVelocity").html(this.str('lbPjVel'));
		E("#titlePJDensity").html(this.str('lbPjDens'));
		E("#titleTGDensity").html(this.str('lbTgDens'));
		E("#BT_Reset").html(this.str('btReset'));
		E("#BT_Submit").html(this.str('btSubmit'));


		x = this.str('lblSelect');
		E("#pjd_op0").html(x);
		E("#tgd_op0").html(x);

		E("#pjd_op1").html(this.str('lblIce'));
		E("#pjd_op2").html(this.str('lblPorRock'));
		E("#pjd_op3").html(this.str('lblDensRock'));
		E("#pjd_op4").html(this.str('lblIron'));

		E("#tgd_op1").html(this.str('lblWater'));
		E("#tgd_op2").html(this.str('lblSedRock'));
		E("#tgd_op3").html(this.str('lblIgRock'));

		help_title = this.str('help_title');
		help_text = this.str('help_text');
		help_text2=  this.str('help_text2');

		input_error_title = this.str('input_error_title');
		input_error_diam = this.str('input_error_diam');
		input_error_angle = this.str('input_error_angle');
		input_error_vel = this.str('input_error_vel');
		input_error_pjd = this.str('input_error_pjd');
		input_error_tgd = this.str('input_error_tgd');
		input_error_water = this.str('input_error_water');
		
		return this;
	}

	//============================================
	// To pre select values in a comobo box.
	// @param s The combo box to select.
	// @param i The index to select;
	function setSelectedIndex(s, i){
		s.options[i-1].selected = true;
		return;
	}
	
})(E);	// Self-closing function