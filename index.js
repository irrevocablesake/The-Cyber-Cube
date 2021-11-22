class RubikCubeSimulation
{
    #RubiksCubeDimensions = {};
    #RubiksCubeGraphics;

    //a constructor that receives the dimensions of the Rubik's Cube
    constructor(RubiksCubeDimensions)
    {   
        //Assign the function variable to Global variable
        this.#RubiksCubeDimensions = RubiksCubeDimensions;
        
        //Create a new Object of Rubik's Cube Graphics
        this.#RubiksCubeGraphics = new RubiksCubeGraphics(this.#RubiksCubeDimensions);
    }
}
//press R for random scramble

//Dimensions of the Rubik's Cube
var dimension = 8;

var RubiksCubeDimensions = {x: dimension, y: dimension, z: dimension};

//Create Object of the simulation and send the dimensions 
var simulation = new RubikCubeSimulation(RubiksCubeDimensions);