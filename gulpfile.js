var gulp = require('gulp');
var shell = require('gulp-shell');
var prompt = require('gulp-prompt');
var ejs = require('gulp-ejs');
var uglify = require('gulp-uglify');
var minify = require('gulp-minify-css');
var del = require('del');
var ffmpeg = require('fluent-ffmpeg');
var q = require('q');
var fs = require('fs');

var settings = {};
var framerate = 24;

function getMetadata(target) {
	var deferred = q.defer();

	ffmpeg.ffprobe(target, function(err, metadata) {
		deferred.resolve(metadata.streams[0]);
	});

	return deferred.promise;
}

gulp.task('prompt', function (cb) {
	gulp.src('')
		.pipe(prompt.prompt([
			{
				type: 'input'
				, name: 'source'
				, message: 'Source video file (required)'
			}
			, {
				type: 'input'
				, name: 'directory'
				, message: 'Target directory (required)'
			}
			, {
				type: 'input'
				, name: 'width'
				, message: 'Target width (default: 320)'
			}
			, { 
				type: 'input'
				, name: 'height'
				, message: 'Target Height (default: 180)'
			}
			, {
				type: 'input'
				, name: 'columns'
				, message: 'Number of columns (default: 8)'
			}
			, {
				type: 'input'
				, name: 'rows'
				, message: 'Number of rows (default: 6)'
			}
		], function (response) {
			if(!response.source) (cb (new Error('Source video is required')));
			if(!response.directory) (cb (new Error('Directory is required')));

			response.width = response.width || 320;
			response.height = response.height || 180;
			response.columns = response.columns || 8;
			response.rows = response.rows || 6;

			settings = response; // Store for other tasks
			settings.size = response.width + 'x' + response.height;
			settings.tile = response.columns + 'x' + response.rows;

			framerate = 24;
			cb();

			// getMetadata(settings.source).then(function (response) {
			// 	metadata = response;
			// 	// console.log(response);
			// 	framerate = metadata.nb_frames / metadata.duration;
			// 	cb();
			// });
		}));
});

gulp.task('convert', ['prompt'], function () {
	return gulp.src('', { read: false })
		.pipe(shell([
			'echo "Preparing target directory: ' + settings.directory + '"'
			, 'mkdir -p ' + settings.directory + '/{frames,final,audio,video}'

			, 'echo "Converting movie to iPhone friendly MP4..."'
			, 'ffmpeg -i ' + settings.source + ' -s ' + settings.size + ' -r ' + framerate + ' ' + settings.directory + '/video/compressed.mp4  -loglevel panic'

			, 'echo "Converting movie to images..."'
			// , 'ffmpeg -i ' + settings.source + ' -r ' + framerate + ' -s ' + settings.size + ' -qscale:v 1 -f image2 ' + settings.directory + '/frames/frame-%04d.jpg -loglevel panic'
			, 'ffmpeg -i ' + settings.directory + '/video/compressed.mp4' + ' -r ' + framerate + ' -s ' + settings.size + ' -qscale:v 1 -f image2 ' + settings.directory + '/frames/frame-%04d.jpg -loglevel panic'

			, 'echo "Converting movie to audio..."'
			, 'ffmpeg -i ' + settings.source + ' -ab 96k -ac 2 -ar 44100 -vn ' + settings.directory + '/audio/96-44.mp3 -loglevel panic'
			, 'ffmpeg -i ' + settings.source + ' -ab 48k -ac 2 -ar 44100 -vn ' + settings.directory + '/audio/48-44.mp3 -loglevel panic'

			, 'echo "Creating montages..."'
			, 'montage ' + settings.directory + '/frames/frame-*.jpg -tile ' + settings.tile + ' -geometry ' + settings.size + '+0+0 ' + settings.directory + '/final/source-%04d.jpg'

			, 'echo "Compressing montages..."'

			, 'echo "10% quality..."'
			, 'convert ' + settings.directory + '/final/source-*.jpg -quality 10 ' + settings.directory + '/final/10x100.jpg'

			, 'echo "25% quality..."'
			, 'convert ' + settings.directory + '/final/source-*.jpg -quality 25 ' + settings.directory + '/final/25x100.jpg'

			, 'echo "50% quality..."'
			, 'convert ' + settings.directory + '/final/source-*.jpg -quality 50 ' + settings.directory + '/final/50x100.jpg'

			, 'echo "75% quality..."'
			, 'convert ' + settings.directory + '/final/source-*.jpg -quality 75 ' + settings.directory + '/final/75x100.jpg'
		]))
});

gulp.task('cleanup', ['convert'], function (cb) {
	if(!settings.directory) throw new Error('Cleanup directory not defined');
	del([
		settings.directory + '/final/source-*.jpg'
		, settings.directory + '/frames'
	], { force: true }, cb);
});

gulp.task('uglify', ['convert'], function () {
	gulp.src('scripts/*.js')
		.pipe(uglify())
		.pipe(gulp.dest(settings.directory))
})

gulp.task('minify', ['convert'], function () {
	gulp.src('styles/*.css')
		.pipe(minify())
		.pipe(gulp.dest(settings.directory))
})

gulp.task('copy', ['convert'], function () {
	// Determine number of frames in video
	var frames = fs.readdirSync(settings.directory + '/frames');


	gulp.src('index.ejs')
		.pipe(ejs({
			columns: settings.columns,
			rows: settings.rows,
			framerate: framerate,
			frames: frames.length
		}))
		.pipe(gulp.dest(settings.directory))

	gulp.src(['images/*'])
		.pipe(gulp.dest(settings.directory + '/images'))
});

gulp.task('copy:source', ['convert'], function () {
	gulp.src(['styles/*.css', 'scripts/*.js'])
		.pipe(gulp.dest(settings.directory));
});

gulp.task('default', ['prompt', 'convert', 'copy', 'uglify', 'minify', 'cleanup']);

gulp.task('debug', ['prompt', 'convert', 'copy', 'copy:source']);