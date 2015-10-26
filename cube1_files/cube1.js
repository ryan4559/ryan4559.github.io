
var gl;
var points;

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;

var axis = 0;
var theta = [ 0, 0, 0 ];
var paused = 0;
var depthTest = 1;

var start_x = 0;
var start_z = -2;
var end_x = 0;
var end_z = 0; 
var FOV = 45
var depth = 3.0;

var matrixLoc;

var numVertices  = 36;

var vertices = [
	vec3( -0.5, -0.5,  0.5 ),
	vec3( -0.5,  0.5,  0.5 ),
	vec3(  0.5,  0.5,  0.5 ),
	vec3(  0.5, -0.5,  0.5 ),
	vec3( -0.5, -0.5, -0.5 ),
	vec3( -0.5,  0.5, -0.5 ),
	vec3(  0.5,  0.5, -0.5 ),
	vec3(  0.5, -0.5, -0.5 )
];

var vertexColors = [
	vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
	vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
	vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
	vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
	vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
	vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
	vec4( 1.0, 1.0, 1.0, 1.0 ),  // white
	vec4( 0.0, 1.0, 1.0, 1.0 )   // cyan
];

// indices of the 12 triangles that compise the cube

var indices = [
    1, 0, 3,
    3, 2, 1,
    2, 3, 7,
    7, 6, 2,
    3, 0, 4,
    4, 7, 3,
    6, 5, 1,
    1, 2, 6,
    4, 5, 6,
    6, 7, 4,
    5, 4, 0,
    0, 1, 5
];

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    //  Load shaders and initialize attribute buffers
    
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    // array element buffer
    
    var iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);
    
    // color array atrribute buffer
    
    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertexColors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    // vertex array attribute buffer
    
    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    matrixLoc = gl.getUniformLocation(program, "transform"); 

    //event listeners for buttons 
    document.getElementById( "xButton" ).onclick = rotateX;
    document.getElementById( "yButton" ).onclick = rotateY;
    document.getElementById( "zButton" ).onclick = rotateZ;
    document.getElementById( "pButton" ).onclick = function() {paused=!paused;};
    document.getElementById( "dButton" ).onclick = function() {depthTest=!depthTest;};

    document.getElementById( "fButton" ).onclick = function() {start_z+=0.1;end_z+=0.1;depth-=0.1};
    document.getElementById( "bButton" ).onclick = function() {start_z-=0.1;end_z-=0.1;depth+=0.1};
    document.getElementById( "lButton" ).onclick = function() {start_x+=0.1;end_x+=0.1;};
    document.getElementById( "rButton" ).onclick = function() {start_x-=0.1;end_x-=0.1;};
	
    //document.getElementById( "+Button" ).onclick = addFOV;
    //document.getElementById( "-Button" ).onclick = subFOV;
 
    document.getElementById( "FOVslider" ).oninput = function() {FOV = this.value;};
    showValue(FOV);

    render();
};

function addFOV()
{
    if (FOV < 179) 
        {FOV+=5;};
    document.getElementById( "FOVslider" ).value = FOV;
}

function subFOV()
{
    if (FOV > 45)
     {FOV-=5;};    
    document.getElementById( "FOVslider" ).value = FOV;
}

function showValue(newValue)
{
    document.getElementById("range").innerHTML=newValue;
}

function rotateX() {
	paused = 0;
    axis = xAxis;
};
function rotateY() {
	paused = 0;
	axis = yAxis;
};
function rotateZ() {
	paused = 0;
	axis = zAxis;
};


function render() {
	var modeling = mult(rotate(theta[xAxis], 1, 0, 0),
	                 mult(rotate(theta[yAxis], 0, 1, 0),rotate(theta[zAxis], 0, 0, 1)));
	var viewing = lookAt([start_x,0,start_z], [end_x,0,end_z], [0,1,0]);
	var projection = perspective(FOV, 1.0, 0.1, depth);
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

    if (! paused) theta[axis] += 2.0;
	if (depthTest) gl.enable(gl.DEPTH_TEST); else gl.disable(gl.DEPTH_TEST);

	var mvpMatrix = mult(projection, mult(viewing, modeling));
    gl.uniformMatrix4fv(matrixLoc, 0, flatten(mvpMatrix));

    gl.drawElements( gl.TRIANGLES, numVertices, gl.UNSIGNED_BYTE, 0 );

    requestAnimFrame( render );
}
