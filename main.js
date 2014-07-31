var element = document.querySelector('div.ad');
var loadingElement = document.querySelector('div.ad .loading');
var index = 0;


// Source files
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

function getImageFrameCount (imageObject) {
	return Math.ceil(imageObject.height / stageHeight);
}

function getCompletionPercentage (frame) {
	return (frame / totalFrames) * 100;
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

			console.log(getCompletionPercentage(frame) + '%');

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