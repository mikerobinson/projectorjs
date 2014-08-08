function Projector(el, options) {
	this.elements = {
		container: el,
		image1: null,
		image2: null,
		loading: null,
		rewind: null,
		pause: null,
		play: null
	}

	this.state = {
		playing: true,
		tickTimeout: null
	}

	this.settings = {
		frameRate: 24,
		framesPerSlide: 100,
		framesPerRow: 10,
		loop: true,
		showControls: true,
		width: 100,
		height: 100,
		eventPixel: '',
		events: [],
		images: []
	}
	this.settings = Projector.extend(options, this.settings);

	this.collection = [];
}

/**
 * Start the video
 */
Projector.prototype.init = function () {
	this.make();
	this.bindEvents();
	this.restartMovie();
};

/**
 * Prepare the DOM elements
 */
Projector.prototype.make = function () {
	// Map image collection
	for (var i = 0; i < this.settings.images.length; i++) {
		this.collection.push({
			src: this.settings.images[i],
			status: 'pristine'
		});
	}

	this.elements.container.style.background = 'red';

	// Init stage styles
	this.elements.container.style.height = this.settings.height + 'px';
	this.elements.container.style.width = this.settings.width + 'px';
	this.elements.container.style.overflow = 'hidden';
	this.elements.container.style.backgroundRepeat = 'no-repeat';

	// Inject top and bottom layer elements
	var div = document.createElement('div');
	div.style.backgroundRepeat = 'no-repeat';
	div.style.backgroundPosition = '0 0';
	div.style.position = 'relative';
	div.style.height = this.settings.height + 'px';
	div.style.width = this.settings.width + 'px';


	this.elements.image1 = this.elements.container.appendChild(div.cloneNode());
	this.elements.image2 = this.elements.container.appendChild(div.cloneNode());

	this.elements.image1.style.display = 'block';
	this.elements.image2.style.display = 'none';

	this.elements.image1.active = true;
};

/**
 * Bind all events
 */
Projector.prototype.bindEvents = function () {
	// Play
	if (this.elements.play) {
		this.elements.play.onclick = function () {
			this.state.playing = true;
			Projector.addClass(this.elements.container, 'playing');
			Projector.removeClass(this.elements.container, 'paused');
		}
	}

	// Pause
	if (this.elements.pause) {
		this.elements.pause.onclick = function () {
			this.state.playing = false;
			Projector.addClass(this.elements.container, 'paused');
			Projector.removeClass(this.elements.container, 'playing');
		}
	}

	// Rewind
	if (this.elements.rewind) {
		this.elements.rewind.onclick = function () {
			this.restartMovie();
			this.state.playing = true;
		}
	}
};

/**
 * Reset the movie and clean up any timeouts
 */
Projector.prototype.restartMovie = function () {
	var that = this;
	if (this.state.tickTimeout) clearTimeout(this.state.tickTimeout);

	for (var i = 0; i < this.collection.length; i++) {
		this.collection[i].status = 'pristine';
	}

	// this.loadImage(0, function () {
	// 	that.tick.prototype.apply()
	// });
	this.loadImage(0, function () {
		that.tick.apply(that)
	});
};

/**
 * Load an image from the collection
 * @param  {integer}   index    The image index in the collection 
 * @param  {Function} callback Callback when the image has loaded
 */
Projector.prototype.loadImage = function (index, callback) {
	var item = this.collection[index];

	if (item && item.status == 'pristine') {
		item.status = 'loading';

		var image = new Image();
		image.src = item.src;

		image.onload = function () {
			item.status = 'ready';
			if (callback) callback();
		}
	}
};

/**
 * Render an image to an element
 * @param  {string} image         The image source
 * @param  {integer} frame         The frame of the image to render
 * @param  {object} targetElement The elemen to render the image on
 */
Projector.prototype.drawImage = function (image, frame, targetElement) {
	targetElement.style.backgroundImage = 'url(' + image + ')';

	var localFrame = frame % this.settings.framesPerSlide; // frame on current image
	var row = Math.floor(localFrame / this.settings.framesPerRow);
	var column = localFrame % this.settings.framesPerRow;

	targetElement.style.backgroundPosition = '-' + (column * this.settings.width) + 'px -' + (row * this.settings.height) + 'px';
};

/**
 * Get the element currently rendering the image
 * @param  {Boolean} isActive Flag to request the inactive element
 * @return {object}           The active or inactive element
 */
Projector.prototype.getScreen = function (isActive) {
	return this.elements.image1.active == isActive ? this.elements.image1 : this.elements.image2;
};

/**
 * Calculates the current image index based on frame
 * @param  {integer} frame The frame to calculate index from
 */
Projector.prototype.getIndex = function (frame) {
	return Math.floor(frame / this.settings.framesPerSlide)
}

/**
 * Retrieve an image from the image collection
 * @param  {integer} index Collection index
 * @return {object}       The image
 */
Projector.prototype.getImage = function (index) {
	if(index >= this.collection.length) return null;
	return this.collection[index];
}

/**
 * Calculate the completion of the video in percent
 * @param  {integer} frame The frame to calculate percentage from
 * @return {number}       Percentage of video complete
 */
Projector.prototype.getCompletionPercentage = function (frame) {
	return (frame / this.settings.totalFrames) * 100;
};

/**
 * Hide the current image and render the backup.
 * I use two images because hiding and showing an element is more performant than swapping out images on the same element
 */
Projector.prototype.flipActiveImage = function () {
	var oneActive = this.elements.image1.active; // local variable, since we're about to change this.elements.image1.active

	this.elements.image1.active = !(oneActive);
	this.elements.image1.style.display = oneActive ? 'none' : 'block';

	this.elements.image2.active = oneActive;
	this.elements.image2.style.display = oneActive ? 'block' : 'none';
	
};

/**
 * Move the video forward or backward by a frame amount
 * @param  {integer} frame The frame to move to
 */
Projector.prototype.tick = function (frame) {
	// Check for image flip
	if (frame % this.settings.framesPerSlide == 0 && this.state.playing) this.flipActiveImage();

	// Loop
	if (this.settings.loop && frame > this.settings.totalFrames) {
		this.restartMovie();
	} else {
		var that = this;
		this.state.tickTimeout = setTimeout(function () {
			if (that.state.playing) {
				frame = frame || 0;

				var image = that.getImage(that.getIndex(frame));

				if (image && image.status == 'ready') {
					if(that.elements.loading) that.elements.loading.style.display = 'none';

					that.drawImage(image.src, frame, that.getScreen(true));

					that.doPixelTracking(frame);
					that.doLookAhead(frame);

					frame++;
				}

				that.tick(frame);
			} else {
				that.tick(frame);
				that.elements.loading.style.display = 'block';
			}
		}, 1000 / this.settings.frameRate);
	}
}

/**
 * Handle pixel tracking events for video completions
 * @param  {integer} frame The frame to calculate pixel events from
 */
Projector.prototype.doPixelTracking = function (frame) {
	var completion = this.getCompletionPercentage(frame);

	for (var i = 0; i < this.settings.events.length; i++) {
		if (completion >= this.settings.events[i].mark && !this.settings.events[i].src) {
			this.settings.events[i].src = this.settings.eventsrc.replace(':mark', this.settings.events[i].name);

			var pixelImage = new Image();
			//pixelImage.src = this.settings.events[i].src;
			pixelImage.src = 'htt://www.example.com/image.gif'; // temp
		}
	}
};

/**
 * Make sure the next image set is always preloaded
 * @param  {integer} frame The frame to calculate the current image from
 */
Projector.prototype.doLookAhead = function (frame) {
	var that = this;
	var index = this.getIndex(frame) + 1;
	var image = this.getImage(index);

	if (image && image.status == 'pristine') {
		this.loadImage(index, function () {
			that.drawImage(image.src, 0, that.getScreen(false));
		});
	}
};


/**
 * @param  {object|array} dest  object to extend to (copy properties to)
 * @param  {object|array} src   object to extend from (copy properties from)
 * @return {object|array}       dest object
 */
Projector.extend = function (dest, src) {
	var i, val;
	for (i in src) {
		if (!src.hasOwnProperty(i)) {
			continue;
		}
		if (typeof src[i] == "object") {
			dest[i] = Projector.extend(
				dest[i] || (src[i] instanceof Array ? [] : {}),
				src[i]
			);
		} else {
			if (dest[i] != undefined) {
				continue;
			}
			dest[i] = src[i];
		}
	}
	return dest;
};

Projector.addClass = function (element, className) {
	if (element.className.indexOf(className) < 0) element.className = (className + ' ') + element.className;
}

Projector.removeClass = function (element, className) {
	element.className = element.className.replace(className + ' ', '');
}