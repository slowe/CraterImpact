//###########################################################################
/**
 * Provides a link between the underlying calculation and the front end UI
 * features. All communication with the back end is done though this class.
 * It is also the class to go though when getting the results of an impact.
 * 
 * In this class are a collection of getter and setter methods which should 
 * erface with the UI. 
 * 
 */
//###########################################################################

function DataProvider(){
	
	this.selected_language;
	
	this.latitude;
	this.longitude;
	
	//Input fields//
	this.cbPjDens;/**Projectile Density selected index (combo box in ui)**/
	this.cbTgDens;/**Target Density selected index (combo box in ui)**/
	this.slTgDepth;/**Selected depth when water is the target (slider in ui)**/
	this.cbSelectDepthObject;/**Not actually crater depth but selected landmark on Crater depth screen (a como box)**/
	
	this.cbLocation;/**The selected location if a default location is selected**/
	
	this.projDiam;/**Projectile Diamiter**/
	this.projAngle;/**Projectile Angle**/
	this.projVel;/**Projectile velolcity**/
	this.impactDist;/**Distance from Impact**/
	
	//Output Fields//
	this.txtDamage;/**Description of damage caused by seismic activity**/
	this.txtImpactor;/**Description of the impact**/
	
	//Outputs for Results Tables in key value pairs//
	this.dgInputs;/**The values input HMAP**/
	this.dgOutputs;/**The core of the calculated results HMAP**/
	this.dgEnergy;/**Energy created by impact HMAP**/
	this.dgFirevall;/**Fire ball results HMAP**/
	
	this.impactor;/**The populated impact data model**/

	// Set the value for a key
	this.set = function(key,value){ this[key] = value; }
	// Get the value for a key
	this.get = function(key,value){ return this[key]; }

	return this;
}//###########################################################################
