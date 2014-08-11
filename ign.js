/**
 * Init scroll listener
 * @param  {[type]} e [description]
 * @return {[type]}   [description]
 */

(function () {
	var didScroll = false;
	var ad = document.querySelector('div.tapad-ad');
	

	window.addEventListener('scroll', function (e) {
		didScroll = true;
	});

	setInterval(function () {
		if(didScroll) {
			
			didScroll = false;
			
			var rect = ad.getBoundingClientRect();

			var bottom = (rect.height * 0.25);
			var top = window.innerHeight - (rect.height * 0.25);

			if(rect.bottom < bottom || rect.top > top) {
				// Out of bounds
				if(projector.state.started && projector.state.playing) projector.pause();
			} else {
				// In bounds
				if(!projector.state.started) {
					projector.startMovie();
				} else {
					projector.play();
				}
			}
		}
	}, 250);

})();