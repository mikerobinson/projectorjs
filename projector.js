/**
 * Created by Mike Robinson 
 * https://github.com/mikerobinson
 * mike.robinson at gmail
 */

function Projector(el, options) {
	this.elements = {
		container: el,
		image1: null,
		image2: null,
		loading: null,
		link: null,
		movie: null,
		rewind: null,
		pause: null,
		play: null
	}

	this.state = {
		audio: false,
		locked: false,
		movie: false,
		muted: false,
		quality: 0,
		started: false,
		playing: true,
		movieStatus: 'buffering', // buffering, ready
		controlStatus: 'autoplay', // autoplay, autopause, playing, paused
		tickTimeout: null,
		inFocus: true, 
		frame: 0,
		loadTimes: []
	}

	this.settings = {
		autoplay: true,
		frameRate: 24,
		columns: 10,
		rows: 10,
		loop: true,
		controls: true,
		width: 100,
		height: 100,
		eventPixel: '',
		events: [],
		lookAhead: 3,
		movieUrl: '',
		clickUrl: '',
		quality: 3,
		qualities: ['10x100', '25x100', '50x100', '75x100'],
		dynamicQuality: true,
		maxQuality: 4,
		social: {
			facebook: '',
			youtube: '',
			twitter: ''
		}

	}
	this.settings = Projector.extend(options, this.settings);

	// Account for 0 index
	this.settings.totalFrames--;

	this.collection = [];
}

/**
 * Start the video
 */
Projector.prototype.init = function () {
	this.make();
	this.bindEvents();
	if (this.settings.autoplay) this.startMovie();
};

/**
 * Prepare the DOM elements
 */
Projector.prototype.make = function () {
	// Calculate durations
	this.state.framesPerSlide = this.settings.columns * this.settings.rows;
	this.state.timePerSlide = ((this.settings.columns * this.settings.rows) / this.settings.frameRate) * 1000; // milliseconds
	this.state.totalImages = Math.ceil(this.settings.totalFrames / this.state.framesPerSlide);

	// console.table({
	// 	state: this.state
	// });

	// Transfer quality settings to state because it may be variable instead of fixed
	this.state.quality = this.settings.quality;

	// Map image collection
	for (var i = 0; i < this.state.totalImages; i++) {
		this.collection.push({
			status: 'pristine'
		});
	}

	// Init stage styles
	this.elements.container.style.height = this.settings.height + 'px';
	this.elements.container.style.width = this.settings.width + 'px';
	this.elements.container.style.overflow = 'hidden';
	this.elements.container.style.position = 'relative';
	this.elements.container.style.backgroundRepeat = 'no-repeat';

	// Init top and bottom layer elements
	var div = document.createElement('div');
	div.style.backgroundRepeat = 'no-repeat';
	div.style.backgroundPosition = '0 0';
	div.style.backgroundSize = (this.settings.columns * this.settings.width) + 'px ' + (this.settings.rows * this.settings.height) + 'px';
	div.style.position = 'relative';
	div.style.height = this.settings.height + 'px';
	div.style.width = this.settings.width + 'px';

	// this.elements.image = this.elements.container.appendChild(div.cloneNode());
	// this.elements.image.style.display = 'block';
	// this.elements.image.className = 'image1';

	this.elements.canvas = this.elements.container.appendChild(document.createElement('canvas'));
	this.elements.canvas.style.height = this.settings.height + 'px';
	this.elements.canvas.style.width = this.settings.width + 'px';
	this.elements.canvas.className = 'canvas';


	// Loading spinner
	var loading = document.createElement('div');
	loading.className = 'loading';
	this.elements.loading = this.elements.container.appendChild(loading);

	// Init controls
	if (this.settings.controls) {
		var control = document.createElement('a');

		this.elements.rewind = this.elements.container.appendChild(control.cloneNode(true))
		this.elements.rewind.className = 'rewind';

		this.elements.pause = this.elements.container.appendChild(control.cloneNode(true))
		this.elements.pause.className = 'pause';

		this.elements.play = this.elements.container.appendChild(control.cloneNode(true))
		this.elements.play.className = 'play';

		this.elements.mute = this.elements.container.appendChild(control.cloneNode(true));
		this.elements.mute.className = 'mute mute-off';
		this.elements.mute.style.display = 'none';

		var div = document.createElement('div');
		this.elements.equalizer = this.elements.container.appendChild(div.cloneNode(true));

		this.elements.equalizer.className = 'bars';
		for(var i = 0; i < 10; i++) {
			var bar = this.elements.equalizer.appendChild(div.cloneNode(true));
			bar.className = 'bar';
		}

		// Create the full screen element
		if(this.settings.movieUrl) {
			this.elements.fullscreen = this.elements.container.appendChild(control.cloneNode(true));
			this.elements.fullscreen.className = 'fullscreen';
			this.elements.fullscreen.target = "_blank";
			this.elements.fullscreen.href = this.settings.movieUrl;
		}
	}


	// Init click through link
	// Rendered on top of everything except video controls
	var link = document.createElement('a');
	link.href = (this.settings.clickUrl) ? this.settings.clickUrl : '#';
	link.target = '_blank';
	link.className = 'link';
	link.style.cssText = 'position: absolute; left: 0; right: 0; top: 0; bottom: 0; z-index: 9';
	this.elements.link = this.elements.container.appendChild(link);

	// Render the real video element
	if (this.settings.movieUrl) {
		var video = document.createElement('video');
		video.autoplay = false;
		video.preload = false;
		// video.src = this.settings.movieUrl;
		video.style.width = this.settings.width + 'px';
		video.style.height = this.settings.height + 'px';
		video.style.zIndex = -1;
		video.controls = false; // override video controls with javascript ones
		this.elements.container.appendChild(video);

		// this.elements.movie.src = this.settings.movieUrl; // Set src afer append or else it loads twice
	}

	// Create the audio element
	this.elements.audio = new Audio();
	this.elements.audio.muted = this.state.muted;
	this.elements.audio.src = this.settings.audioUrl;
	this.elements.audio.preload = true;

	// Create social elements
	var socialLink = document.createElement('a');
	this.elements.socials = this.elements.container.appendChild(document.createElement('div'));
	this.elements.socials.className = 'socials';

	socialLink.target = '_blank';
	if(this.settings.social.youtube) {
		this.elements.youtube = this.elements.socials.appendChild(socialLink.cloneNode(true));
		this.elements.youtube.className = 'social youtube';
		this.elements.youtube.href = this.settings.social.youtube;
	}

	if(this.settings.social.facebook) {
		this.elements.facebook = this.elements.socials.appendChild(socialLink.cloneNode(true));
		this.elements.facebook.className = 'social facebook';
		this.elements.facebook.href = this.settings.social.facebook;
	}

};

/**
 * Bind all events
 */
Projector.prototype.bindEvents = function () {
	var that = this;

	// Play
	if (this.elements.play) this.elements.play.onclick = function () {
		that.play.call(that, true);
	}

	// Pause
	if (this.elements.pause) this.elements.pause.onclick = function () {
		that.state.playing ? that.pause.call(that, true) : that.play.call(that, true);
	}

	// Rewind
	if (this.elements.rewind) this.elements.rewind.onclick = function () {
		that.rewind.call(that, true);
	}

	// Mute
	if (this.elements.mute) this.elements.mute.onclick = function () {
		that.mute.call(that);
	}

	// Click
	if (this.elements.link) this.elements.link.onclick = function (e) {
		that.handleClick.call(that, e);
	}

	// Equalizer
	if (this.elements.equalizer) this.elements.equalizer.onclick = function (e) {
		that.handleEqualizerClick.call(that, e);
	}

	// Window messages (for iframe communication)
	window.addEventListener('message', function (e) {
		that.handleMessage.call(that, e);
	}, false);

	window.addEventListener('focus', function (e) {
		that.play.call(that);
	});

	window.addEventListener('blur', function (e) {
		that.pause.call(that);
	});
};

/**
 * Play the movie
 */
Projector.prototype.play = function (unlock) {
	// console.log('unlock', unlock);

	if(!this.state.locked || unlock) {
		if(typeof unlock != 'undefined') this.state.locked = !unlock;

		if (!this.state.started) {
			this.startMovie();
		} else {
			this.state.playing = true;

			Projector.addClass(this.elements.container, 'playing');
			Projector.removeClass(this.elements.container, 'paused');

			// Resume 
			this.tick(this.state.frame);

			// Play movie
			if (this.state.movie) this.elements.movie.play();

			// Play audio
			if (this.state.audio) this.elements.audio.play();
		}	
	}
};

/**
 * Pause the movie
 */
Projector.prototype.pause = function (lock) {
	this.state.playing = false;

	this.state.controlStatus = (lock) ? 'paused' : 'autopause';
	
	if(lock) this.state.locked = true; // User pause, cannot override unless user hits play
	
	Projector.addClass(this.elements.container, 'paused');
	Projector.removeClass(this.elements.container, 'playing');

	// Stop loop
	clearTimeout(this.state.tickTimeout);

	// Pause movie
	if (this.state.movie) this.elements.movie.pause();

	// Pause audio
	if (this.state.audio) this.elements.audio.pause();
};

/**
 * Rewind the ad
 * @param  {boolean} play Start the movie
 */
Projector.prototype.rewind = function (play) {
	this.startMovie();
	if(play) this.play(play);

	this.state.frame = 0;
	this.synchAudio(0, true);
};

/**
 * Toggle mute on the real movie
 */
Projector.prototype.mute = function () {
	this.state.muted = !this.state.muted;

	if (this.state.movie || this.state.audio) {
		// this.elements.movie.muted = this.state.muted;
		this.elements.audio.muted = this.state.muted;

		this.elements.mute.style.backgroundImage = (this.state.muted) ? 'url(images/mute-on.png)' : 'url(images/mute-off.png)';

		Projector.toggleClass(this.elements.mute, 'mute-on', this.state.muted);
		Projector.toggleClass(this.elements.mute, 'mute-off', !this.state.muted);
	}
};

/**
 * Reset the movie and clean up any timeouts
 */
Projector.prototype.startMovie = function () {
	var that = this;

	this.state.started = true;
	this.state.frame = 0;
	this.showLoading();
	this.state.loadTimes = [];

	if (this.state.tickTimeout) clearTimeout(this.state.tickTimeout);

	for (var i = 0; i < this.collection.length; i++) {
		this.collection[i].status = 'pristine';
	}

	this.loadImage(0, function () {
		that.play.call(that);
		// that.tick.call(that);
	});
};

/**
 * Handle messages posted to the window. Useful when projector is served in an iframe and needs to be controlled via the parent window.
 */
Projector.prototype.handleMessage = function (event) {
	switch(event.data) {
		case "pause":
			this.pause();
			break;
		case "play":
			this.play();
			break;
	}
};

/**
 * Handle user interaction with base container, typically for the clickthrough
 * Currently handles playing the real movie on click instead of clicking through
 */
Projector.prototype.handleClick = function (e) {
	// Since the ad spawns a new tab, pause the playing movie
	if(Projector.isMobileSafari()) {
		// iOS doesn't properly support media elements, just flip to the movie
		e.preventDefault();
		this.playRealMovie();
	} else {
		if(!this.state.audio) {
			e.preventDefault();
			this.playAudio(true);
		}
	}
};

/**
 * Handle equalizer being click, which enables the audio
 * @param  {object} e Event object
 */
Projector.prototype.handleEqualizerClick = function(e) {
	e.preventDefault();

	if(Projector.isMobileSafari()) {
		// iOS doesn't properly support media elements, just flip to the movie
		this.playRealMovie();
	} else {
		this.playAudio();		
	}
};

/**
 * Swaps out the looping images for a traditional movie element
 */
Projector.prototype.playRealMovie = function () {
	var that = this;

	if(Projector.isMobileSafari()) {
		window.open(this.settings.movieUrl);
	} else {
		// Hide looping images
		this.elements.image1.style.display = 'none';
		this.elements.image2.style.display = 'none';

		// Enable mute button
		this.elements.mute.style.display = 'block';

		// Play real movie
		this.elements.movie.style.zIndex = 1;
		this.elements.movie.play();

		this.state.movie = true;	
	}
};

/**
 * Enable audio with looping images
 */
Projector.prototype.playAudio = function () {
	var that = this;

	// Play sound
	this.elements.audio.play();


	if(this.elements.audio.readyState == 4) {
		// Force synch audio
		this.synchAudio(this.state.frame, true); 

		// Enable mute button & hide equalizer
		this.elements.mute.style.display = 'block';
		this.elements.equalizer.style.display = 'none';

		this.state.audio = true;
	} else {
		this.elements.audio.addEventListener('canplaythrough', function () {
			that.playAudio.call(that);
		});
	}
};

/**
 * Load an image from the collection
 * @param  {integer}   index    The image index in the collection
 * @param  {Function} callback Callback when the image has loaded
 */
Projector.prototype.loadImage = function (index, callback) {
	// console.log('Load image', index);

	var that = this;
	var item = this.collection[index];

	if (item && item.status == 'pristine') {
		item.status = 'loading';

		// Upgrade / Downgrade image quality based on bandwidth
		if (this.settings.dynamicQuality) this.doQualityCheck();

		// Generate image source from index and current quality		
		var src = this.settings.imageFiles
		src = src.replace('%q', this.settings.qualities[this.state.quality]);
		src = src.replace('%i', index);

		// TESTING, REMOVE IN PROD
		src = src + '?ord=' + Math.random().toString().substr(2); // Cachebuster, for debugging

		item.src = src;

		// Start measuring image load time
		var loadTime = new Date().valueOf();

		// Request image
		var image = new Image();
		image.src = src;

		image.onload = function () {
			// Perform load time calculations
			that.state.loadTimes.push(new Date().valueOf() - loadTime); // Finish measuring image load time

			// console.log('Image ' + index + ' loaded', 'Current index: ' + that.getIndex(that.state.frame || 0), item.src, callback);

			// Move on
			item.status = 'ready';
			item.image = image;

			if (callback) callback();
		}
	} else if (item && item.status == 'ready') {
		if (callback) callback();
	}
};

/**
 * Render an image to an element
 * @param  {string} image         The image source
 * @param  {integer} frame         The frame of the image to render
 */
Projector.prototype.drawImage = function (image, frame) {
	var localFrame = frame % this.state.framesPerSlide; // frame on current image
	var row = Math.floor(localFrame / this.settings.columns);
	var column = localFrame % this.settings.columns;

	var ctx = this.elements.canvas.getContext('2d');
	var index = this.getIndex(frame);
	var image = this.getImage(index);

	ctx.drawImage(
		image.image, 					// Image
		(column * this.settings.width), // sx 		The x coordinate where to start clipping
		(row * this.settings.height), 	// sy 		The y coordinate where to start clipping
		this.settings.width, 			// swidth 	The width of the clipped image
		this.settings.height,			// sheight	The height of the clipped image
		0,								// x		The x coordinate where to place the image on the canvas
		0,								// y 		The y coordinate where to place the image on the canva
		this.settings.width,			// width
		this.settings.height			// height
	);
};

/**
 * Get the element currently rendering the image
 * @param  {Boolean} isActive Flag to request the inactive element
 * @return {object}           The active or inactive element
 */
Projector.prototype.getScreen = function (isActive) {
	// return this.elements.image;
	return this.elements.canvas;
};

/**
 * Calculates the current image index based on frame
 * @param  {integer} frame The frame to calculate index from
 */
Projector.prototype.getIndex = function (frame) {
	return Math.floor(frame / this.state.framesPerSlide)
}

/**
 * Retrieve an image from the image collection
 * @param  {integer} index Collection index
 * @return {object}       The image
 */
Projector.prototype.getImage = function (index) {
	if (index >= this.collection.length) return null;
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
 * Calculate average load time percentage based on last three images
 * @return {number} Average load time
 */
Projector.prototype.getLoadTimePercentage = function () {
	if (!this.state.loadTimes.length) return NaN;

	// var times = this.state.loadTimes.slice(-3); // Get last 3 or less times
	// var totalTime = 0;

	// for(var i = 0; i < times.length; i++) {
	// 	totalTime += times[i];
	// }


	var totalTime = this.state.loadTimes.slice(-1)[0]; // Simplify, just grab the last load time;
	var percent = (totalTime / this.state.timePerSlide) * 100;

	return percent;
};

/**
 * Perform a tick operation. Check the status of things to see what should move where.
 * @param  {integer} frame The frame to move to
 */
Projector.prototype.tick = function (frame) {
	frame = frame || 0;
	var that = this;

	// console.log('tick', frame);

	// Loop
	if (this.settings.loop && frame > this.settings.totalFrames) {
		console.log('loop');
		return this.startMovie();
	}

	// Handle buffering & ready
	this.state.tickTimeout = setTimeout(function () {
		// Determine movie status
		var index = that.getIndex.call(that, frame);
		var image = that.getImage.call(that, index);

		switch(image.status) {
			case 'ready':
				that.hideLoading.call(that);
				if (that.state.audio && that.elements.audio.paused) that.elements.audio.play();
				that.renderFrame.call(that, frame);
				frame++;

				that.tick.call(that, frame);
				break;
			case 'pristine':
			case 'loading':
				that.showLoading.call(that);
				if (that.state.audio && !that.elements.audio.paused) that.elements.audio.pause();

				that.tick.call(that, frame);
				break;
		}
	}, 1000 / this.settings.frameRate);
}

/**
 * Render a specific frame in the movie
 * @param  {integer} frame
 */
Projector.prototype.renderFrame = function(frame) {
	// console.log(frame, Math.random() * 10);

	// Check for image flip
	// if (frame % this.state.framesPerSlide == 0 && this.state.playing) this.flipActiveImage();

	// Get the image
	var image = this.getImage(this.getIndex(frame));

	// Move the image
	this.drawImage(image.src, frame);

	// Track the completion rate
	this.doPixelTracking(frame);

	// Preload next image
	this.doLookAhead(frame);

	// Check the audio
	if (this.state.audio && this.elements.audio.paused) this.elements.audio.play();

	// Synch the audio
	if (this.state.audio && frame % this.settings.frameRate == 0) {
		this.synchAudio(frame, false);
	}

	// Keep track of current frame
	this.state.frame = frame;
};

/**
 * Handle pixel tracking events for video completions
 * @param  {integer} frame The frame to calculate pixel events from
 */
Projector.prototype.doPixelTracking = function (frame) {
	var completion = this.getCompletionPercentage(frame);

	for (var i = 0; i < this.settings.events.length; i++) {
		if (completion >= this.settings.events[i].mark && !this.settings.events[i].src) {
			// Bind pixel src to event so we can check if we've already requested it later
			this.settings.events[i].src = this.settings.eventSrc.replace(':mark', this.settings.events[i].name);

			var pixelImage = new Image();
			pixelImage.src = this.settings.events[i].src;
		}
	}
};

/**
 * Make sure the next image sets are always preloaded
 * @param  {integer} frame The frame to calculate the current image from
 */
Projector.prototype.doLookAhead = function (frame) {
	var that = this;
	var index = this.getIndex(frame) + 1;

	// Prep next set of images
	for(var i = 0; i < 3; i++) {
		var image = this.getImage(index + i);
		
		if(image && image.status == 'pristine') {
			this.loadImage(index + i);
			break;
		}
	}
};

/**
 * Raise or lower the quality based on bandwidth availability
 */
Projector.prototype.doQualityCheck = function () {
	var loadPercentage = this.getLoadTimePercentage();

	// console.log('Load time percent', loadPercentage);

	// Increase quality
	if (loadPercentage <= 50 && this.state.quality < this.settings.qualities.length - 1) this.state.quality++;

	// Decrease quality
	if (loadPercentage > 100 && this.state.quality > 0) this.state.quality--; // Bad
	if (loadPercentage > 150 && this.state.quality > 0) this.state.quality--; // Really bad
	if (loadPercentage > 200 && this.state.quality > 0) this.state.quality--; // Atrocious

	if(this.state.quality > this.settings.maxQuality) this.state.quality = this.settings.maxQuality;

	// console.log('Quality', this.settings.qualities[this.state.quality]);
};

/**
 * Synch up the audio with the framerate
 * When the audio is behind, speed it up.
 * When the audio is ahead, slow it down.
 * @param  {integer} frame [description]
 */
Projector.prototype.synchAudio = function (frame, force) {
	// Force synch audio, which causes a stutter if you do it all the time
	if (force) {
		this.elements.audio.currentTime = frame / this.settings.frameRate;
	}

	var audioFrame = this.elements.audio.currentTime * this.settings.frameRate;

	if (audioFrame > frame) {
		this.elements.audio.playbackRate = 0.97;
	} else if (audioFrame < frame) {
		this.elements.audio.playbackRate = 1.03;
	} else {
		this.elements.audio.playbackRate = 1;
	}

	// console.log('audio rate', this.elements.audio.playbackRate);
};

/**
 * Show and animate the loading spinner
 */
Projector.prototype.showLoading = function () {
	if (this.state.loadingInterval) return; // Don't allow more than one
	
	var that = this;
	var counter = 0;

	this.elements.loading.style.display = 'block';

	this.state.loadingInterval = setInterval(function () {
		var frames = 19;
		var frameWidth = 38;
		var offset = counter * -frameWidth;
		that.elements.loading.style.backgroundPosition = '0px ' + offset + 'px';
		counter++;
		if (counter >= frames) counter = 0;
	}, 50);
};

/**
 * Hide the loading spinner
 */
Projector.prototype.hideLoading = function () {
	if (!this.state.loadingInterval) return;

	clearInterval(this.state.loadingInterval);
	this.state.loadingInterval = null; // clearInterval doesn't make the value falsy, so we force it
	this.elements.loading.style.display = 'none';
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

/**
 * Add CSS class to element
 * @param {object} element   The element to add a class to
 * @param {string} className The class to add
 */
Projector.addClass = function (element, className) {
	if (element.className.indexOf(className) < 0) element.className = (className + ' ') + element.className;
}

/**
 * Remove CSS class from element
 * @param {object} element   The element to remove a class from
 * @param {string} className The class to remove
 */
Projector.removeClass = function (element, className) {
	element.className = element.className.replace(className + ' ', '');
}

/**
 * Toggle a CSS class on an element
 * @param  {object} element   The element to toggle a class on
 * @param  {string} className The class to toggle
 * @param  {boolean} on        Whether to add or remove the class
 */
Projector.toggleClass = function (element, className, on) {
	if (on) {
		Projector.addClass(element, className);
	} else {
		Projector.removeClass(element, className);
	}
}

/**
 * Detect mobile safari, which does not allow media elements to play in site
 * @return {Boolean}
 */
Projector.isMobileSafari = function() {
	var iOS = /(iPhone|iPod|iPad)/g.test( navigator.userAgent );
	return iOS;
};