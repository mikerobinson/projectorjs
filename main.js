var element = document.querySelector('div.ad');
var image1, image2;
var activeElementIndex = 0;
var loadingElement = document.querySelector('div.ad .loading');
var index = 0;


// Source files
var loop = true;

// Map collection
var collection = [];
for(var i = 0; i < images.length; i++) {
	collection.push({
		src: images[i],
		status: 'pristine'
	});
}

init();
resetMovie();

function init() {
	// Init stage styles
	element.style.height = stageHeight + 'px';
	element.style.width = stageWidth + 'px';
	element.style.overflow = 'hidden';
	element.style.backgroundRepeat = 'no-repeat';

	// Inject top and bottom layers
	var div = document.createElement('div');
	div.style.backgroundRepeat = 'no-repeat';
	// div.style.position = 'absolute';
	div.style.height = stageHeight + 'px';
	div.style.width = stageWidth + 'px';


	image1 = element.appendChild(div.cloneNode());
	image2 = element.appendChild(div.cloneNode());

	image1.style.display = 'block';
	image2.style.display = 'none';

	image1.active = true;
}

function resetMovie() {
	// frame = 0;
	// element.innerHTML = '';
	
	// init();
	
	for(var i = 0; i < collection.length; i++) {
		collection[i].status = 'pristine';
	}

	loadImage(0, tick);
}

function loadImage(index, callback) {
	if(collection.length > index) {
		if(collection[index].status != 'pristine') return;

		collection[index].status = 'loading';

		var image = new Image();
		image.src = collection[index].src;
		// console.log(image.complete);


		image.onload = function () {
			collection[index].status = 'ready';
			if(callback) callback();
		}
	}
}


/**
 * EXPECT 10x10 grid
 */
 function drawImage(image, frame, targetElement) {
 	targetElement.style.backgroundImage = 'url(' + image + ')';
	// element.style.backgroundPosition = '0px -' + (frame % framesPerSlide) * stageHeight + 'px';
	
	var framesPerRow = 10; // Hardcoded for now
	
	var localFrame = frame % framesPerSlide; // frame on current image
	var row = Math.floor(localFrame / framesPerRow);
	var column = localFrame % framesPerRow;

	targetElement.style.backgroundPosition = '-' + (column * stageWidth) + 'px -' + (row * stageHeight) + 'px';	


	// console.log('Row', row, 'Column', column);
	// console.log('0px -' + (frame % framesPerSlide) * stageHeight + 'px');
}

function getContainer () {
	if(!this.container) this.container = document.querySelector('div.ad');
	return this.container;
}

function getImageContainer (active) {
	return image1.active == active ? image1 : image2;
}

function flipActiveImage () {
	if(image1.active) {
		image1.active = false;
		image1.style.display = 'none';
		image2.active = true;	
		image2.style.display = 'block';
	} else {
		image1.active = true;
		image1.style.display = 'block';
		image2.active = false;	
		image2.style.display = 'none';
	}
}

function getIndex (frame) {
	return Math.floor(frame / framesPerSlide);
}

function getImage(index) {
	if(index >= collection.length) return null;
	return collection[index];
}

function getImageFrameCount (imageObject) {
	return Math.ceil(imageObject.height / stageHeight);
}

function getCompletionPercentage (frame) {
	return (frame / totalFrames) * 100;
}

function tick (frame) {
	// Check for image flip
	if(frame % framesPerSlide == 0) flipActiveImage();

	// Loop
	if(loop && frame == totalFrames) {
		resetMovie();
	} else {
		setTimeout(function () {
			frame = frame || 0;

			var image = getImage(getIndex(frame));

			if(image && image.status == 'ready') {
				loadingElement.style.display = 'none';

			// console.log('Completed', getCompletionPercentage(frame) + '%');

			drawImage(image.src, frame, getImageContainer(true));

			doLookAhead(frame);

			tick(++frame);
		} else {
			tick(frame);
			loadingElement.style.display = 'block';
		}
	}, 1000 / frameRate);
	}
}

function doLookAhead (frame) {
	var index = getIndex(frame) + 1;
	var image = getImage(index);

	if(image && image.status == 'pristine') {
		loadImage(index, function () {
			// console.log(index, 'index');
			drawImage(getImage(index).src, 0, getImageContainer(false));
		});
	}
}