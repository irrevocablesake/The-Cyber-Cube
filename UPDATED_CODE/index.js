import { RubikCubeGraphic } from './graphics.js'

class RubikCubeSimulation
{
    #RubikCubeDimension = {};
    #RubikCubeGraphic;

    constructor( RubikCubeDimension )
    {
        this.#RubikCubeDimension = RubikCubeDimension;

        this.#RubikCubeGraphic = new RubikCubeGraphic( this.#RubikCubeDimension );
    }
}

var dimension = 3;

var RubikCubeDimension = { x: dimension, y:dimension, z:dimension };

var simulation = new RubikCubeSimulation( RubikCubeDimension );