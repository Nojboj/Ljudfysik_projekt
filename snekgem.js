let mic, fft;
let soundCounter = 1;
var counterD5 = 0;
var counterE5 = 0;
var counterG5 = 0;
var counterA5 = 0;

// the snake is dividedoi into small segments, which are drawn and edited on each 'draw' call
let numSegments = 5;
let direction = 'right';

const xStart = 0; //starting x coordinate for snake
const yStart = 250; //starting y coordinate for snake
const diff = 10;

let xCor = [];
let yCor = [];

let xFruit = 0;
let yFruit = 0;
let scoreElem;

function setup() {
  scoreElem = createDiv('Score = 0');
  scoreElem.position(20, 20);
  scoreElem.id = 'score';
  scoreElem.style('color', 'white');

  createCanvas(400, 400);
  frameRate(10);
  stroke(255);
  strokeWeight(10);
  updateFruitCoordinates();

  mic = new p5.AudioIn();
  mic.start();
  fft = new p5.FFT();
  fft.setInput(mic);

  for (let i = 0; i < numSegments; i++) {
    xCor.push(xStart + i * diff);
    yCor.push(yStart);
  }
}

function draw() {
  background(0);

  let spectrum = fft.analyze();
  let highestFreq;
  
  
  //spectrum = hps(spectrum, 5);
  highestFreq = getLoudestFrequency(spectrum); 
  console.log(highestFreq);

  for (let i = 0; i < numSegments - 1; i++) {
    line(xCor[i], yCor[i], xCor[i + 1], yCor[i + 1]);
  }

  snekKeyboard(highestFreq);
  updateSnakeCoordinates();
  checkGameStatus();
  checkForFruit();
}


function hps(Spectra, n){
  let hpsParts = [];
  let newSpectra = [];
  for(let i = 0; i < n; i++){
    hpsParts[i] = downSample(Spectra,i+1);
  }

  for(let i = 0; i < hpsParts[n-1].length; i++){   
    let number; 
    for(let j = 0; j < n; j++){
      number = 1;
      number *= hpsParts[j][i];
    }  
    newSpectra[i] = number;
  }
  return newSpectra;
}

function downSample(Spectra, n){
  let counter = 0;
  for(let i = 0; i < Spectra.length; i = i + n){
    Spectra[counter] = Spectra[i];    
    counter++;
  }
  return Spectra;
}

function getLoudestFrequency(Spectra) {
  var nyquist = sampleRate() / 2; // 22050
  var numberOfBins = Spectra.length;
  var maxAmp = 0;
  var largestBin;
  
  for (var i = 0; i < numberOfBins; i++) {
    var thisAmp = Spectra[i]; // amplitude of current bin     
      if (thisAmp > maxAmp) {
          maxAmp = thisAmp;
          largestBin = i;
      }      
  }
  var loudestFreq = largestBin * (nyquist / numberOfBins);
  return loudestFreq;
}



/*
 The segments are updated based on the direction of the snake.
 All segments from 0 to n-1 are just copied over to 1 till n, i.e. segment 0
 gets the value of segment 1, segment 1 gets the value of segment 2, and so on,
 and this results in the movement of the snake.

 The last segment is added based on the direction in which the snake is going,
 if it's going left or right, the last segment's x coordinate is increased by a
 predefined value 'diff' than its second to last segment. And if it's going up
 or down, the segment's y coordinate is affected.
*/
function updateSnakeCoordinates() {
  for (let i = 0; i < numSegments - 1; i++) {
    xCor[i] = xCor[i + 1];
    yCor[i] = yCor[i + 1];
  }
  switch (direction) {
    case 'right':
      xCor[numSegments - 1] = xCor[numSegments - 2] + diff;
      yCor[numSegments - 1] = yCor[numSegments - 2];
      break;
    case 'up':
      xCor[numSegments - 1] = xCor[numSegments - 2];
      yCor[numSegments - 1] = yCor[numSegments - 2] - diff;
      break;
    case 'left':
      xCor[numSegments - 1] = xCor[numSegments - 2] - diff;
      yCor[numSegments - 1] = yCor[numSegments - 2];
      break;
    case 'down':
      xCor[numSegments - 1] = xCor[numSegments - 2];
      yCor[numSegments - 1] = yCor[numSegments - 2] + diff;
      break;
  }
}

/*
 I always check the snake's head position xCor[xCor.length - 1] and
 yCor[yCor.length - 1] to see if it touches the game's boundaries
 or if the snake hits itself.
*/
function checkGameStatus() {
  if (
    xCor[xCor.length - 1] > width ||
    xCor[xCor.length - 1] < 0 ||
    yCor[yCor.length - 1] > height ||
    yCor[yCor.length - 1] < 0 ||
    checkSnakeCollision()
  ) {
    noLoop();
    const scoreVal = parseInt(scoreElem.html().substring(8));
    scoreElem.html('Game ended! Your score was : ' + scoreVal);
  }
}

/*
 If the snake hits itself, that means the snake head's (x,y) coordinate
 has to be the same as one of its own segment's (x,y) coordinate.
*/
function checkSnakeCollision() {
  const snakeHeadX = xCor[xCor.length - 1];
  const snakeHeadY = yCor[yCor.length - 1];
  for (let i = 0; i < xCor.length - 1; i++) {
    if (xCor[i] === snakeHeadX && yCor[i] === snakeHeadY) {
      return true;
    }
  }
}

/*
 Whenever the snake consumes a fruit, I increment the number of segments,
 and just insert the tail segment again at the start of the array (basically
 I add the last segment again at the tail, thereby extending the tail)
*/
function checkForFruit() {
  point(xFruit, yFruit);
  if (xCor[xCor.length - 1] === xFruit && yCor[yCor.length - 1] === yFruit) {
    const prevScore = parseInt(scoreElem.html().substring(8));
    scoreElem.html('Score = ' + (prevScore + 1));
    xCor.unshift(xCor[0]);
    yCor.unshift(yCor[0]);
    numSegments++;
    updateFruitCoordinates();
  }
}

function updateFruitCoordinates() {
  /*
    The complex math logic is because I wanted the point to lie
    in between 100 and width-100, and be rounded off to the nearest
    number divisible by 10, since I move the snake in multiples of 10.
  */

  xFruit = floor(random(10, (width - 100) / 10)) * 10;
  yFruit = floor(random(10, (height - 100) / 10)) * 10;
}

function snekKeyboard(loudestFreq) {

  
  if((loudestFreq > 550 && loudestFreq < 615) || (loudestFreq > 1140 && loudestFreq < 1170)) { //if playing a D5 or D#5
    counterD5++;
    counterE5 = 0;
    counterG5 = 0;
    counterA5 = 0;
   
    if(counterD5 == soundCounter){  
      console.log('d -> turn down');    
      if (direction !== 'up') {
        direction = 'down';
      }
    }

  } else if((loudestFreq > 615 && loudestFreq < 685) || (loudestFreq > 1280 && loudestFreq < 1320)) { //if playing a E5 or E#5 
    counterD5 = 0;
    counterE5++;
    counterG5 = 0;
    counterA5 = 0;

    if(counterE5 == soundCounter){ 
      
      console.log('e -> turn left'); 
      if (direction !== 'right') {
        direction = 'left';
      }
    }

  } else if((loudestFreq > 685 && loudestFreq < 800) || (loudestFreq > 1540 && loudestFreq < 1580)) { //if playing a G5 or G#5
    counterD5 = 0;
    counterE5 = 0;
    counterG5++;
    counterA5 = 0;
    
    if(counterG5 == soundCounter){   
      console.log('g -> turn up');    
      if (direction !== 'down') {
        direction = 'up';
      }
    }

  } else if((loudestFreq > 800 && loudestFreq < 920) || (loudestFreq > 1700 && loudestFreq < 1760)) { //if playing a A5 or A#5
    counterD5 = 0;
    counterE5 = 0;
    counterG5 = 0;
    counterA5++;
    
    if(counterA5 == soundCounter){   

      console.log('a -> turn right');       
      if (direction !== 'left') {
        direction = 'right';
      }     
    }
  }
  
};