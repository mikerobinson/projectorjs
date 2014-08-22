/**
 * Init scroll listener
 * @param  {[type]} e [description]
 * @return {[type]}   [description]
 */

(function() {
	var didScroll = false;
	var ads = document.querySelectorAll('.ad-tapad');

	window.addEventListener('scroll', function(e) {
		didScroll = true;
	});

	setInterval(function() {
		if (didScroll) {

			didScroll = false;

			for (var i = 0; i < ads.length; i++) {
				var ad = ads[i];

				var rect = ad.getBoundingClientRect();
				var bottom = (rect.height * 0.25);
				var top = window.innerHeight - (rect.height * 0.25);

				if (rect.bottom < bottom || rect.top > top) {
					// Out of bounds
					console.log(ad);
					ad.contentWindow.postMessage('pause', '*');
				} else {
					// In bounds
					ad.contentWindow.postMessage('play', '*');
				}
			}
		}
	}, 250);

})();