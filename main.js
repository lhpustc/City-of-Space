//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)
//
// Chapter 5: ColoredTriangle.js (c) 2012 matsuda  AND
// Chapter 4: RotatingTriangle_withButtons.js (c) 2012 matsuda
// became:
//
// BasicShapes.js  MODIFIED for EECS 351-1,
//									Northwestern Univ. Jack Tumblin
//		--converted from 2D to 4D (x,y,z,w) vertices
//		--extend to other attributes: color, surface normal, etc.
//		--demonstrate how to keep & use MULTIPLE colored shapes in just one
//			Vertex Buffer Object(VBO).
//		--create several canonical 3D shapes borrowed from 'GLUT' library:
//		--Demonstrate how to make a 'stepped spiral' tri-strip,  and use it
//			to build a cylinder, sphere, and torus.
//
// Vertex shader program----------------------------------
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'attribute vec4 a_Normal;\n' +

  //--------------- GLSL Struct Definitions:
  'struct LampT {\n' +		// Describes one point-like Phong light source
  '		vec3 pos;\n' +			// (x,y,z,w); w==1.0 for local light at x,y,z position
                          //		   w==0.0 for distant light from x,y,z direction
  ' 	vec3 ambi;\n' +			// Ia ==  ambient light source strength (r,g,b)
  ' 	vec3 diff;\n' +			// Id ==  diffuse light source strength (r,g,b)
  '		vec3 spec;\n' +			// Is == specular light source strength (r,g,b)

  '   float ambi_on;\n' +
  '   float diff_on;\n' +
  '   float spec_on;\n' +
  '}; \n' +

  'struct MatlT {\n' +		// Describes one Phong material by its reflectances:
  '		vec3 emit;\n' +			// Ke: emissive -- surface 'glow' amount (r,g,b);
  '		vec3 ambi;\n' +			// Ka: ambient reflectance (r,g,b)
  '		vec3 diff;\n' +			// Kd: diffuse reflectance (r,g,b)
  '		vec3 spec;\n' + 		// Ks: specular reflectance (r,g,b)
  '		float shiny;\n' +			// Kshiny: specular exponent (integer >= 1; typ. <200)
  '		};\n' +

  'uniform LampT u_LampSet[2];\n' +		// Array of all light sources.
  'uniform MatlT u_MatlSet[1];\n' +		// Array of all materials.
  'uniform vec3 u_eyePosWorld; \n' + 	// Camera/eye location in world coords.


  'varying vec4 v_Position;\n' +
  'varying vec3 v_Normal;\n' +

  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ProjMatrix;\n' +
  'uniform mat4 u_NormalMatrix;\n' +

  'uniform int u_Mode;\n' +
  'varying vec4 v_Color;\n' +

  // 'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * (a_Position + 0.0 * a_Normal);\n' +
  '  v_Position = u_ModelMatrix * a_Position; \n' +
  '  gl_PointSize = 10.0;\n' +
  '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +

  '  vec3 normal = normalize(v_Normal);\n' +
  '  vec3 lightDirection_0 = normalize(v_Position.xyz - u_LampSet[0].pos);\n' +
  '  vec3 lightDirection_1 = normalize(v_Position.xyz - u_LampSet[1].pos);\n' +
  '  vec3 eyeDirection = normalize(u_eyePosWorld - v_Position.xyz);\n' +
  '  vec3 Reflectance_0 = reflect(lightDirection_0, normal);\n' +
  '  vec3 Reflectance_1 = reflect(lightDirection_1, normal);\n' +
  '  vec3 H_0 = normalize(eyeDirection - lightDirection_0);\n' +
  '  vec3 H_1 = normalize(eyeDirection - lightDirection_1);\n' +

  '  float ndotL_0 = max(dot(-lightDirection_0, normal), 0.0);\n' +
  '  float ndotL_1 = max(dot(-lightDirection_1, normal), 0.0);\n' +

  '  float edotR_0 = max(dot(Reflectance_0, eyeDirection), 0.0);\n' +
  '  float edotR_1 = max(dot(Reflectance_1, eyeDirection), 0.0);\n' +
  '  float ndotH_0 = max(dot(H_0, normal), 0.0);\n' +
  '  float ndotH_1 = max(dot(H_1, normal), 0.0);\n' +

  '  vec3 emissive = u_MatlSet[0].emit;\n' +
  '  vec3 ambient = u_MatlSet[0].ambi * (u_LampSet[0].ambi * u_LampSet[0].ambi_on + u_LampSet[1].ambi *  u_LampSet[1].ambi_on);\n' +
  '  vec3 diffuse = u_MatlSet[0].diff * (u_LampSet[0].diff * ndotL_0 *  u_LampSet[0].diff_on + u_LampSet[1].diff * ndotL_1 * u_LampSet[1].diff_on);\n' +
  // '  vec3 specular = u_MatlSet[0].spec * u_LampSet[0].spec * pow(edotR_0, u_MatlSet[0].shiny);\n' +
  // '  vec3 specular = u_MatlSet[0].spec * 0.0;\n' +
  '  vec3 specular = u_MatlSet[0].spec * (u_LampSet[0].spec * pow(edotR_0, u_MatlSet[0].shiny) * u_LampSet[0].spec_on + u_LampSet[1].spec * pow(edotR_1, u_MatlSet[0].shiny) * u_LampSet[1].spec_on);\n' +
  '  if (u_Mode == 4) specular = u_MatlSet[0].spec * (u_LampSet[0].spec * pow(ndotH_0, u_MatlSet[0].shiny) * u_LampSet[0].spec_on + u_LampSet[1].spec * pow(ndotH_1, u_MatlSet[0].shiny) * u_LampSet[1].spec_on);\n' +
  '  v_Color = vec4(emissive + ambient + diffuse + specular, 1.0);\n' +


  '}\n';

// Fragment shader program----------------------------------
var FSHADER_SOURCE =

//  '#ifdef GL_ES\n' +
  // 'precision mediump float;\n' +
//  '#endif GL_ES\n' +
'precision highp float;\n' +
'precision highp int;\n' +


  //--------------- GLSL Struct Definitions:
  'struct LampT {\n' +		// Describes one point-like Phong light source
  '		vec3 pos;\n' +			// (x,y,z,w); w==1.0 for local light at x,y,z position
                          //		   w==0.0 for distant light from x,y,z direction
  ' 	vec3 ambi;\n' +			// Ia ==  ambient light source strength (r,g,b)
  ' 	vec3 diff;\n' +			// Id ==  diffuse light source strength (r,g,b)
  '		vec3 spec;\n' +			// Is == specular light source strength (r,g,b)

  '   float ambi_on;\n' +
  '   float diff_on;\n' +
  '   float spec_on;\n' +
  '}; \n' +
  //
  'struct MatlT {\n' +		// Describes one Phong material by its reflectances:
  '		vec3 emit;\n' +			// Ke: emissive -- surface 'glow' amount (r,g,b);
  '		vec3 ambi;\n' +			// Ka: ambient reflectance (r,g,b)
  '		vec3 diff;\n' +			// Kd: diffuse reflectance (r,g,b)
  '		vec3 spec;\n' + 		// Ks: specular reflectance (r,g,b)
  '		float shiny;\n' +			// Kshiny: specular exponent (integer >= 1; typ. <200)
  '		};\n' +

  'uniform LampT u_LampSet[2];\n' +		// Array of all light sources.
  'uniform MatlT u_MatlSet[1];\n' +		// Array of all materials.
  'uniform vec3 u_eyePosWorld; \n' + 	// Camera/eye location in world coords.

  'varying vec4 v_Position;\n' +
  'varying vec3 v_Normal;\n' +

  'uniform int u_Mode;\n' +
  'varying vec4 v_Color;\n' +

  'void main() {\n' +
  '  vec3 normal = normalize(v_Normal);\n' +
  '  vec3 lightDirection_0 = normalize(v_Position.xyz - u_LampSet[0].pos);\n' +
  '  vec3 lightDirection_1 = normalize(v_Position.xyz - u_LampSet[1].pos);\n' +
  '  vec3 eyeDirection = normalize(u_eyePosWorld - v_Position.xyz);\n' +
  '  vec3 Reflectance_0 = reflect(lightDirection_0, normal);\n' +
  '  vec3 Reflectance_1 = reflect(lightDirection_1, normal);\n' +
  '  vec3 H_0 = normalize(eyeDirection - lightDirection_0);\n' +
  '  vec3 H_1 = normalize(eyeDirection - lightDirection_1);\n' +

  '  float ndotL_0 = max(dot(-lightDirection_0, normal), 0.0);\n' +
  '  float ndotL_1 = max(dot(-lightDirection_1, normal), 0.0);\n' +

  '  float edotR_0 = max(dot(Reflectance_0, eyeDirection), 0.0);\n' +
  '  float edotR_1 = max(dot(Reflectance_1, eyeDirection), 0.0);\n' +
  '  float ndotH_0 = max(dot(H_0, normal), 0.0);\n' +
  '  float ndotH_1 = max(dot(H_1, normal), 0.0);\n' +

  '  vec3 emissive = u_MatlSet[0].emit;\n' +
  '  vec3 ambient = u_MatlSet[0].ambi * (u_LampSet[0].ambi * u_LampSet[0].ambi_on + u_LampSet[1].ambi *  u_LampSet[1].ambi_on);\n' +
  '  vec3 diffuse = u_MatlSet[0].diff * (u_LampSet[0].diff * ndotL_0 *  u_LampSet[0].diff_on + u_LampSet[1].diff * ndotL_1 * u_LampSet[1].diff_on);\n' +
  // '  vec3 specular = u_MatlSet[0].spec * u_LampSet[0].spec * pow(edotR_0, u_MatlSet[0].shiny);\n' +
  // '  vec3 specular = u_MatlSet[0].spec * 0.0;\n' +
  '  vec3 specular = u_MatlSet[0].spec * (u_LampSet[0].spec * pow(edotR_0, u_MatlSet[0].shiny) * u_LampSet[0].spec_on + u_LampSet[1].spec * pow(edotR_1, u_MatlSet[0].shiny) * u_LampSet[1].spec_on);\n' +
  '  if (u_Mode == 2) specular = u_MatlSet[0].spec * (u_LampSet[0].spec * pow(ndotH_0, u_MatlSet[0].shiny) * u_LampSet[0].spec_on + u_LampSet[1].spec * pow(ndotH_1, u_MatlSet[0].shiny) * u_LampSet[1].spec_on);\n' +
  '  gl_FragColor = vec4(emissive + ambient + diffuse + specular, 1.0);\n' +
  '  if (u_Mode > 2) gl_FragColor = v_Color;\n' +

  // '  gl_FragColor = v_Color;\n' +
  '}\n';


var mode = 1;
// Global Variables
var ANGLE_STEP = 45.0;		// Rotation angle rate (degrees/second)
var ang_step=45.0;

var g_EyeX = 0.0;
var g_EyeY = -5.0;
var g_EyeZ = 0.3;

var g_LookAtX = 0.0;
var g_LookAtY = 0.0;
var g_LookAtZ = 0.0;

var light_X = 1.0;
var light_Y = 0.0;
var light_Z = 1.2;
var ambi_r = 0.4;
var ambi_g = 0.4;
var ambi_b = 0.4;
var diff_r = 1.0;
var diff_g = 1.0;
var diff_b = 1.0;
var spec_r = 1.0;
var spec_g = 1.0;
var spec_b = 1.0;


var l0_ambi_on = 1.0;
var l0_diff_on = 1.0;
var l0_spec_on = 1.0;

var l1_ambi_on = 1.0;
var l1_diff_on = 1.0;
var l1_spec_on = 1.0;


var lamp0 = new LightsT();
var lamp1 = new LightsT();
var matl0 = new Material(0);
var u_eyePosWorld = false;
var eyePosWorld = new Float32Array(3);

var floatsPerVertex = 25;	// # of Float32Array elements used for each vertex
var rtAngle = 0.0;
var swAngle = 0.0;

var canvas;
function main() {
//==============================================================================
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight-100;

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  //
  var n = initVertexBuffer(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

	// NEW!! Enable 3D depth-test when drawing: don't over-draw at any pixel
	// unless the new Z value is closer to the eye than the old one..
//	gl.depthFunc(gl.LESS);			 // WebGL default setting: (default)
	gl.enable(gl.DEPTH_TEST);

  // var u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');
  // var lightDirection = new Vector3([0.0, 1.0, 0.0]);
  // lightDirection.normalize();
  // gl.uniform3fv(u_LightDirection, lightDirection.elements);


  // Get handle to graphics system's storage location of u_ModelMatrix
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }
  // Create a local version of our model matrix in JavaScript
  var modelMatrix = new Matrix4();

  // Get handle to graphics system's storage location of u_ModelMatrix
  var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
    return;
  }
  // Create a local version of our model matrix in JavaScript
  var viewMatrix = new Matrix4();

  // Get handle to graphics system's storage location of u_ModelMatrix
  var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  if (!u_ProjMatrix) {
    console.log('Failed to get the storage location of u_ProjMatrix');
    return;
  }
  // Create a local version of our model matrix in JavaScript
  var projMatrix = new Matrix4();


  // Get handle to graphics system's storage location of u_ModelMatrix
  var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  if (!u_NormalMatrix) {
    console.log('Failed to get the storage location of u_NormalMatrix');
    return;
  }
  // Create a local version of our model matrix in JavaScript
  var normalMatrix = new Matrix4();

  // Set storage location for light_shading mode
  u_Mode = gl.getUniformLocation(gl.program, 'u_Mode');
  if (!u_Mode) {
    console.log('Failed to get storage location for light_shading mode');
    return;
  }
  // Set storage location for lamp0
  lamp0.u_pos  = gl.getUniformLocation(gl.program, 'u_LampSet[0].pos');
  lamp0.u_ambi = gl.getUniformLocation(gl.program, 'u_LampSet[0].ambi');
  lamp0.u_diff = gl.getUniformLocation(gl.program, 'u_LampSet[0].diff');
  lamp0.u_spec = gl.getUniformLocation(gl.program, 'u_LampSet[0].spec');

  u0_ambi_on = gl.getUniformLocation(gl.program, 'u_LampSet[0].ambi_on');
  u0_diff_on = gl.getUniformLocation(gl.program, 'u_LampSet[0].diff_on');
  u0_spec_on = gl.getUniformLocation(gl.program, 'u_LampSet[0].spec_on');

  if (!lamp0.u_pos || !lamp0.u_ambi || !lamp0.u_diff || !lamp0.u_spec) {
    console.log('Failed to get the storage location for Lamp0');
    return;
  }

  // Set storage location for lamp0
  lamp1.u_pos  = gl.getUniformLocation(gl.program, 'u_LampSet[1].pos');
  lamp1.u_ambi = gl.getUniformLocation(gl.program, 'u_LampSet[1].ambi');
  lamp1.u_diff = gl.getUniformLocation(gl.program, 'u_LampSet[1].diff');
  lamp1.u_spec = gl.getUniformLocation(gl.program, 'u_LampSet[1].spec');

  u1_ambi_on = gl.getUniformLocation(gl.program, 'u_LampSet[1].ambi_on');
  u1_diff_on = gl.getUniformLocation(gl.program, 'u_LampSet[1].diff_on');
  u1_spec_on = gl.getUniformLocation(gl.program, 'u_LampSet[1].spec_on');

  if (!lamp1.u_pos || !lamp1.u_ambi || !lamp1.u_diff || !lamp1.u_spec) {
    console.log('Failed to get the storage location for Lamp1');
    return;
  }


  // Set storage location for material
  matl0.uLoc_Ke = gl.getUniformLocation(gl.program, 'u_MatlSet[0].emit');
	matl0.uLoc_Ka = gl.getUniformLocation(gl.program, 'u_MatlSet[0].ambi');
	matl0.uLoc_Kd = gl.getUniformLocation(gl.program, 'u_MatlSet[0].diff');
	matl0.uLoc_Ks = gl.getUniformLocation(gl.program, 'u_MatlSet[0].spec');
	matl0.uLoc_Kshiny = gl.getUniformLocation(gl.program, 'u_MatlSet[0].shiny');
	if(!matl0.uLoc_Ke || !matl0.uLoc_Ka || !matl0.uLoc_Kd
			  	  		    || !matl0.uLoc_Ks || !matl0.uLoc_Kshiny
		 ) {
		console.log('Failed to get GPUs Reflectance storage locations');
		return;
	}

  // Set storage location for eyePosWorld
  u_eyePosWorld = gl.getUniformLocation(gl.program, 'u_eyePosWorld');
  if (!u_eyePosWorld) {
    console.log('Failed to get the storage location for eyePosWorld');
    return;
  }

//-----------------

  // Start drawing: create 'tick' variable whose value is this function:
  var tick = function() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight-100;

    animateRotate();
    animateSwing();
    // console.log("rotateAngle = ", rtAngle, "swingAngle = ", swAngle);
    // currentAngle = animate(currentAngle);  // Update the rotation angle
    draw(gl, modelMatrix, u_ModelMatrix, viewMatrix, u_ViewMatrix, projMatrix, u_ProjMatrix, normalMatrix, u_NormalMatrix);   // Draw shapes
    // report current angle on console
    //console.log('currentAngle=',currentAngle);
    requestAnimationFrame(tick, canvas);
    									// Request that the browser re-draw the webpage
  };
  tick();							// start (and continue) animation: draw current image

}

// Cited from StarterCode BasicShapes.js
function makeCylinder() {
//==============================================================================
// Make a cylinder shape from one TRIANGLE_STRIP drawing primitive, using the
// 'stepped spiral' design described in notes.
// Cylinder center at origin, encircles z axis, radius 1, top/bottom at z= +/-1.
//
 var ctrColr = new Float32Array([0.2, 0.2, 0.2]);	// dark gray
 var topColr = new Float32Array([0.4, 0.7, 0.4]);	// light green
 var botColr = new Float32Array([0.5, 0.5, 1.0]);	// light blue
 var capVerts = 16;	// # of vertices around the topmost 'cap' of the shape
 var botRadius = 1.0;		// radius of bottom of cylinder (top always 1.0)

 // Create a (global) array to hold this cylinder's vertices;
 cylVerts = new Float32Array(  ((capVerts*6) -2) * floatsPerVertex);
										// # of vertices * # of elements needed to store them.
 theta = Math.atan((botRadius-1)/2);
	// Create circle-shaped top cap of cylinder at z=+1.0, radius 1.0
	// v counts vertices: j counts array elements (vertices * elements per vertex)
	for(v=1,j=0; v<2*capVerts; v++,j+=floatsPerVertex) {
		// skip the first vertex--not needed.
		if(v%2==0)
		{				// put even# vertices at center of cylinder's top cap:
			cylVerts[j  ] = 0.0; 			// x,y,z,w == 0,0,1,1
			cylVerts[j+1] = 0.0;
			cylVerts[j+2] = 1.0;
			cylVerts[j+3] = 1.0;			// r,g,b = topColr[]
			cylVerts[j+4]=ctrColr[0];
			cylVerts[j+5]=ctrColr[1];
			cylVerts[j+6]=ctrColr[2];
		}
		else { 	// put odd# vertices around the top cap's outer edge;
						// x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
						// 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
			cylVerts[j  ] = Math.cos(Math.PI*(v-1)/capVerts);			// x
			cylVerts[j+1] = Math.sin(Math.PI*(v-1)/capVerts);			// y
			//	(Why not 2*PI? because 0 < =v < 2*capVerts, so we
			//	 can simplify cos(2*PI * (v-1)/(2*capVerts))
			cylVerts[j+2] = 1.0;	// z
			cylVerts[j+3] = 1.0;	// w.
			// r,g,b = topColr[]
			cylVerts[j+4]=topColr[0];
			cylVerts[j+5]=topColr[1];
			cylVerts[j+6]=topColr[2];
		}
    cylVerts[j+8] = 0.0; 			// x,y,z,w == 0,0,1,1
    cylVerts[j+9] = 0.0;
    cylVerts[j+10] = 1.0;

	}
	// Create the cylinder side walls, made of 2*capVerts vertices.
	// v counts vertices within the wall; j continues to count array elements
	for(v=0; v< 2*capVerts; v++, j+=floatsPerVertex) {
		if(v%2==0)	// position all even# vertices along top cap:
		{
				cylVerts[j  ] = Math.cos(Math.PI*(v)/capVerts);		// x
				cylVerts[j+1] = Math.sin(Math.PI*(v)/capVerts);		// y
				cylVerts[j+2] = 1.0;	// z
				cylVerts[j+3] = 1.0;	// w.
				// r,g,b = topColr[]
				cylVerts[j+4]=topColr[0];
				cylVerts[j+5]=topColr[1];
				cylVerts[j+6]=topColr[2];

        cylVerts[j+8] = Math.cos(theta) * Math.cos(Math.PI*(v)/capVerts);		// x
        cylVerts[j+9] = Math.cos(theta) * Math.sin(Math.PI*(v)/capVerts);		// y
        cylVerts[j+10] = Math.sin(theta);	// z

		}
		else		// position all odd# vertices along the bottom cap:
		{
				cylVerts[j  ] = botRadius * Math.cos(Math.PI*(v-1)/capVerts);		// x
				cylVerts[j+1] = botRadius * Math.sin(Math.PI*(v-1)/capVerts);		// y
				cylVerts[j+2] =-1.0;	// z
				cylVerts[j+3] = 1.0;	// w.
				// r,g,b = topColr[]
				cylVerts[j+4]=botColr[0];
				cylVerts[j+5]=botColr[1];
				cylVerts[j+6]=botColr[2];

        cylVerts[j+8] = Math.cos(theta) * Math.cos(Math.PI*(v-1)/capVerts);		// x
        cylVerts[j+9] = Math.cos(theta) * Math.sin(Math.PI*(v-1)/capVerts);		// y
        cylVerts[j+10] = Math.sin(theta);	// z

		}
	}
	// Create the cylinder bottom cap, made of 2*capVerts -1 vertices.
	// v counts the vertices in the cap; j continues to count array elements
	for(v=0; v < (2*capVerts -1); v++, j+= floatsPerVertex) {
		if(v%2==0) {	// position even #'d vertices around bot cap's outer edge
			cylVerts[j  ] = botRadius * Math.cos(Math.PI*(v)/capVerts);		// x
			cylVerts[j+1] = botRadius * Math.sin(Math.PI*(v)/capVerts);		// y
			cylVerts[j+2] =-1.0;	// z
			cylVerts[j+3] = 1.0;	// w.
			// r,g,b = topColr[]
			cylVerts[j+4]=botColr[0];
			cylVerts[j+5]=botColr[1];
			cylVerts[j+6]=botColr[2];
		}
		else {				// position odd#'d vertices at center of the bottom cap:
			cylVerts[j  ] = 0.0; 			// x,y,z,w == 0,0,-1,1
			cylVerts[j+1] = 0.0;
			cylVerts[j+2] =-1.0;
			cylVerts[j+3] = 1.0;			// r,g,b = botColr[]
			cylVerts[j+4]=botColr[0];
			cylVerts[j+5]=botColr[1];
			cylVerts[j+6]=botColr[2];
		}
    cylVerts[j+8] = 0.0; 			// x,y,z,w == 0,0,-1,1
    cylVerts[j+9] = 0.0;
    cylVerts[j+10] =-1.0;

	}
}

// Cited from StarterCode BasicShapes.js
function makeSphere() {
//==============================================================================
// Make a sphere from one OpenGL TRIANGLE_STRIP primitive.   Make ring-like
// equal-lattitude 'slices' of the sphere (bounded by planes of constant z),
// and connect them as a 'stepped spiral' design (see makeCylinder) to build the
// sphere from one triangle strip.
  var slices = 13;		// # of slices of the sphere along the z axis. >=3 req'd
											// (choose odd # or prime# to avoid accidental symmetry)
  var sliceVerts	= 27;	// # of vertices around the top edge of the slice
											// (same number of vertices on bottom of slice, too)
  var topColr = new Float32Array([0.7, 0.7, 0.7]);	// North Pole: light gray
  var equColr = new Float32Array([0.3, 0.7, 0.3]);	// Equator:    bright green
  var botColr = new Float32Array([0.9, 0.9, 0.9]);	// South Pole: brightest gray.
  var sliceAngle = Math.PI/slices;	// lattitude angle spanned by one slice.

	// Create a (global) array to hold this sphere's vertices:
  sphVerts = new Float32Array(  ((slices * 2* sliceVerts) -2) * floatsPerVertex);
										// # of vertices * # of elements needed to store them.
										// each slice requires 2*sliceVerts vertices except 1st and
										// last ones, which require only 2*sliceVerts-1.

	// Create dome-shaped top slice of sphere at z=+1
	// s counts slices; v counts vertices;
	// j counts array elements (vertices * elements per vertex)
	var cos0 = 0.0;					// sines,cosines of slice's top, bottom edge.
	var sin0 = 0.0;
	var cos1 = 0.0;
	var sin1 = 0.0;
	var j = 0;							// initialize our array index
	var isLast = 0;
	var isFirst = 1;
	for(s=0; s<slices; s++) {	// for each slice of the sphere,
		// find sines & cosines for top and bottom of this slice
		if(s==0) {
			isFirst = 1;	// skip 1st vertex of 1st slice.
			cos0 = 1.0; 	// initialize: start at north pole.
			sin0 = 0.0;
		}
		else {					// otherwise, new top edge == old bottom edge
			isFirst = 0;
			cos0 = cos1;
			sin0 = sin1;
		}								// & compute sine,cosine for new bottom edge.
		cos1 = Math.cos((s+1)*sliceAngle);
		sin1 = Math.sin((s+1)*sliceAngle);
		// go around the entire slice, generating TRIANGLE_STRIP verts
		// (Note we don't initialize j; grows with each new attrib,vertex, and slice)
		if(s==slices-1) isLast=1;	// skip last vertex of last slice.
		for(v=isFirst; v< 2*sliceVerts-isLast; v++, j+=floatsPerVertex) {
			if(v%2==0)
			{				// put even# vertices at the the slice's top edge
							// (why PI and not 2*PI? because 0 <= v < 2*sliceVerts
							// and thus we can simplify cos(2*PI(v/2*sliceVerts))
				sphVerts[j  ] = sin0 * Math.cos(Math.PI*(v)/sliceVerts);
				sphVerts[j+1] = sin0 * Math.sin(Math.PI*(v)/sliceVerts);
				sphVerts[j+2] = cos0;
				sphVerts[j+3] = 1.0;

        sphVerts[j+8] = sphVerts[j];
        sphVerts[j+9] = sphVerts[j+1];
        sphVerts[j+10] = sphVerts[j+2];
			}
			else { 	// put odd# vertices around the slice's lower edge;
							// x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
							// 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
				sphVerts[j  ] = sin1 * Math.cos(Math.PI*(v-1)/sliceVerts);		// x
				sphVerts[j+1] = sin1 * Math.sin(Math.PI*(v-1)/sliceVerts);		// y
				sphVerts[j+2] = cos1;																				// z
				sphVerts[j+3] = 1.0;

        sphVerts[j+8] = sphVerts[j];
        sphVerts[j+9] = sphVerts[j+1];
        sphVerts[j+10] = sphVerts[j+2];																			// w.
			}
			if(s==0) {	// finally, set some interesting colors for vertices:
				sphVerts[j+4]=topColr[0];
				sphVerts[j+5]=topColr[1];
				sphVerts[j+6]=topColr[2];
				}
			else if(s==slices-1) {
				sphVerts[j+4]=botColr[0];
				sphVerts[j+5]=botColr[1];
				sphVerts[j+6]=botColr[2];
			}
			else {
					sphVerts[j+4]=Math.random();// equColr[0];
					sphVerts[j+5]=Math.random();// equColr[1];
					sphVerts[j+6]=Math.random();// equColr[2];
			}
		}
	}
}

// Cited from StarterCode BasicShapes.js
function makeTorus() {
//==============================================================================
// 		Create a torus centered at the origin that circles the z axis.
// Terminology: imagine a torus as a flexible, cylinder-shaped bar or rod bent
// into a circle around the z-axis. The bent bar's centerline forms a circle
// entirely in the z=0 plane, centered at the origin, with radius 'rbend'.  The
// bent-bar circle begins at (rbend,0,0), increases in +y direction to circle
// around the z-axis in counter-clockwise (CCW) direction, consistent with our
// right-handed coordinate system.
// 		This bent bar forms a torus because the bar itself has a circular cross-
// section with radius 'rbar' and angle 'phi'. We measure phi in CCW direction
// around the bar's centerline, circling right-handed along the direction
// forward from the bar's start at theta=0 towards its end at theta=2PI.
// 		THUS theta=0, phi=0 selects the torus surface point (rbend+rbar,0,0);
// a slight increase in phi moves that point in -z direction and a slight
// increase in theta moves that point in the +y direction.
// To construct the torus, begin with the circle at the start of the bar:
//					xc = rbend + rbar*cos(phi);
//					yc = 0;
//					zc = -rbar*sin(phi);			(note negative sin(); right-handed phi)
// and then rotate this circle around the z-axis by angle theta:
//					x = xc*cos(theta) - yc*sin(theta)
//					y = xc*sin(theta) + yc*cos(theta)
//					z = zc
// Simplify: yc==0, so
//					x = (rbend + rbar*cos(phi))*cos(theta)
//					y = (rbend + rbar*cos(phi))*sin(theta)
//					z = -rbar*sin(phi)
// To construct a torus from a single triangle-strip, make a 'stepped spiral' along the length of the bent bar; successive rings of constant-theta, using the same design used for cylinder walls in 'makeCyl()' and for 'slices' in makeSphere().  Unlike the cylinder and sphere, we have no 'special case' for the first and last of these bar-encircling rings.
//
var rbend = 1.0;										// Radius of circle formed by torus' bent bar
var rbar = 0.5;											// radius of the bar we bent to form torus
var barSlices = 23;									// # of bar-segments in the torus: >=3 req'd;
																		// more segments for more-circular torus
var barSides = 13;										// # of sides of the bar (and thus the
																		// number of vertices in its cross-section)
																		// >=3 req'd;
																		// more sides for more-circular cross-section
// for nice-looking torus with approx square facets,
//			--choose odd or prime#  for barSides, and
//			--choose pdd or prime# for barSlices of approx. barSides *(rbend/rbar)
// EXAMPLE: rbend = 1, rbar = 0.5, barSlices =23, barSides = 11.

	// Create a (global) array to hold this torus's vertices:
 torVerts = new Float32Array(floatsPerVertex*(2*barSides*barSlices +2));
//	Each slice requires 2*barSides vertices, but 1st slice will skip its first
// triangle and last slice will skip its last triangle. To 'close' the torus,
// repeat the first 2 vertices at the end of the triangle-strip.  Assume 7

var phi=0, theta=0;										// begin torus at angles 0,0
var thetaStep = 2*Math.PI/barSlices;	// theta angle between each bar segment
var phiHalfStep = Math.PI/barSides;		// half-phi angle between each side of bar
																			// (WHY HALF? 2 vertices per step in phi)
	// s counts slices of the bar; v counts vertices within one slice; j counts
	// array elements (Float32) (vertices*#attribs/vertex) put in torVerts array.
	for(s=0,j=0; s<barSlices; s++) {		// for each 'slice' or 'ring' of the torus:
		for(v=0; v< 2*barSides; v++, j+=floatsPerVertex) {		// for each vertex in this slice:
			if(v%2==0)	{	// even #'d vertices at bottom of slice,
				torVerts[j  ] = (rbend + rbar*Math.cos((v)*phiHalfStep)) *
																						 Math.cos((s)*thetaStep);
							  //	x = (rbend + rbar*cos(phi)) * cos(theta)
				torVerts[j+1] = (rbend + rbar*Math.cos((v)*phiHalfStep)) *
																						 Math.sin((s)*thetaStep);
								//  y = (rbend + rbar*cos(phi)) * sin(theta)
				torVerts[j+2] = -rbar*Math.sin((v)*phiHalfStep);
								//  z = -rbar  *   sin(phi)
				torVerts[j+3] = 1.0;		// w

        torVerts[j+8] = (Math.cos((v)*phiHalfStep)) *
                                             Math.cos((s)*thetaStep);
        torVerts[j+9] = (Math.cos((v)*phiHalfStep)) *
                                             Math.sin((s)*thetaStep);
        torVerts[j+10] = -Math.sin((v)*phiHalfStep);

			}
			else {				// odd #'d vertices at top of slice (s+1);
										// at same phi used at bottom of slice (v-1)
				torVerts[j  ] = (rbend + rbar*Math.cos((v-1)*phiHalfStep)) *
																						 Math.cos((s+1)*thetaStep);
							  //	x = (rbend + rbar*cos(phi)) * cos(theta)
				torVerts[j+1] = (rbend + rbar*Math.cos((v-1)*phiHalfStep)) *
																						 Math.sin((s+1)*thetaStep);
								//  y = (rbend + rbar*cos(phi)) * sin(theta)
				torVerts[j+2] = -rbar*Math.sin((v-1)*phiHalfStep);
								//  z = -rbar  *   sin(phi)
				torVerts[j+3] = 1.0;		// w

        torVerts[j+8] = (Math.cos((v-1)*phiHalfStep)) *
                                             Math.cos((s+1)*thetaStep);
        torVerts[j+9] = (Math.cos((v-1)*phiHalfStep)) *
                                             Math.sin((s+1)*thetaStep);
        torVerts[j+10] = -Math.sin((v-1)*phiHalfStep);

			}
			torVerts[j+4] = Math.random();		// random color 0.0 <= R < 1.0
			torVerts[j+5] = Math.random();		// random color 0.0 <= G < 1.0
			torVerts[j+6] = Math.random();		// random color 0.0 <= B < 1.0
		}
	}
	// Repeat the 1st 2 vertices of the triangle strip to complete the torus:
			torVerts[j  ] = rbend + rbar;	// copy vertex zero;
						  //	x = (rbend + rbar*cos(phi==0)) * cos(theta==0)
			torVerts[j+1] = 0.0;
							//  y = (rbend + rbar*cos(phi==0)) * sin(theta==0)
			torVerts[j+2] = 0.0;
							//  z = -rbar  *   sin(phi==0)
			torVerts[j+3] = 1.0;		// w

      torVerts[j+8] = 1;	// copy vertex zero;
      torVerts[j+9] = 0.0;
      torVerts[j+10] = 0.0;

			torVerts[j+4] = Math.random();		// random color 0.0 <= R < 1.0
			torVerts[j+5] = Math.random();		// random color 0.0 <= G < 1.0
			torVerts[j+6] = Math.random();		// random color 0.0 <= B < 1.0
			j+=floatsPerVertex; // go to next vertex:
			torVerts[j  ] = (rbend + rbar) * Math.cos(thetaStep);
						  //	x = (rbend + rbar*cos(phi==0)) * cos(theta==thetaStep)
			torVerts[j+1] = (rbend + rbar) * Math.sin(thetaStep);
							//  y = (rbend + rbar*cos(phi==0)) * sin(theta==thetaStep)
			torVerts[j+2] = 0.0;
							//  z = -rbar  *   sin(phi==0)
			torVerts[j+3] = 1.0;		// w

      torVerts[j+8] = Math.cos(thetaStep);
              //	x = (rbend + rbar*cos(phi==0)) * cos(theta==thetaStep)
      torVerts[j+9] = Math.sin(thetaStep);
              //  y = (rbend + rbar*cos(phi==0)) * sin(theta==thetaStep)
      torVerts[j+10] = 0.0;

			torVerts[j+4] = Math.random();		// random color 0.0 <= R < 1.0
			torVerts[j+5] = Math.random();		// random color 0.0 <= G < 1.0
			torVerts[j+6] = Math.random();		// random color 0.0 <= B < 1.0
}

function makeGroundGrid() {
//==============================================================================
// Create a list of vertices that create a large grid of lines in the x,y plane
// centered at x=y=z=0.  Draw this shape using the GL_LINES primitive.

	var xcount = 100;			// # of lines to draw in x,y to make the grid.
	var ycount = 100;
	var xymax	= 50.0;			// grid size; extends to cover +/-xymax in x and y.
 	var xColr = new Float32Array([1.0, 1.0, 0.3]);	// bright yellow
 	var yColr = new Float32Array([0.5, 1.0, 0.5]);	// bright green.

	// Create an (global) array to hold this ground-plane's vertices:
	gndVerts = new Float32Array(floatsPerVertex*2*(xcount+ycount));
						// draw a grid made of xcount+ycount lines; 2 vertices per line.

	var xgap = xymax/(xcount-1);		// HALF-spacing between lines in x,y;
	var ygap = xymax/(ycount-1);		// (why half? because v==(0line number/2))

	// First, step thru x values as we make vertical lines of constant-x:
	for(v=0, j=0; v<2*xcount; v++, j+= floatsPerVertex) {
		if(v%2==0) {	// put even-numbered vertices at (xnow, -xymax, 0)
			gndVerts[j  ] = -xymax + (v  )*xgap;	// x
			gndVerts[j+1] = -xymax;								// y
			gndVerts[j+2] = 0.0;									// z
			gndVerts[j+3] = 1.0;									// w.
		}
		else {				// put odd-numbered vertices at (xnow, +xymax, 0).
			gndVerts[j  ] = -xymax + (v-1)*xgap;	// x
			gndVerts[j+1] = xymax;								// y
			gndVerts[j+2] = 0.0;									// z
			gndVerts[j+3] = 1.0;									// w.
		}
		gndVerts[j+4] = xColr[0];			// red
		gndVerts[j+5] = xColr[1];			// grn
		gndVerts[j+6] = xColr[2];			// blu
	}
	// Second, step thru y values as wqe make horizontal lines of constant-y:
	// (don't re-initialize j--we're adding more vertices to the array)
	for(v=0; v<2*ycount; v++, j+= floatsPerVertex) {
		if(v%2==0) {		// put even-numbered vertices at (-xymax, ynow, 0)
			gndVerts[j  ] = -xymax;								// x
			gndVerts[j+1] = -xymax + (v  )*ygap;	// y
			gndVerts[j+2] = 0.0;									// z
			gndVerts[j+3] = 1.0;									// w.
		}
		else {					// put odd-numbered vertices at (+xymax, ynow, 0).
			gndVerts[j  ] = xymax;								// x
			gndVerts[j+1] = -xymax + (v-1)*ygap;	// y
			gndVerts[j+2] = 0.0;									// z
			gndVerts[j+3] = 1.0;									// w.
		}
		gndVerts[j+4] = yColr[0];			// red
		gndVerts[j+5] = yColr[1];			// grn
		gndVerts[j+6] = yColr[2];			// blu
	}
}

function makeRecPyramid() {
  var fr = 0;
  var fg = 1;
  var fb = 0;

  var rr = 27/255;
  var rg = 40/255;
  var rb = 32/255;

  var bcolor = new Float32Array([5/255, 112/255, 30/255]);

  var opaque = 1.0;

  recpyr_floatsPerVertex = 11;
  recPyrVerts = new Float32Array([
    // front face
    0.0,  0.0, 1.0, 1.0,    fr, fg, fb,	opaque,  0, -1, 1,// Y axis line (origin: white)
    1.0, -1.0,  0.0, 1.0,    fr, fg, fb, opaque,	0, -1, 1,// Y axis line (origin: white)
   -1.0, -1.0,  0.0, 1.0,    fr, fg, fb, opaque,	0, -1, 1,// Y axis line (origin: white)

   // left face
   0.0,  0.0, 1.0, 1.0,    rr, rg, rb, opaque,	 -1, 0, 1,// Y axis line (origin: white)
  -1.0, -1.0,  0.0, 1.0,    rr, rg, rb,	opaque, -1, 0, 1,// Y axis line (origin: white)
  -1.0,  1.0,  0.0, 1.0,    rr, rg, rb,	opaque, -1, 0, 1,// Y axis line (origin: white)

  // back face
  0.0,  0.0, 1.0, 1.0,    bcolor[0], bcolor[1],bcolor[2],	opaque,  0, 1, 1,// Y axis line (origin: white)
 -1.0,  1.0,  0.0, 1.0,    bcolor[0], bcolor[1],bcolor[2], opaque,	0, 1, 1,// Y axis line (origin: white)
  1.0,  1.0,  0.0, 1.0,    bcolor[0], bcolor[1],bcolor[2], opaque,	0, 1, 1,// Y axis line (origin: white)

  // right face
  0.0,  0.0, 1.0, 1.0,    rr, rg, rb,	opaque,   1, 0, 1,// Y axis line (origin: white)
  1.0,  1.0,  0.0, 1.0,    rr, rg, rb, opaque,	 1, 0, 1,// Y axis line (origin: white)
  1.0, -1.0,  0.0, 1.0,    rr, rg, rb, opaque,	 1, 0, 1,// Y axis line (origin: white)

  // bottom face1
  1.0,  1.0,  0.0, 1.0,    fr, fg, fb, opaque,	0, 0, -1,// Y axis line (origin: white)
  1.0, -1.0,  0.0, 1.0,    fr, fg, fb, opaque,	0, 0, -1,// Y axis line (origin: white)
 -1.0, -1.0,  0.0, 1.0,    fr, fg, fb, opaque,	0, 0, -1,// Y axis line (origin: white)

  // bottom face2
 -1.0, -1.0,  0.0, 1.0,    fr, fg, fb, opaque,	0, 0, -1,// Y axis line (origin: white)
 -1.0,  1.0,  0.0, 1.0,    fr, fg, fb, opaque,	0, 0, -1,// Y axis line (origin: white)
  1.0,  1.0,  0.0, 1.0,    fr, fg, fb, opaque,	0, 0, -1,// Y axis line (origin: white)
  ]);
}

// data cited from Weihan Chu's github
// https://github.com/dawn-chu/EECS351_Computer-Graphics/blob/master/Weihanchu_ProjC.js
function makeMillWing() {
  mwing_floatsPerVertex = 9;
  mwingVerts = new Float32Array([
    // front face
    //  0.0,  -1.0,  0.0,  1.0,    r,g,b,opaque,     0, -1,  0,
    //  2.0,  -1.0,  0.0,  1.0,    r,g,b,opaque,     0, -1,  0,
    //  0.0,  -1.0,  1.0,  1.0,    r,g,b,opaque,     0, -1,  0,

     0.0,  0.0,  0.0,      0.4, 0.1, 0.9,   0.0, -1.0, 0.0,
     0.0,  0.0,  1.0,      0.4, 0.1, 0.8,   0.0, -1.0, 0.0,
     2.0,  0.0,  1.0,      0.4, 0.1, 0.7,   0.0, -1.0, 0.0,

     0.0,  0.0,  0.0,      0.4, 0.2, 0.9,   0.0, -1.0, 0.0,
     2.0,  0.0,  1.0,      0.4, 0.2, 0.8,   0.0, -1.0, 0.0,
     2.0,  0.0,  0.0,      0.4, 0.2, 0.7,   0.0, -1.0, 0.0, //bottom

     2.0,  0.0,  1.0,      0.5, 0.1, 0.8,   1.0, 1.0,  0.0,
     2.0,  0.0,  0.0,      0.5, 0.1, 0.7,   1.0, 1.0,  0.0,
     1.0,  1.0,  1.0,      0.5, 0.1, 0.6,   1.0, 1.0,  0.0,

     2.0,  0.0,  0.0,      0.5, 0.2, 0.8,   1.0, 1.0,  0.0,
     1.0,  1.0,  1.0,      0.5, 0.2, 0.7,   1.0, 1.0,  0.0,
     1.0,  1.0,  0.0,      0.5, 0.2, 0.6,   1.0, 1.0,  0.0, //right

     1.0, 1.0, 1.0,        0.9, 1.0, 0.9,   0.0, 1.0, 0.0,
     1.0, 1.0, 0.0,        0.9, 1.0, 0.8,   0.0, 1.0, 0.0,
     0.0, 1.0, 1.0,        0.9, 1.0, 0.7,   0.0, 1.0, 0.0,

     1.0, 1.0, 0.0,        0.9, 0.9, 0.9,    0.0, 1.0, 0.0,
     0.0, 1.0, 1.0,        0.9, 0.9, 0.8,    0.0, 1.0, 0.0,
     0.0, 1.0, 0.0,        0.9, 0.9, 0.7,    0.0, 1.0, 0.0, //top

     0.0, 1.0, 1.0,        0.4,0.1,0.9,      -1, 0.0, 0.0,
     0.0, 1.0, 0.0,        0.4,0.1,0.8,      -1, 0.0, 0.0,
     0.0, 0.0, 0.0,        0.4,0.1,0.7,      -1, 0.0, 0.0,

     0.0, 1.0, 1.0,        0.4,0.2,0.9,       -1, 0.0, 0.0,
     0.0, 0.0, 0.0,        0.4,0.2,0.8,       -1, 0.0, 0.0,
     0.0, 0.0, 1.0,        0.4,0.2,0.7,       -1, 0.0, 0.0, //left

     0.0, 1.0, 1.0,        0.5,0.1,0.1,       0.0, 0.0, 1.0,
     0.0, 0.0, 1.0,        0.5,0.1,0.2,       0.0, 0.0, 1.0,
     2.0, 0.0, 1.0,        0.5,0.1,0.3,       0.0, 0.0, 1.0,

     2.0, 0.0, 1.0,        0.5,0.2,0.1,       0.0, 0.0, 1.0,
     0.0, 1.0, 1.0,        0.5,0.2,0.2,       0.0, 0.0, 1.0,
     1.0, 1.0, 1.0,        0.5,0.2,0.3,       0.0, 0.0, 1.0, //front

     2.0, 0.0, 0.0,        0.9,0.9,0.1,       0.0, 0.0, -1.0,
     1.0, 1.0, 0.0,        0.9,0.9,0.2,       0.0, 0.0, -1.0,
     0.0, 1.0, 0.0,        0.9,0.9,0.3,       0.0, 0.0, -1.0,

     2.0, 0.0, 0.0,        0.9,1,0.1,         0.0, 0.0, -1.0,
     0.0, 1.0, 0.0,        0.9,1,0.2,         0.0, 0.0, -1.0,
     0.0, 0.0, 0.0,        0.9,1,0.3,         0.0, 0.0, -1.0,  //back
  ]);
}

function initVertexBuffer(gl) {
//==============================================================================
// Create one giant vertex buffer object (VBO) that holds all vertices for all
// shapes.

 	// Make each 3D shape in its own array of vertices:
  makeCylinder();					// create, fill the cylVerts array
  makeSphere();						// create, fill the sphVerts array
  makeTorus();						// create, fill the torVerts array
  makeGroundGrid();				// create, fill the gndVerts array
  makeRecPyramid();       // create, fill the recPyrVerts array
  makeMillWing();         // create, fill the mwingVerts array
  // how many floats total needed to store all shapes?
	var mySiz = cylVerts.length + sphVerts.length +
							torVerts.length + gndVerts.length + recPyrVerts.length/recpyr_floatsPerVertex*floatsPerVertex
              + mwingVerts.length/mwing_floatsPerVertex*floatsPerVertex;

	// How many vertices total?
	var nn = mySiz / floatsPerVertex;
	console.log('nn is', nn, 'mySiz is', mySiz, 'floatsPerVertex is', floatsPerVertex);
  // console.log('recPyrVerts.length = ', recPyrVerts.length, 'recpyr_floatsPerVertex = ', recpyr_floatsPerVertex);
	// Copy all shapes into one big Float32 array:
  var colorShapes = new Float32Array(mySiz);
	// Copy them:  remember where to start for each shape:
	cylStart = 0;							// we stored the cylinder first.
  for(i=0,j=0; j< cylVerts.length; i++,j++) {
  	colorShapes[i] = cylVerts[j];
		}
		sphStart = i;						// next, we'll store the sphere;
	for(j=0; j< sphVerts.length; i++, j++) {// don't initialize i -- reuse it!
		colorShapes[i] = sphVerts[j];
		}
		torStart = i;						// next, we'll store the torus;
	for(j=0; j< torVerts.length; i++, j++) {
		colorShapes[i] = torVerts[j];
		}
		gndStart = i;						// next we'll store the ground-plane;
	for(j=0; j< gndVerts.length; i++, j++) {
		colorShapes[i] = gndVerts[j];
		}

    recpyrStart = i;
  for (k=0; k<recPyrVerts.length/recpyr_floatsPerVertex; k++) {
    for (j=0; j<recpyr_floatsPerVertex; j++) {
      colorShapes[recpyrStart+k*floatsPerVertex+j] = recPyrVerts[k*recpyr_floatsPerVertex+j];
    }
  }
  i = recpyrStart + k*floatsPerVertex;

  mwingStart = i;
  for (k=0; k<mwingVerts.length/mwing_floatsPerVertex; k++) {
    // for (j=0; j<mwing_floatsPerVertex; j++) {
    //   colorShapes[mwingStart+k*floatsPerVertex+j] = mwingVerts[k*mwing_floatsPerVertex+j];
    // }
    colorShapes[mwingStart+k*floatsPerVertex+0] = mwingVerts[k*mwing_floatsPerVertex+0];
    colorShapes[mwingStart+k*floatsPerVertex+1] = mwingVerts[k*mwing_floatsPerVertex+1];
    colorShapes[mwingStart+k*floatsPerVertex+2] = mwingVerts[k*mwing_floatsPerVertex+2];
    colorShapes[mwingStart+k*floatsPerVertex+3] = 1;
    colorShapes[mwingStart+k*floatsPerVertex+4] = mwingVerts[k*mwing_floatsPerVertex+3];
    colorShapes[mwingStart+k*floatsPerVertex+5] = mwingVerts[k*mwing_floatsPerVertex+4];
    colorShapes[mwingStart+k*floatsPerVertex+6] = mwingVerts[k*mwing_floatsPerVertex+5];
    colorShapes[mwingStart+k*floatsPerVertex+7] = 1;
    colorShapes[mwingStart+k*floatsPerVertex+8] = mwingVerts[k*mwing_floatsPerVertex+6];
    colorShapes[mwingStart+k*floatsPerVertex+9] = mwingVerts[k*mwing_floatsPerVertex+7];
    colorShapes[mwingStart+k*floatsPerVertex+10] = mwingVerts[k*mwing_floatsPerVertex+8];
  }



  // Create a buffer object on the graphics hardware:
  var shapeBufferHandle = gl.createBuffer();
  if (!shapeBufferHandle) {
    console.log('Failed to create the shape buffer object');
    return false;
  }

  // Bind the the buffer object to target:
  gl.bindBuffer(gl.ARRAY_BUFFER, shapeBufferHandle);
  // Transfer data from Javascript array colorShapes to Graphics system VBO
  // (Use sparingly--may be slow if you transfer large shapes stored in files)
  gl.bufferData(gl.ARRAY_BUFFER, colorShapes, gl.STATIC_DRAW);

  //Get graphics system's handle for our Vertex Shader's position-input variable:
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }

  var FSIZE = colorShapes.BYTES_PER_ELEMENT; // how many bytes per stored value?

  // Use handle to specify how to retrieve **POSITION** data from our VBO:
  gl.vertexAttribPointer(
  		a_Position, 	// choose Vertex Shader attribute to fill with data
  		4, 						// how many values? 1,2,3 or 4.  (we're using x,y,z,w)
  		gl.FLOAT, 		// data type for each value: usually gl.FLOAT
  		false, 				// did we supply fixed-point data AND it needs normalizing?
  		FSIZE * floatsPerVertex, // Stride -- how many bytes used to store each vertex?
  									// (x,y,z,w, r,g,b) * bytes/value
  		0);						// Offset -- now many bytes from START of buffer to the
  									// value we will actually use?
  gl.enableVertexAttribArray(a_Position);
  									// Enable assignment of vertex buffer object's position data

  // // Get graphics system's handle for our Vertex Shader's color-input variable;
  // var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  // if(a_Color < 0) {
  //   console.log('Failed to get the storage location of a_Color');
  //   return -1;
  // }
  // // Use handle to specify how to retrieve **COLOR** data from our VBO:
  // gl.vertexAttribPointer(
  // 	a_Color, 				// choose Vertex Shader attribute to fill with data
  // 	3, 							// how many values? 1,2,3 or 4. (we're using R,G,B)
  // 	gl.FLOAT, 			// data type for each value: usually gl.FLOAT
  // 	false, 					// did we supply fixed-point data AND it needs normalizing?
  // 	FSIZE * floatsPerVertex, 			// Stride -- how many bytes used to store each vertex?
  // 									// (x,y,z,w, r,g,b) * bytes/value
  // 	FSIZE * 4);			// Offset -- how many bytes from START of buffer to the
  // 									// value we will actually use?  Need to skip over x,y,z,w
  //
  // gl.enableVertexAttribArray(a_Color);
  // 									// Enable assignment of vertex buffer object's position data

  //  // Get graphics system's handle for our Vertex Shader's normal-input variable;
   var a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
   if (a_Normal < 0) {
     console.log('Failed to get the storage location of a_Normal');
     return -1;
   }
   // Use handle to specify how to retrieve **COLOR** data from our VBO:
   gl.vertexAttribPointer(
    a_Normal, 				// choose Vertex Shader attribute to fill with data
    3, 							// how many values? 1,2,3 or 4. (we're using R,G,B)
    gl.FLOAT, 			// data type for each value: usually gl.FLOAT
    false, 					// did we supply fixed-point data AND it needs normalizing?
    FSIZE * floatsPerVertex, 			// Stride -- how many bytes used to store each vertex?
                    // (x,y,z,w, r,g,b) * bytes/value
    FSIZE * 8);			// Offset -- how many bytes from START of buffer to the
    gl.enableVertexAttribArray(a_Normal);

	//--------------------------------DONE!
  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return nn;
}

function drawTree(gl, modelMatrix, u_ModelMatrix, normalMatrix, u_NormalMatrix) {
  // Save matrix
  modelMatrix.translate(-15, 5, 0);
  modelMatrix.scale(1.5, 1.5, 1.5);
  pushMatrix(modelMatrix);

  // Draw Cylinder
  matl0.setMatl(MATL_BRONZE_DULL);
  gl.uniform3fv(matl0.uLoc_Ke, matl0.K_emit.slice(0,3));				// Ke emissive
  gl.uniform3fv(matl0.uLoc_Ka, matl0.K_ambi.slice(0,3));				// Ka ambient
  gl.uniform3fv(matl0.uLoc_Kd, matl0.K_diff.slice(0,3));				// Kd	diffuse
  gl.uniform3fv(matl0.uLoc_Ks, matl0.K_spec.slice(0,3));				// Ks specular
  gl.uniform1f(matl0.uLoc_Kshiny, parseInt(matl0.K_shiny, 10));     // Kshiny

  modelMatrix.scale(0.4, 0.4, 1);
  modelMatrix.translate(0, 0, 1);
  // modelMatrix.rotate(rtAngle*0.1, 0, 0, 1);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);

  // // Draw axes of the tree base
  // pushMatrix(modelMatrix);
  // modelMatrix.translate(0, 0, -1.0);
  // modelMatrix.rotate(-90, 0, 0, 1);
  // modelMatrix.scale(6,3,2);
  // gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  // gl.drawArrays(gl.LINES, axes_start/floatsPerVertex, axesVerts.length/floatsPerVertex);

  // // Draw recPyramid
  matl0.setMatl(MATL_GRN_PLASTIC);
  gl.uniform3fv(matl0.uLoc_Ke, matl0.K_emit.slice(0,3));				// Ke emissive
  gl.uniform3fv(matl0.uLoc_Ka, matl0.K_ambi.slice(0,3));				// Ka ambient
  gl.uniform3fv(matl0.uLoc_Kd, matl0.K_diff.slice(0,3));				// Kd	diffuse
  gl.uniform3fv(matl0.uLoc_Ks, matl0.K_spec.slice(0,3));				// Ks specular
  gl.uniform1f(matl0.uLoc_Kshiny, parseInt(matl0.K_shiny, 10));     // Kshiny

  modelMatrix.translate(0, 0, 1.0);
  // modelMatrix.rotate(90, 0, 0, 1);
  modelMatrix.scale(3, 3, 1.5);
  // modelMatrix.rotate(rtAngle*0.5, 0, 0, 1);
  modelMatrix.rotate(swAngle*0.2, 0, 1, 0);
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, recpyrStart/floatsPerVertex, recPyrVerts.length/recpyr_floatsPerVertex);

  modelMatrix.translate(0, 0, 1.0);
  modelMatrix.rotate(swAngle*0.2, 0, 1, 0);
  modelMatrix.scale(0.8, 0.8, 1.2);
  // modelMatrix.rotate(rtAngle*0.5, 0, 0, 1);
  // modelMatrix.rotate(swAngle*0.2,1,0,0);
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, recpyrStart/floatsPerVertex, recPyrVerts.length/recpyr_floatsPerVertex);

  modelMatrix.translate(0, 0, 1.0);
  modelMatrix.rotate(swAngle*0.2, 0, 1, 0);
  modelMatrix.scale(0.6, 0.8, 1.6);
  // modelMatrix.rotate(rtAngle*0.5, 0, 0, 1);
  // modelMatrix.rotate(-swAngle*0.2,1,0,0);
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, recpyrStart/floatsPerVertex, recPyrVerts.length/recpyr_floatsPerVertex);


  // modelMatrix.rotate(-90, 0, 0, 1);
  // modelMatrix.scale(2,2,1.2);
  // modelMatrix.rotate(key_swAngle*0.2, 0, 1, 0);
  // gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  // gl.drawArrays(gl.LINES, axes_start/floatsPerVertex, axesVerts.length/floatsPerVertex);

  //gl.uniform1i(u_shade,0);

  return popMatrix();
}

function drawWindMill(gl, modelMatrix, u_ModelMatrix, normalMatrix, u_NormalMatrix) {
  modelMatrix.translate(15, -10, 0);
  modelMatrix.scale(1.8, 1.8, 1.8);
  modelMatrix.rotate(-30, 0, 0, 1);
  pushMatrix(modelMatrix);

  // Draw Cylinder
  matl0.setMatl(MATL_SILVER_SHINY);
  gl.uniform3fv(matl0.uLoc_Ke, matl0.K_emit.slice(0,3));				// Ke emissive
  gl.uniform3fv(matl0.uLoc_Ka, matl0.K_ambi.slice(0,3));				// Ka ambient
  gl.uniform3fv(matl0.uLoc_Kd, matl0.K_diff.slice(0,3));				// Kd	diffuse
  gl.uniform3fv(matl0.uLoc_Ks, matl0.K_spec.slice(0,3));				// Ks specular
  gl.uniform1f(matl0.uLoc_Kshiny, parseInt(matl0.K_shiny, 10));     // Kshiny

  modelMatrix.scale(0.2, 0.2, 2);
  modelMatrix.translate(0, 0, 1);
  // modelMatrix.rotate(rtAngle*0.1, 0, 0, 1);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);

  // Draw first wing
  matl0.setMatl(MATL_RED_PLASTIC);
  gl.uniform3fv(matl0.uLoc_Ke, matl0.K_emit.slice(0,3));				// Ke emissive
  gl.uniform3fv(matl0.uLoc_Ka, matl0.K_ambi.slice(0,3));				// Ka ambient
  gl.uniform3fv(matl0.uLoc_Kd, matl0.K_diff.slice(0,3));				// Kd	diffuse
  gl.uniform3fv(matl0.uLoc_Ks, matl0.K_spec.slice(0,3));				// Ks specular
  gl.uniform1f(matl0.uLoc_Kshiny, parseInt(matl0.K_shiny, 10));     // Kshiny

  modelMatrix = popMatrix();
  pushMatrix(modelMatrix);
  modelMatrix.translate(0, -0.2, 4);
  modelMatrix.rotate(90, 1, 0, 0);
  modelMatrix.scale(1, 1, 0.5);
  modelMatrix.rotate(rtAngle, 0, 0, 1);
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, mwingStart/floatsPerVertex, mwingVerts.length/mwing_floatsPerVertex);

  // Draw second wing
  matl0.setMatl(MATL_GRN_PLASTIC);
  gl.uniform3fv(matl0.uLoc_Ke, matl0.K_emit.slice(0,3));				// Ke emissive
  gl.uniform3fv(matl0.uLoc_Ka, matl0.K_ambi.slice(0,3));				// Ka ambient
  gl.uniform3fv(matl0.uLoc_Kd, matl0.K_diff.slice(0,3));				// Kd	diffuse
  gl.uniform3fv(matl0.uLoc_Ks, matl0.K_spec.slice(0,3));				// Ks specular
  gl.uniform1f(matl0.uLoc_Kshiny, parseInt(matl0.K_shiny, 10));     // Kshiny

  modelMatrix.rotate(90, 0, 0, 1);
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, mwingStart/floatsPerVertex, mwingVerts.length/mwing_floatsPerVertex);

  // Draw third wing
  matl0.setMatl(MATL_BLU_PLASTIC);
  gl.uniform3fv(matl0.uLoc_Ke, matl0.K_emit.slice(0,3));				// Ke emissive
  gl.uniform3fv(matl0.uLoc_Ka, matl0.K_ambi.slice(0,3));				// Ka ambient
  gl.uniform3fv(matl0.uLoc_Kd, matl0.K_diff.slice(0,3));				// Kd	diffuse
  gl.uniform3fv(matl0.uLoc_Ks, matl0.K_spec.slice(0,3));				// Ks specular
  gl.uniform1f(matl0.uLoc_Kshiny, parseInt(matl0.K_shiny, 10));     // Kshiny

  modelMatrix.rotate(90, 0, 0, 1);
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, mwingStart/floatsPerVertex, mwingVerts.length/mwing_floatsPerVertex);

  // Draw fourth wing
  matl0.setMatl(MATL_GOLD_DULL);
  gl.uniform3fv(matl0.uLoc_Ke, matl0.K_emit.slice(0,3));				// Ke emissive
  gl.uniform3fv(matl0.uLoc_Ka, matl0.K_ambi.slice(0,3));				// Ka ambient
  gl.uniform3fv(matl0.uLoc_Kd, matl0.K_diff.slice(0,3));				// Kd	diffuse
  gl.uniform3fv(matl0.uLoc_Ks, matl0.K_spec.slice(0,3));				// Ks specular
  gl.uniform1f(matl0.uLoc_Kshiny, parseInt(matl0.K_shiny, 10));     // Kshiny


  modelMatrix.rotate(90, 0, 0, 1);
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, mwingStart/floatsPerVertex, mwingVerts.length/mwing_floatsPerVertex);

  return popMatrix();
}

function drawEarth(gl, modelMatrix, u_ModelMatrix, normalMatrix, u_NormalMatrix) {
  //-------Draw Spinning Cylinder:
  // modelMatrix.setTranslate(-0.4,-0.4, 0.0);  // 'set' means DISCARD old matrix,
  // 						// (drawing axes centered in CVV), and then make new
  // 						// drawing axes moved to the lower-left corner of CVV.
  // modelMatrix.scale(1,1,-1);							// convert to left-handed coord sys
  // 																				// to match WebGL display canvas.
  // modelMatrix.scale(0.2, 0.2, 0.2);
  // 						// if you DON'T scale, cyl goes outside the CVV; clipped!
  // modelMatrix.rotate(currentAngle, 0, 1, 0);  // spin around y axis.
  // Drawing:
  // Pass our current matrix to the vertex shaders:
  // gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  //
  // normalMatrix.setInverseOf(modelMatrix);
  // normalMatrix.transpose();
  // gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  // // Draw just the the cylinder's vertices:
  // gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
  // 							cylStart/floatsPerVertex, // start at this vertex number, and
  // 							cylVerts.length/floatsPerVertex);	// draw this many vertices.
  //
  //--------Draw Spinning Sphere
  // Drawing:
  matl0.setMatl(MATL_BLU_PLASTIC);
  gl.uniform3fv(matl0.uLoc_Ke, matl0.K_emit.slice(0,3));				// Ke emissive
  gl.uniform3fv(matl0.uLoc_Ka, matl0.K_ambi.slice(0,3));				// Ka ambient
  gl.uniform3fv(matl0.uLoc_Kd, matl0.K_diff.slice(0,3));				// Kd	diffuse
  gl.uniform3fv(matl0.uLoc_Ks, matl0.K_spec.slice(0,3));				// Ks specular
  gl.uniform1f(matl0.uLoc_Kshiny, parseInt(matl0.K_shiny, 10));     // Kshiny

  modelMatrix.scale(1.5, 1.5, 1.5);
  modelMatrix.translate(0, 0, 2);
  pushMatrix(modelMatrix);
  modelMatrix.rotate(-rtAngle, 0, 0, 1);
  modelMatrix.scale(2,2,2);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

  gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
  							sphStart/floatsPerVertex,	// start at this vertex number, and
  							sphVerts.length/floatsPerVertex);	// draw this many vertices.


  //--------Draw Spinning Sphere
  // Drawing:
  matl0.setMatl(MATL_GOLD_SHINY);
  gl.uniform3fv(matl0.uLoc_Ke, matl0.K_emit.slice(0,3));				// Ke emissive
  gl.uniform3fv(matl0.uLoc_Ka, matl0.K_ambi.slice(0,3));				// Ka ambient
  gl.uniform3fv(matl0.uLoc_Kd, matl0.K_diff.slice(0,3));				// Kd	diffuse
  gl.uniform3fv(matl0.uLoc_Ks, matl0.K_spec.slice(0,3));				// Ks specular
  gl.uniform1f(matl0.uLoc_Kshiny, parseInt(matl0.K_shiny, 10));     // Kshiny

  modelMatrix = popMatrix();
  modelMatrix.rotate(rtAngle, 0, 0, 1);
  modelMatrix.translate(5, 0, 0);
  pushMatrix(modelMatrix);
  modelMatrix.rotate(rtAngle*0.8, 0, 0, 1);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

  gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
  							sphStart/floatsPerVertex,	// start at this vertex number, and
  							sphVerts.length/floatsPerVertex);	// draw this many vertices.


  //--------Draw Spinning torus
  matl0.setMatl(MATL_BRONZE_DULL);
  gl.uniform3fv(matl0.uLoc_Ke, matl0.K_emit.slice(0,3));				// Ke emissive
  gl.uniform3fv(matl0.uLoc_Ka, matl0.K_ambi.slice(0,3));				// Ka ambient
  gl.uniform3fv(matl0.uLoc_Kd, matl0.K_diff.slice(0,3));				// Kd	diffuse
  gl.uniform3fv(matl0.uLoc_Ks, matl0.K_spec.slice(0,3));				// Ks specular
  gl.uniform1f(matl0.uLoc_Kshiny, parseInt(matl0.K_shiny, 10));     // Kshiny

  modelMatrix = popMatrix();
  modelMatrix.rotate(rtAngle, 0, 0, 1);  // Spin on YZ axis
  modelMatrix.scale(1.5, 1.5, 0.5);
  // Drawing:
  // Pass our current matrix to the vertex shaders:
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

  		// Draw just the torus's vertices
  gl.drawArrays(gl.TRIANGLE_STRIP, 				// use this drawing primitive, and
  						  torStart/floatsPerVertex,	// start at this vertex number, and
  						  torVerts.length/floatsPerVertex);	// draw this many vertices.

}

function drawLamp(gl, modelMatrix, u_ModelMatrix, normalMatrix, u_NormalMatrix) {
  matl0.setMatl(MATL_SILVER_DULL);
  gl.uniform3fv(matl0.uLoc_Ke, [1,1,1]);				// Ke emissive
  gl.uniform3fv(matl0.uLoc_Ka, matl0.K_ambi.slice(0,3));				// Ka ambient
  gl.uniform3fv(matl0.uLoc_Kd, matl0.K_diff.slice(0,3));				// Kd	diffuse
  gl.uniform3fv(matl0.uLoc_Ks, matl0.K_spec.slice(0,3));				// Ks specular
  gl.uniform1f(matl0.uLoc_Kshiny, parseInt(matl0.K_shiny, 10));     // Kshiny

  modelMatrix.translate(light_X, light_Y, light_Z);
  pushMatrix(modelMatrix);
  modelMatrix.scale(0.08, 0.08, 0.08);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
                sphStart/floatsPerVertex,	// start at this vertex number, and
                sphVerts.length/floatsPerVertex);	// draw this many vertices.
  modelMatrix = popMatrix();

}

function draw(gl, modelMatrix, u_ModelMatrix, viewMatrix, u_ViewMatrix, projMatrix, u_ProjMatrix, normalMatrix, u_NormalMatrix) {
//==============================================================================
  // Clear <canvas>  colors AND the depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.viewport(0, 0, canvas.width, canvas.height);

  projMatrix.setPerspective(35, canvas.width/canvas.height, 1, 100);
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

  viewMatrix.setLookAt(g_EyeX, g_EyeY, g_EyeZ,
                       g_LookAtX, g_LookAtY, g_LookAtZ,
                       0, 0, 1);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

  // Set light_shading mode
  gl.uniform1i(u_Mode, mode);
  // Set light source lamp0
  lamp0.I_pos.elements.set([light_X, light_Y, light_Z]);
  lamp0.I_ambi.elements.set([ambi_r, ambi_g, ambi_b]);
  lamp0.I_diff.elements.set([diff_r, diff_g, diff_b]);
  lamp0.I_spec.elements.set([spec_r, spec_g, spec_b]);

  gl.uniform3fv(lamp0.u_pos, lamp0.I_pos.elements.slice(0,3));
  gl.uniform3fv(lamp0.u_ambi, lamp0.I_ambi.elements);
  gl.uniform3fv(lamp0.u_diff, lamp0.I_diff.elements);		// diffuse
  gl.uniform3fv(lamp0.u_spec, lamp0.I_spec.elements);		// Specular

  gl.uniform1f(u0_ambi_on, l0_ambi_on);
  gl.uniform1f(u0_diff_on, l0_diff_on);
  gl.uniform1f(u0_spec_on, l0_spec_on);

  // Set light source lamp1
  lamp1.I_pos.elements.set([g_EyeX, g_EyeY, g_EyeZ]);
  lamp1.I_ambi.elements.set([0.4, 0.4, 0.4]);
  lamp1.I_diff.elements.set([0.5, 0.5, 0.5]);
  lamp1.I_spec.elements.set([1.0, 1.0, 1.0]);

  gl.uniform3fv(lamp1.u_pos, lamp1.I_pos.elements.slice(0,3));
  gl.uniform3fv(lamp1.u_ambi, lamp1.I_ambi.elements);
  gl.uniform3fv(lamp1.u_diff, lamp1.I_diff.elements);		// diffuse
  gl.uniform3fv(lamp1.u_spec, lamp1.I_spec.elements);		// Specular

  gl.uniform1f(u1_ambi_on, l1_ambi_on);
  gl.uniform1f(u1_diff_on, l1_diff_on);
  gl.uniform1f(u1_spec_on, l1_spec_on);

  // Set eye posistion in the world
  eyePosWorld.set([g_EyeX, g_EyeY, g_EyeZ]);
  gl.uniform3fv(u_eyePosWorld, eyePosWorld);

	//---------Draw Ground Plane, without spinning.
	// position it.

	modelMatrix.setTranslate( 0.0, 0.0, 0.0);

  pushMatrix(modelMatrix);
  drawLamp(gl, modelMatrix, u_ModelMatrix, normalMatrix, u_NormalMatrix);
  modelMatrix = popMatrix();

	modelMatrix.scale(0.1, 0.1, 0.1);				// shrink by 10X:
  pushMatrix(modelMatrix);
  pushMatrix(normalMatrix);


	// Drawing:
	// Pass our current matrix to the vertex shaders:
  matl0.setMatl(MATL_JADE);
  gl.uniform3fv(matl0.uLoc_Ke, matl0.K_emit.slice(0,3));				// Ke emissive
  gl.uniform3fv(matl0.uLoc_Ka, matl0.K_ambi.slice(0,3));				// Ka ambient
  gl.uniform3fv(matl0.uLoc_Kd, matl0.K_diff.slice(0,3));				// Kd	diffuse
  gl.uniform3fv(matl0.uLoc_Ks, matl0.K_spec.slice(0,3));				// Ks specular
  gl.uniform1f(matl0.uLoc_Kshiny, parseInt(matl0.K_shiny, 10));     // Kshiny

  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  // Draw just the ground-plane's vertices
  gl.drawArrays(gl.LINES, 								// use this drawing primitive, and
  						  gndStart/floatsPerVertex,	// start at this vertex number, and
  						  gndVerts.length/floatsPerVertex);	// draw this many vertices.

  drawTree(gl, modelMatrix, u_ModelMatrix, normalMatrix, u_NormalMatrix);

  normalMatrix = popMatrix();
  modelMatrix = popMatrix();
  pushMatrix(modelMatrix);
  pushMatrix(normalMatrix);
  drawWindMill(gl, modelMatrix, u_ModelMatrix, normalMatrix, u_NormalMatrix);

  normalMatrix = popMatrix();
  modelMatrix = popMatrix();
  drawEarth(gl, modelMatrix, u_ModelMatrix, normalMatrix, u_NormalMatrix);
}


// Last time that this function was called:  (used for animation timing)
var g_last = Date.now();
function animateRotate() {
//==============================================================================
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;

  rtAngle += (ANGLE_STEP * elapsed) / 1000.0;
  // rtAngle %= 360.0;
}

var t_last = Date.now();
function animateSwing() {
//==============================================================================
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - t_last;
  t_last = now;

  // Update the current rotation angle (adjusted by the elapsed time)
  //  limit the angle to move smoothly between +20 and -85 degrees:
  if(swAngle >   45.0 && ang_step > 0) ang_step = -ang_step;
  if(swAngle <  -45.0 && ang_step < 0) ang_step = -ang_step;

  swAngle += (ang_step * elapsed) / 1000.0;
  swAngle %= 360;
}

var CAMERA_SETP = 0.05;
var LOOK_STEP = Math.PI/180;
var LIGHT_STEP = 0.05;
var thetaZ = 0;

window.addEventListener("keydown",
                        function(ev){
                          var dx = g_LookAtX - g_EyeX;
                          var dy = g_LookAtY - g_EyeY;
                          var dz = g_LookAtZ - g_EyeZ;
                          var ax = Math.sqrt(dx*dx + dy*dy);
                          var theta = Math.acos(dx/ax);

                          switch(ev.keyCode) {
                            case 37:  // left-arrow
                              var sx = CAMERA_SETP * Math.cos(theta+Math.PI/2);
                              var sy = CAMERA_SETP * Math.sin(theta+Math.PI/2);
                              g_EyeX += sx;
                              g_LookAtX += sx;
                              g_EyeY += sy;
                              g_LookAtY += sy;
                              // console.log("dx=",dx, "dy=",dy, "sx=", sx, "sy=",sy);
                              break;

                            case 39: // right-arrow
                              var sx = CAMERA_SETP * Math.cos(theta-Math.PI/2);
                              var sy = CAMERA_SETP * Math.sin(theta-Math.PI/2);
                              g_EyeX += sx;
                              g_LookAtX += sx;
                              g_EyeY += sy;
                              g_LookAtY += sy;
                              // console.log("dx=",dx, "dy=",dy, "sx=", sx, "sy=",sy);

                              break;

                            case 38:
                            var sx = CAMERA_SETP * Math.cos(theta);
                            var sy = CAMERA_SETP * Math.sin(theta);
                            g_EyeX += sx;
                            g_LookAtX += sx;
                            g_EyeY += sy;
                            g_LookAtY += sy;
                            break;

                            case 40:
                              var sx = -CAMERA_SETP * Math.cos(theta);
                              var sy = -CAMERA_SETP * Math.sin(theta);
                              g_EyeX += sx;
                              g_LookAtX += sx;
                              g_EyeY += sy;
                              g_LookAtY += sy;
                              break;

                            case 65: // A, look left
                              g_LookAtX = g_EyeX + ax*Math.cos(theta+LOOK_STEP);
                              g_LookAtY = g_EyeY + ax*Math.sin(theta+LOOK_STEP);
                              break;

                            case 68: // D, look right
                              g_LookAtX = g_EyeX + ax*Math.cos(theta-LOOK_STEP);
                              g_LookAtY = g_EyeY + ax*Math.sin(theta-LOOK_STEP);
                              break;

                            case 87: // W, look up
                              //thetaZ += LOOK_STEP * 0.2;
                              //g_LookAtZ = g_EyeZ + ax*Math.sin(thetaZ);
                              g_LookAtZ += LOOK_STEP; //*0.5;
                              break;

                            case 83: // S, look down
                              //thetaZ -= LOOK_STEP * 0.2;
                              //g_LookAtZ = g_EyeZ + ax*Math.sin(thetaZ);
                              g_LookAtZ -= LOOK_STEP;// * 0.5;
                              break;

                            case 73:  // "I"
                              light_Z += LIGHT_STEP;
                              break;
                            case 79:  // "O"
                               light_Z -= LIGHT_STEP;
                               break;
                            case 75:  //"K"
                               light_X -= LIGHT_STEP;
                               break;
                            case 76:  //"L"
                               light_X += LIGHT_STEP;
                               break;
                            case 78: // "N"
                               light_Y += LIGHT_STEP;
                               break;
                            case 77: // "M"
                               light_Y -= LIGHT_STEP;
                               break;

                            default:
                              break;
                          }
                        },
                        false);

window.GetMode = function(e) {
  switch (e.value) {
    case "PP":
      mode = 1;
      console.log('mode=',mode);
      break;
    case "BP":
      mode = 2;
      console.log('mode=',mode);
      break;
    case "PG":
      mode = 3;
      console.log('mode=',mode);
      break;
    case "BG":
      mode = 4;
      console.log('mode=',mode);
      break;
    default:
      mode = 4;
      console.log('mode=',mode);
  }
}

function setRGB() {
  ambi_r = document.getElementById("ambi_r").value;
  ambi_g = document.getElementById("ambi_g").value;
  ambi_b = document.getElementById("ambi_b").value;

  diff_r = document.getElementById("diff_r").value;
  diff_g = document.getElementById("diff_g").value;
  diff_b = document.getElementById("diff_b").value;

  spec_r = document.getElementById("spec_r").value;
  spec_g = document.getElementById("spec_g").value;
  spec_b = document.getElementById("spec_b").value;
  // console.log("ambi_r=", ambi_r);
}

function UserGuide() {
  var popup = document.getElementById("user_guide");
  popup.classList.toggle("show");
}

function L0_Ambi(cb){
  if (cb.checked) l0_ambi_on = 1;
  else l0_ambi_on = 0;
}
function L0_Diff(cb) {
  if (cb.checked) l0_diff_on = 1;
  else l0_diff_on = 0;
}
function L0_Spec(cb) {
  if (cb.checked) l0_spec_on = 1;
  else l0_spec_on = 0;
}
function L1_Ambi(cb){
  if (cb.checked) l1_ambi_on = 1;
  else l1_ambi_on = 0;
}
function L1_Diff(cb) {
  if (cb.checked) l1_diff_on = 1;
  else l1_diff_on = 0;
}
function L1_Spec(cb) {
  if (cb.checked) l1_spec_on = 1;
  else l1_spec_on = 0;
}
