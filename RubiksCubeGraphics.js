class RubiksCubeGraphics
{
    #RubiksCubeDimensions = {};
    #CubeHolder;
    #side = 2;
    #materialsList = [
        0xFFFFFF, //white
        0xFFFF00, //yellow
        0x0000FF, //blue
        0x00FF00, //green
        0xFFA500, //orange
        0xFF0000, //red
      ];

    //variable to control camera  
    #cameraControls;

    // //Raycasting variables
    #raycaster;
    #mouse;

    //Axes Helper
    #AxisHelper;
 
    //rotationMatrix
    #rotationMatrix = 
    {
        "x":{ "y":"z", "z":"y" },
        "z":{ "y":"x", "x":"y"},
        "y":{ "z":"x", "x":"z"}
    };

    //axis list for random scramble
    #axisList = [ "x", "y", "z" ];

    //directoin list for random scramble
    #directionList = [ -1, 1 ];

    //layer
    #layer = [];

    //pivot for rotating layer
    #pivot;

    //variable to check if the animation is on or off
    #shouldMove = false;

    //rotation, direction global variabl
    #direction;
    #rotationAxis;
    #rotationSpeed = 0.09;

    //rotationMatrix
    #rotationMatrixObject;

    //move List for fake solver
    #moveList = [];

    constructor(RubiksCubeDimensions)
    {
        //set global RubiksCubeDimensions from function
        this.#RubiksCubeDimensions = RubiksCubeDimensions;

        //set up a THREEjs scene + camera + renderer
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color( 0x0C0B0D );
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        //set up the camera position, make it so that the camera positions itself according to the dimensiosn of the cube
        this.camera.position.set(0,0,this.#RubiksCubeDimensions.x * 4);
        this.camera.lookAt(this.scene.position);
        
        //create renderer with size equal to window and append to the body
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        document.body.appendChild(this.renderer.domElement);

        this.#raycaster = new THREE.Raycaster();
        this.#mouse = new THREE.Vector2();

        //initialize pivot 
        this.#pivot = new THREE.Object3D();
        
        //Enable Axes Helper
        this.disableAxesHelper(10);

        //setup Event Listeners
        this.setupEventListeners();

        //setup the camera orbit controls
        this.setupCameraControls();

        //call the function to draw cubes on the screen
        this.drawRubiksCube();

        //animation loop
        this.animate();
    }

    randomIntFromInterval(min, max)
    { // min and max included 
        return Math.floor(Math.random() * (max - min + 1) + min)
    }

    randomScramble(count)
    {
        //randomly select one axis
        var randomScrambleRotationAxis = this.#axisList[(Math.floor(Math.random() * this.#axisList.length))];
        this.#rotationAxis = randomScrambleRotationAxis;

        //randomly select on direction
        var randomScrambleDirection = this.#directionList[Math.floor(Math.random() * this.#directionList.length)];
        this.#direction = randomScrambleDirection;

        //Randomly click a cube
        var randomCubeClick_x = this.randomIntFromInterval(0,this.#RubiksCubeDimensions['x'] - 1); 
        var randomCubeClick_y = this.randomIntFromInterval(0,this.#RubiksCubeDimensions['x'] - 1); 
        var randomCubeClick_z = this.randomIntFromInterval(0,this.#RubiksCubeDimensions['x'] - 1); 

        var tempRandomCube = { 'x' : randomCubeClick_x, 'y':randomCubeClick_y, 'z':randomCubeClick_z };

        var localCube = this.#CubeHolder[randomCubeClick_x][randomCubeClick_y][randomCubeClick_z];

        var localPosition = localCube.position;
        // console.log(localPosition);


        // 3 --> -1,0,1
        // 4 --> -2,-1,0,1

        // console.log(this.#rotationAxis);
        // console.log(this.#direction);
        // console.log(localPosition[this.#rotationAxis]);

        this.calculateLayer(localPosition[this.#rotationAxis]);

        this.addPivot(this.#layer);    
        // console.log(this.#layer); 
        // console.log(this.#moveList);
    }

    keyDown(event)
    {
        // r has keyCode 82
        // s has keyCode 83

        if(event.keyCode == 82)
        {
            console.log("Random Scramble");

            // n --> number of moves ( default 30 )
            // generate a random scramble
            // layer, direction, rotation axis 
            // apply each of them to the cube
            // insert each of them in a moveList

            //length of random scramble
            var n = 10;

            for (let i = 0; i < n; i++) {
                setTimeout(() => {
                    this.randomScramble(i);
                }, 1000 * i); 
             }      
        }  
    }

    isMouseOverObject(mouseX, mouseY)
    {
        this.#raycaster.setFromCamera(this.#mouse, this.camera);

        const intersects = this.#raycaster.intersectObjects(this.scene.children);

        if(intersects.length > 0)
        {
            return intersects[0];
        }
        else
        {
            return undefined;
        }
    }

    //initialize AxisHelper and turn on
    enableAxesHelper(size)
    {
        this.#AxisHelper = new THREE.AxesHelper(size);
        this.#AxisHelper.userData.type = "AxisHelper";

        this.scene.add(this.#AxisHelper);
    }

    disableAxesHelper()
    {
        this.scene.remove(this.#AxisHelper);
    }

    disableCameraControls()
    {
        this.#cameraControls.enableRotate = false;
        console.log("disabled camera");
    }

    enableCameraControls()
    {
        this.#cameraControls.enableRotate = true;
        console.log("enabled camera");
    }

    //This function checks for the clicked face's normal
    getMaxComponentofVector(vector_)
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

    getMaxValueofVector(vector_)
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

        return maxValue;
    }

    getMaxValueofVectorWithSign(vector_)
    {
        var maxComponent = "x";
        var maxValue = Math.abs(vector_.x);
        var return_value = vector_.x;

        if(Math.abs(vector_.y) > maxValue)
        {
            maxValue = Math.abs(vector_.y);
            maxComponent = "y";
            return_value = vector_.y;
        }
        if(Math.abs(vector_.z) > maxValue)
        {
            maxValue = Math.abs(vector_.z);
            maxComponent = "z";
            return_value = vector_.z;
        }

        return return_value;
    }

    //function when user clicks left Mouse button
    mouseDownEvent(event)
    {
        //Interact only if it's the left mouse button
        if(event.which == 1)
        {
            //Get the click coordinates
            this.#mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
            this.#mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

            //check if the coordinates are intersecting with some object
            var isIntersecting = this.isMouseOverObject(this.#mouse.x, this.#mouse.y);
            
            if(typeof isIntersecting !== "undefined" && isIntersecting.object.userData.type == "RubikCube")
            {
                //disable camera controls
                this.disableCameraControls();
                
                //if clicked object is rubik's cube, then get the face normal for the clicked cube
                // this.clickedFaceNormal = this.getMaxComponentofVector(isIntersecting.face.normal);
               
                //Get clicked cube position
                this.clickedCubePosition = isIntersecting.object.position.clone();
                
                var temp1 = this.clickedCubePosition.clone();
                var temp2 = isIntersecting.point;

                // console.log(temp1);
                // console.log(temp2);

                this.#direction = this.getMaxValueofVectorWithSign(temp2);

                if(this.#direction >= 0)
                {
                    this.#direction = 1;
                }
                else
                {
                    this.#direction = -1;
                }
              
                this.clickedFaceNormal = this.getMaxComponentofVector(temp1.multiply(temp2));
                // console.log("clicked face normal");
                // console.log(this.clickedFaceNormal);
            }
        }
    }  

    addPivot(layer_)
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
        this.scene.add(this.#pivot);

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

    //we are passing the clicked cube position
    calculateLayer(a)
    {
        for(var i = 0; i < this.#RubiksCubeDimensions.x; i++)
        {
            for(var j = 0; j < this.#RubiksCubeDimensions.y; j++)
            {
                for(var k = 0; k < this.#RubiksCubeDimensions.z; k++)
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

    mouseUpEvent(event)
    {
        //Interact only if it's the left mouse button
        if(event.which == 1)
        {
            //Get the click coordinates
            this.#mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
            this.#mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

            //check if the coordinates are intersecting with some object
            var isIntersecting = this.isMouseOverObject(this.#mouse.x, this.#mouse.y);
            
            if(typeof isIntersecting !== "undefined" && isIntersecting.object.userData.type == "RubikCube")
            {
                //if clicked object is rubik's cube, then get the face normal for the clicked cube
                this.unClickedFaceNormal = this.getMaxComponentofVector(isIntersecting.face.normal);
           
                // console.log("unclicked face normal");
                // console.log(this.unClickedFaceNormal);

                //Get clicked cube position
                this.unClickedCubePosition = isIntersecting.object.position.clone();

                //calculate drag value
                this.unClickedCubePosition.sub(this.clickedCubePosition);
             
                var isDrag = this.getMaxValueofVector(this.unClickedCubePosition);

                if(isDrag > (this.#RubiksCubeDimensions.x / 1.1))
                {
                    var maxDragComponenet = this.getMaxComponentofVector(this.unClickedCubePosition);
                    var maxDragValue = this.unClickedCubePosition[maxDragComponenet];
                    // this.#direction = 0;

                    if(maxDragValue >= 0)
                    {
                        this.#direction *= 1;
                    }
                    else if(maxDragValue < 0)
                    {
                        this.#direction *= -1;
                    }

                    //calculate the rotation axis
                    this.#rotationAxis = this.#rotationMatrix[this.clickedFaceNormal][maxDragComponenet];
                  
                    if(this.clickedFaceNormal == "x" && this.#rotationAxis == "z")
                    {
                        this.#direction *= 1;
                    }
                    else if(this.clickedFaceNormal == "x" && this.#rotationAxis == "y")
                    {
                        this.#direction *= -1;
                    }
                    else if(this.clickedFaceNormal == "y" && this.#rotationAxis == "x")
                    {
                        this.#direction *= 1;
                    }
                    else if(this.clickedFaceNormal == "y" && this.#rotationAxis == "z")
                    {
                        this.#direction *= -1;
                    }
                    else if(this.clickedFaceNormal == "z" && this.#rotationAxis == "x")
                    {
                        this.#direction *= -1;
                    }
                    else if(this.clickedFaceNormal == "z" && this.#rotationAxis == "y")
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
                    //Think about this logically
                    //We now need to select a layer to spin
                    //If it's a layer, atleast one component from x,y,z should be same for the entire layer
                    //Which one will it be?
                    //The rotation Axis

                    var a = this.clickedCubePosition.clone();
                    // console.log("blah");
                    // console.log(a)
                   
                    a = a[this.#rotationAxis];

                    this.calculateLayer(a);
                    this.addPivot(this.#layer);            
                }
                else
                {
                    console.log("drag is small");
                    this.enableCameraControls();
                }
            }
        }
    }

    setupEventListeners()
    {
        //Add Event Listener to listen mouse down event
        window.addEventListener("mousedown", this.mouseDownEvent.bind(this), false);
        window.addEventListener("mouseup", this.mouseUpEvent.bind(this), false);
        window.addEventListener("keydown", this.keyDown.bind(this), false);
    }

    //this function setups the orbit control using the orbitControls.js
    setupCameraControls()
    {
        this.#cameraControls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    }

    //here we create a material with different color for each face
    initializeMaterials()
    {
        var materials = [];
        for(var i = 0; i < this.#materialsList.length; i++)
        {
            materials.push(new THREE.MeshBasicMaterial({color:this.#materialsList[i], side: THREE.DoubleSide}));
        }
        return materials;
    }

    //this function creates and returns the meshes of the individual cubes
    createBoxGeometry(x, y, z, materials)
    {
        var geometry = new THREE.BoxGeometry(this.#side, this.#side, this.#side);
        var mesh = new THREE.Mesh(geometry, materials);
        mesh.position.set(x, y, z);
        mesh.userData.type = "RubikCube"
   
        // var geo = new THREE.EdgesGeometry( mesh.geometry );
        // var mat = new THREE.LineBasicMaterial( { color: 0x000000, linewidth: 4 } );
        // var wireframe = new THREE.LineSegments(geo, mat );
        // wireframe.position.set(x, y, z);
        // wireframe.renderOrder = 1; // make sure wireframes are rendered 2nd
        
        // this.scene.add( wireframe );     

        this.scene.add(mesh);

        return mesh;
    }

    //creates and position the cubes
    drawRubiksCube()
    {
        var offset = (this.#RubiksCubeDimensions.x - 1) / 2;
        var spacing = this.#side + 0.13;
        var materials = this.initializeMaterials();

        this.#CubeHolder = new Array(this.#RubiksCubeDimensions.x);
        for(var i = 0; i < this.#RubiksCubeDimensions.x; i++)
        {
            this.#CubeHolder[i] = new Array(this.#RubiksCubeDimensions.y);
            for(var j = 0; j < this.#RubiksCubeDimensions.y; j++)
            {
                this.#CubeHolder[i][j] = new Array(this.#RubiksCubeDimensions.z);
                for(var k = 0; k < this.#RubiksCubeDimensions.z; k++)
                {
                    var x = (offset - i) * spacing;
                    var y = (offset - j) * spacing;
                    var z = (offset - k) * spacing;
                    this.#CubeHolder[i][j][k] = this.createBoxGeometry(x,y,z, materials);
                }
            }
        }
    }

    updateMatrix_()
    {
        this.#shouldMove = false;
        this.#pivot.updateMatrixWorld();

        this.scene.remove(this.#pivot);

        for( var i = 0; i < this.#layer.length; i++)
        {
            this.#layer[i].updateMatrixWorld();
            this.#layer[i].applyMatrix4(this.#pivot.matrixWorld);
            
            this.#pivot.remove(this.#layer[i]);
            this.scene.add(this.#layer[i]);     
        }
        this.#layer = [];
        this.#rotationMatrixObject = undefined;
        this.enableCameraControls();
    }

    animateRotation()
    {
        if(this.#pivot.rotation[this.#rotationAxis] >= Math.PI / 2)
        {
            this.#pivot.rotation[this.#rotationAxis] = Math.PI / 2;
            this.updateMatrix_();
        }
        else if(this.#pivot.rotation[this.#rotationAxis] <= Math.PI / -2)
        {
        
            this.#pivot.rotation[this.#rotationAxis] = Math.PI / -2;
            this.updateMatrix_();             
        }
        else
        {
            this.#pivot.rotation[this.#rotationAxis] += (this.#rotationSpeed * this.#direction);
        } 
    }

    animate()
    {
        requestAnimationFrame(()=>this.animate());

        if(this.#shouldMove)
        {
            this.animateRotation();
        }

        this.renderer.render(this.scene, this.camera);
    }
}