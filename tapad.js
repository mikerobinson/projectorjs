/**
 * Init scroll listener
 * @param  {[type]} e [description]
 * @return {[type]}   [description]
 */

(function() {
	var pauseTolerance = 0.5;
	var didScroll = false;
	var didResize = false;
	var ads = document.querySelectorAll('.ad-tapad');

	window.addEventListener('scroll', function(e) {
		didScroll = true;
	});

	window.addEventListener('resize', function(e) {
		didResize = true;
	})

	setInterval(function() {
		if (didScroll) {

			didScroll = false;

			for (var i = 0; i < ads.length; i++) {
				var ad = ads[i];

				var rect = ad.getBoundingClientRect();
				var bottom = (rect.height * pauseTolerance);
				var top = window.innerHeight - (rect.height * pauseTolerance);

				if (rect.bottom < bottom || rect.top > top) {
					// Out of bounds
					ad.contentWindow.postMessage('pause', '*');
				} else {
					// In bounds
					ad.contentWindow.postMessage('play', '*');
				}
			}
		}
	}, 250);

})();