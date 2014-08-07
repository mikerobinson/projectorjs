var element = document.querySelector('div.ad');
var image1, image2, rewindEl, pauseEl, playEl;
var playing = true; 
var tickTimeout; 
var loadingElement = document.querySelector('div.ad .loading');

var pixelSrc = 'http://pixel.tapad.com/tap/pxl.png?ftap=1&ta_pinfo=${TA_PLACEMENT_INFO}&ta_action_id=:mark';
var pixels = [
	{ mark: 0, name: 'play' },
	{ mark: 25, name: 'mark25' },
	{ mark: 50, name: 'mark50' },
	{ mark: 75, name: 'mark75' },
	{ mark: 100, name: 'complete' }
]

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
bindEvents();
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
	div.style.backgroundPosition = '0 0';
	div.style.position = 'relative';
	div.style.height = stageHeight + 'px';
	div.style.width = stageWidth + 'px';


	image1 = element.appendChild(div.cloneNode());
	image2 = element.appendChild(div.cloneNode());

	image1.style.display = 'block';
	image2.style.display = 'none';

	var a = document.createElement('a');
	a.href = '#';
	a.style.position = 'absolute';
	a.style.bottom = '5px';
	a.style.background = 'rgba(0,0,0,0.5)';
	a.style.color = 'white';
	a.style.width = '20px';
	a.style.height = '20px';
	a.style.lineHeight = '20px';
	a.style.textAlign = 'center';
	a.style.textDecoration = 'none';
	a.style.fontSize = '14px';
	a.style.borderRadius = '4px';

	rewindEl = element.appendChild(a.cloneNode(true));
	rewindEl.className = 'rewind';
	rewindEl.style.left = '5px';
	rewindEl.innerHTML = '&laquo';

	pauseEl = element.appendChild(a.cloneNode(true));
	pauseEl.className = 'pause';
	pauseEl.style.left = '30px';
	pauseEl.innerHTML = '||';

	playEl = element.appendChild(a.cloneNode(true));
	playEl.className = 'play';
	playEl.style.left = '55px';
	playEl.innerHTML = '>';

	image1.active = true;
}

function bindEvents () {
	playEl.onclick = function () {
		playing = true;
		addClass('playing', element);
		removeClass('paused', element);
	};

	pauseEl.onclick = function () {
		playing = false;
		addClass('paused', element);
		removeClass('playing', element);
	}

	rewindEl.onclick = function () {
		resetMovie();
		playing = true;
	}
}

function addClass(className, element) {
	if(element.className.indexOf(className) < 0) element.className = (className + ' ') + element.className;
}

function removeClass(className, element) {
	element.className = element.className.replace(className + ' ', '');
}

function resetMovie() {
	// frame = 0;
	// element.innerHTML = '';
	
	// init();

	if(tickTimeout) clearTimeout(tickTimeout);
	
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
	if(frame % framesPerSlide == 0 && playing) flipActiveImage();

	// Loop
	if(loop && frame > totalFrames) {
		resetMovie();
	} else {
		tickTimeout = setTimeout(function () {
			if(playing) {
				frame = frame || 0;

				var image = getImage(getIndex(frame));

				if(image && image.status == 'ready') {
					loadingElement.style.display = 'none';

				

				drawImage(image.src, frame, getImageContainer(true));

				doPixelTracking(frame);
				doLookAhead(frame);

				frame++;
			}

			tick(frame);
		} else {
			tick(frame);
			loadingElement.style.display = 'block';
		}
	}, 1000 / frameRate);
	}
}

function doPixelTracking (frame) {
	// console.log('Completed', getCompletionPercentage(frame) + '%');

	var completion = getCompletionPercentage(frame);
	// console.log(completion);


	for(var i = 0; i < pixels.length; i++) {
		if(completion >= pixels[i].mark && !pixels[i].src) {
			pixels[i].src = pixelSrc.replace(':mark', pixels[i].name);
			
			var pixelImage = new Image();
			pixelImage.src = pixels[i].src;

			console.log(pixelImage.src);
		}
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