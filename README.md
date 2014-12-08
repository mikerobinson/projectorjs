Synopsis
--------
Convert a normal video into a streaming, sprite-based version using an HTML player.

Quick start
-----------
0. This assumes you have [gulp](https://www.npmjs.org/package/gulp) installed via nodejs's package manager, [npm](https://www.npmjs.org/).
1. Install `ffmpeg` with [Homebrew](http://brew.sh/). This is used to manipulate video files.

    bash$ brew install ffmpeg

2. Install `imagemagick` with Homebrew to get the `montage` program. This is used to create composite images from multiple distinct images.

    bash$ brew install imagemagick

3. Run `gulp` and fill in the interactive arguments.
4. Open index.html in your chosen target directory to view the video in flipbook mode. Click on the animated sound bars to unmute.
