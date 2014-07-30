var element = document.querySelector('div.ad');
var loadingElement = document.querySelector('div.ad .loading');
var index = 0;


// Source files

// -- 24 FPS, 100 FRAMES, 120%, 93.8 MB, 60x540 --
// var frameRate = 24;
// var framesPerSlide = 100;
// var totalFrames = 384;
// var lookAhead = 101;
// var stageWidth = 960;
// var stageHeight = 540;

// var images = [];
// for (var i = 0; i < 4; i++) {
// 	images.push('original/final' + i + '.jpg');
// }


// // -- 8 FPS, 1 FRAME, 20%, 320x180, 3.3MB --
// var frameRate = 8;
// var framesPerSlide = 1;
// var totalFrames = 128;
// var lookAhead = 32;
// var stageWidth = 320;
// var stageHeight = 180;

// var images = [];
// for (var i = 0; i < 128; i++) {
// 	images.push('fps8-20/fiesta' + i + '.jpg');
// }

// // -- 8 FPS, 32 FRAME, 10%, 320x180, 589K --
var frameRate = 30;
var framesPerSlide = 1;
var totalFrames = 7773;
var lookAhead = 30;
var stageWidth = 854;
var stageHeight = 480;

var images = [];
for (var i = 0; i < totalFrames; i++) {
	images.push('are/are' + i + '.jpg');
}


// // -- 24 FPS, 100 FRAMES, 120%, 320x180, 18.1 MB --
// var frameRate = 24;
// var framesPerSlide = 100;
// var totalFrames = 128;
// var lookAhead = 100;
// var stageWidth = 320;
// var stageHeight = 180;

// var images = [];
// for (var i = 0; i < 4; i++) {
// 	images.push('fps24-120/final' + i + '.jpg');
// }

var loop = true;


// Map collection
var collection = [];
for(var image in images) {
	collection.push({
		src: images[image],
		status: 'pristine'
	});
}


function init() {
	// Init stage styles
	element.style.height = stageHeight + 'px';
	element.style.width = stageWidth + 'px';
	element.style.overflow = 'hidden';
	element.style.backgroundRepeat = 'no-repeat';

}

function loadImage(index, callback) {
	if(collection.length > index) {
		if(collection[index].status != 'pristine') return;

		// console.log('Loading image ' + index);

		collection[index].status = 'loading';

		var image = new Image();
		image.src = collection[index].src;

		image.onload = function () {
			// console.log('Image loaded');
			collection[index].status = 'ready';
			if(callback) callback();
		}
	}
}

function drawImage(image, frame) {
	element.style.backgroundImage = 'url(' + image + ')';
	element.style.backgroundPosition = '0px -' + (frame % framesPerSlide) * stageHeight + 'px';

	// console.log('0px -' + (frame % framesPerSlide) * stageHeight + 'px');
}

function getIndex (frame) {
	return Math.floor(frame / framesPerSlide);
}

function getImage(index) {
	if(index >= collection.length) return null;
	return collection[index];
}

function tick (frame) {
	// Loop
	if(loop && frame == totalFrames) {
		frame = 0;
	}

	// console.log("Frame", frame);
	setTimeout(function () {
		frame = frame || 0;

		var image = getImage(getIndex(frame));

		if(image && image.status == 'ready') {
			loadingElement.style.display = 'none';

			drawImage(image.src, frame);

			doLookAhead(frame);

			tick(++frame);
		} else {
			tick(frame);
			loadingElement.style.display = 'block';
		}
	}, 1000 / frameRate);
	
}

function doLookAhead (frame) {
	var index = getIndex(frame);
	var targetIndex = getIndex(frame + lookAhead);

	for(var i = index; i <= targetIndex; i++) {
		loadImage(i);
	}

}

init();
loadImage(0, tick);
