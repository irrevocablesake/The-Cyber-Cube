import * as THREE from 'three'
import { GLTFLoader } from 'three/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/controls/OrbitControls.js'
import { AxesHelper } from 'three'
import { TextGeometry } from 'three/geometries/TextGeometry.js'
import { FontLoader } from 'three/loaders/FontLoader.js'

export class RubikCubeGraphic
{
    #RubikCubeDimension;
    #scene;
    #camera;
    #renderer;
    #side = 2;
    #CubeHolder;
    #materialsList = [
        0xFFFFFF, //white
        0xFFFF00, //yellow
        0x0000FF, //blue
        0x00FF00, //green
        0xFFA500, //orange
        0xFF0000, //red
      ];
    #materials;
    #cameraControls;
    #AxisHelper;
    #mouse;
    #raycaster;
    #direction;
    #clickedFaceNormal;
    #rotationAxis;
    #rotationMatrix = 
    {
        "x":{ "y":"z", "z":"y" },
        "z":{ "y":"x", "x":"y"},
        "y":{ "z":"x", "x":"z"}
    };
    #layer = [];
    #pivot;
    #shouldMove = false;
    #unClickedFaceNormal;   
    #unClickedCubePosition;
    #clickedCubePosition;
    #rotationMatrixObject;
    #rotationSpeed = 0.5;

    #basicSetup()
    {
        //set up a THREEjs scene + change background color
        this.#scene = new THREE.Scene();
        this.#scene.background = new THREE.Color( 0x0C0B0D );

        //create camera + position camera
        this.#camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
        this.#camera.position.set( 0, 0, this.#RubikCubeDimension.x * 4 );
        this.#camera.lookAt( this.#scene.position );

        //create a renderer
        this.#renderer = new THREE.WebGLRenderer({ antialias: true});
        this.#renderer.setSize( window.innerWidth, window.innerHeight );

        //append the renderer to body
        document.body.appendChild( this.#renderer.domElement );

        //set up mouse vector for coordinates
        this.#mouse = new THREE.Vector2();
        this.#raycaster = new THREE.Raycaster();
        this.#pivot = new THREE.Object3D();

        const fontLoader = new FontLoader();
        fontLoader.load("https://raw.githubusercontent.com/mrdoob/three.js/master/examples/fonts/helvetiker_bold.typeface.json", (font) => {
        const textGeometry = new TextGeometry("The Cube",{
            height:2,
            size:5,
            font:font,
        });
        const textMaterial = new THREE.MeshBasicMaterial();
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.set(-70,0,-40);
        textMesh.rotation.x = 0;
        textMesh.rotation.y = 120;
        textMesh.rotation.z = 0;

        this.#scene.add( textMesh );

        });
}
    //here we create a material with different color for each face
    #initializeMaterials()
    {
        var materials = [];
        for(var i = 0; i < this.#materialsList.length; i++)
        {
            materials.push(new THREE.MeshBasicMaterial({color:this.#materialsList[i], side: THREE.DoubleSide}));
        }
        return materials;
    }

    #createBoxGeometry(x, y, z, materials)
    {
        var geometry = new THREE.BoxGeometry(this.#side, this.#side, this.#side);
        var mesh = new THREE.Mesh(geometry, materials);
        mesh.position.set(x, y, z);
        mesh.userData.type = "RubikCube"
   
        var geo = new THREE.EdgesGeometry( mesh.geometry );
        var mat = new THREE.LineBasicMaterial( { color: 0x000000, linewidth: 4 } );
        var wireframe = new THREE.LineSegments(geo, mat );
        wireframe.position.set(x, y, z);
        wireframe.renderOrder = 1; // make sure wireframes are rendered 2nd

        this.#scene.add( wireframe );     
        this.#scene.add(mesh);

        return mesh;
    }

    #drawRubikCube()
    {
        var offset = ( this.#RubikCubeDimension.x - 1  ) / 2;
        var spacing = this.#side + 0.1;
        this.#materials = this.#initializeMaterials();

        this.#CubeHolder = new Array(this.#RubikCubeDimension.x);
        for(var i = 0; i < this.#RubikCubeDimension.x; i++)
        {
            this.#CubeHolder[i] = new Array(this.#RubikCubeDimension.y);
            for(var j = 0; j < this.#RubikCubeDimension.y; j++)
            {
                this.#CubeHolder[i][j] = new Array(this.#RubikCubeDimension.z);
                for(var k = 0; k < this.#RubikCubeDimension.z; k++)
                {
                    var x = (offset - i) * spacing;
                    var y = (offset - j) * spacing;
                    var z = (offset - k) * spacing;
                    this.#CubeHolder[i][j][k] = this.#createBoxGeometry(x,y,z, this.#materials);
                }
            }
        }
    }

    #disableCameraControls()
    {
        this.#cameraControls.enableRotate = false;
        console.log("disabled camera");
    }

    #enableCameraControls()
    {
        this.#cameraControls.enableRotate = true;
        console.log("enabled camera");
    }

    #setupCameraControls()
    {
        this.#cameraControls = new OrbitControls( this.#camera, this.#renderer.domElement);
    }

    //setupAxesHelper
    #setupAxesHelper( size )
    {
        this.#AxisHelper = new THREE.AxesHelper(size);
        this.#AxisHelper.userData.type = "AxisHelper";
    }

    //initialize AxisHelper and turn on
    #enableAxesHelper()
    {
        this.#scene.add(this.#AxisHelper);
    }

    #disableAxesHelper()
    {
        this.#scene.remove(this.#AxisHelper);
    }

    //getmaxcomponenetofvector
    //getmaxvalueoferror
    //getmaxvalueofectorwihtsign
    //mousedownevent
    //addpivot
    //calculatelayer
    //mouseevent
    //setupeventlisteners
    //updatematrix
    //animateroatation

    #isMouseOverObject( mouseX, mouseY )
    {
        this.#raycaster.setFromCamera( this.#mouse, this.#camera );

        const intersects = this.#raycaster.intersectObjects( this.#scene.children );

        if(  intersects.length > 0 )
        {
            for( var i = 0; i < intersects.length; i++ )
            {
                if( intersects[i].object.userData.type == "RubikCube")
                {
                    return intersects[i];
                }
            }
        }
        else
        {
            return undefined;
        }
    }

    #getMaxValueofVectorWithSigh( vector )
    {
        var maxValue = Math.abs( vector.x );
        var return_value = vector.x;

        if( Math.abs( vector.y) > maxValue )
        {
            maxValue = Math.abs(vector.y);
            return_value = vector.y;
        }
        if( Math.abs(vector.z) > maxValue )
        {
            maxValue = Math.abs(vector.z);
            return_value = vector.z;
        }

        return return_value;
    }

    #getMaxComponentofVector(vector_)
    {
        var maxComponent = "x";
        var maxValue = Math.abs(vector_.x);

        if(Math.abs(vector_.y) > maxValue)
        {
            maxValue = Math.abs(vector_.y);
            maxComponent = "y";
        }
        if(Math.abs(vector_.z) > maxValue)
        {
            maxValue = Math.abs(vector_.z);
            maxComponent = "z";
        }

        return maxComponent;
    }

    #addPivot(layer_)
    {
        this.#layer = layer_;
        //We have a layer of cubes to rotate
        //We now want to rotate the layer around a single point
        //For that we need a pivot
        //We have initialized the pivot in the connstructor 
        //Now we have set the rotation of the pivot
        this.#pivot.rotation.set(0,0,0);
        this.#pivot.position.set(0,0,0);

        //Ask threejs to update the world matrix for this object
        this.#pivot.updateMatrixWorld();

        //Add the pivot to the scene
        this.#scene.add(this.#pivot);

        //Attach the pivot to the cubes / layers
        for( var i = 0; i < this.#layer.length; i++)
        {
            this.#pivot.attach(this.#layer[i]);
        }

        //We want the rotation to be animated
        //Which means we need to call the rotation function inside the render loop
        //And We don't wanna rotate all the time but only when there's a successful theoretical turn
        //We use this 

        this.#shouldMove = true;
    }

    #calculateLayer(a)
    {
        for(var i = 0; i < this.#RubikCubeDimension.x; i++)
        {
            for(var j = 0; j < this.#RubikCubeDimension.y; j++)
            {
                for(var k = 0; k < this.#RubikCubeDimension.z; k++)
                {
                    var b = this.#CubeHolder[i][j][k].position.clone();
                    b = b[ this.#rotationAxis];                             

                    if(Math.abs(a - b) <= 0.001)
                    {
                        this.#layer.push(this.#CubeHolder[i][j][k]);
                    }
                }
            }
        }      
    }

    #mouseDownEvent( event )
    {
        if( event.button == 0 )
        {
            //Get the click coordinates
            this.#mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
            this.#mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

            //check if the coordinates are intersecting with some object
            var isIntersecting = this.#isMouseOverObject( this.#mouse.x, this.#mouse.y );

            if( typeof isIntersecting !== "undefined" && isIntersecting.object.userData.type === "RubikCube")
            {
                this.#disableCameraControls();

                this.#clickedCubePosition = isIntersecting.object.position.clone();

                var temp1 = this.#clickedCubePosition.clone();
                var temp2 = isIntersecting.point;

                this.#direction = this.#getMaxValueofVectorWithSigh( temp2 );

                if( this.#direction >= 0 )
                {
                    this.#direction = 1;
                }
                else
                {
                    this.#direction = -1;
                }

                this.#clickedFaceNormal = this.#getMaxComponentofVector(temp1.multiply(temp2));
                
            }
        }
    }

    #mouseUpEvent( event )
    {
        if( event.button == 0 )
        {
            //get the  unclick coordinates
            this.#mouse.x = ( event.clientX / window.innerWidth )* 2 - 1;
            this.#mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

            //check if the coordinates are intersecting with some object
            var isIntersecting = this.#isMouseOverObject( this.#mouse.x, this.#mouse.y);

            if( typeof isIntersecting !== "undefined" && isIntersecting.object.userData.type === "RubikCube")
            {
                this.#unClickedFaceNormal = this.#getMaxComponentofVector( isIntersecting.face.normal );

                //get uncliked cube position
                this.#unClickedCubePosition = isIntersecting.object.position.clone();

                //calculate drage value
                this.#unClickedCubePosition.sub( this.#clickedCubePosition );

                var isDrag = Math.abs(this.#getMaxValueofVectorWithSigh( this.#unClickedCubePosition ));

                console.log("drag amount:" + isDrag);

                if( isDrag > ( this.#RubikCubeDimension.x / 1.1 ))
                {
                    var maxDragComponent = this.#getMaxComponentofVector( this.#unClickedCubePosition );
                    var maxdragValue = this.#unClickedCubePosition[maxDragComponent];

                    if( maxdragValue >= 0 )
                    {
                        this.#direction *= 1;
                    }
                    else if( maxdragValue < 0 )
                    {
                        this.#direction *= -1;
                    }

                    //calculate the rotation axis
                    this.#rotationAxis = this.#rotationMatrix[this.#clickedFaceNormal][maxDragComponent];

                    if(this.#clickedFaceNormal == "x" && this.#rotationAxis == "z")
                    {
                        this.#direction *= 1;
                    }
                    else if(this.#clickedFaceNormal == "x" && this.#rotationAxis == "y")
                    {
                        this.#direction *= -1;
                    }
                    else if(this.#clickedFaceNormal == "y" && this.#rotationAxis == "x")
                    {
                        this.#direction *= 1;
                    }
                    else if(this.#clickedFaceNormal == "y" && this.#rotationAxis == "z")
                    {
                        this.#direction *= -1;
                    }
                    else if(this.#clickedFaceNormal == "z" && this.#rotationAxis == "x")
                    {
                        this.#direction *= -1;
                    }
                    else if(this.#clickedFaceNormal == "z" && this.#rotationAxis == "y")
                    {
                        this.#direction *= 1;
                    }
              
                    if(this.#rotationAxis == "z")
                    {
                        this.#rotationMatrixObject = new THREE.Matrix4().makeRotationZ(Math.PI/(2 * this.#direction));
                    }
                    else if(this.#rotationAxis == "y")
                    {
                        this.#rotationMatrixObject = new THREE.Matrix4().makeRotationY(Math.PI/(2 * this.#direction));
                    }
                    else if(this.#rotationAxis == "x")
                    {
                        this.#rotationMatrixObject = new THREE.Matrix4().makeRotationX(Math.PI/(2 * this.#direction));
                    }

                    var a = this.#clickedCubePosition.clone();
                   
                    a = a[this.#rotationAxis];

                    this.#calculateLayer(a);
                    this.#addPivot(this.#layer);  

                }
                else
                {
                    console.log("drag is small");
                    this.#enableCameraControls();
                }
            }
        }
    }

    #keyDown( event )
    {
        if( event.key == 's')
        {
            //start reverse solve
        }
    }

    #setupEventListeners()
    {
        window.addEventListener( "mousedown", this.#mouseDownEvent.bind(this), false );
        window.addEventListener("mouseup", this.#mouseUpEvent.bind(this),false);
        window.addEventListener("keydown", this.#keyDown.bind(this), false);
    }

    #updateMatrix_()
    {
        this.#shouldMove = false;
        this.#pivot.updateMatrixWorld();

        this.#scene.remove(this.#pivot);

        for( var i = 0; i < this.#layer.length; i++)
        {
            this.#layer[i].updateMatrixWorld();
            this.#layer[i].applyMatrix4(this.#pivot.matrixWorld);
            
            this.#pivot.remove(this.#layer[i]);
            this.#scene.add(this.#layer[i]);     
        }
        this.#layer = [];
        this.#rotationMatrixObject = undefined;
        this.#enableCameraControls();
    }

    #animateRotation()
    {
        if(this.#pivot.rotation[this.#rotationAxis] >= Math.PI / 2)
        {
            this.#pivot.rotation[this.#rotationAxis] = Math.PI / 2;
            this.#updateMatrix_();
        }
        else if(this.#pivot.rotation[this.#rotationAxis] <= Math.PI / -2)
        {
        
            this.#pivot.rotation[this.#rotationAxis] = Math.PI / -2;
            this.#updateMatrix_();             
        }
        else
        {
            this.#pivot.rotation[this.#rotationAxis] += (this.#rotationSpeed * this.#direction);
        } 
    }

    #animate()
    {
        requestAnimationFrame(()=>this.#animate());

        if(this.#shouldMove)
        {
            this.#animateRotation();
        }

        this.#renderer.render(this.#scene, this.#camera);
    }

    constructor( RubikCubeDimension )
    {
        //set global RubikCubeDimension from parameter
        this.#RubikCubeDimension = RubikCubeDimension;

        //set up scene, camera, renderer
        this.#basicSetup();

        //setup mouse and keyboard listeners
        this.#setupEventListeners(); 
  
        //setup camera controls
        this.#setupCameraControls();

        //draw RubikCube on screen
        this.#drawRubikCube();

        //setupAxesHelper
        // this.#setupAxesHelper(10);
        // this.#enableAxesHelper();
        

        //animation loop
        this.#animate();   
    }
}