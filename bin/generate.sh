#!/bin/bash

set -o errexit

if [ $# -lt 5 ]
then 
	echo "Usage: bin/generate.sh mustang.mp4 24 frames/mustang 640x360 8x6"
else
	echo "Preparing target directory..."
	echo $3
	mkdir -p $3/{frames,final,audio}
	
	echo "Converting movie to images..."
	ffmpeg -i $1 -r $2 -s $4 -qscale:v 1 -f image2 $3/frames/frame-%04d.jpg -loglevel panic

	echo "Converting movie to audio..."
	ffmpeg -i $1 -ab 96k -ac 2 -ar 44100 -vn $3/audio/96-44.mp3 -loglevel panic
	ffmpeg -i $1 -ab 48k -ac 2 -ar 44100 -vn $3/audio/48-44.mp3 -loglevel panic

	cd $3

	echo "Creating montages..."
	montage frames/frame-*.jpg -geometry $4+0+0 -tile $5 final/source-%04d.jpg

	echo "Compressing montages..."

	echo "10% quality..."
	convert final/source-*.jpg -quality 10 final/10.jpg

	echo "25% quality..."
	convert final/source-*.jpg -quality 25 final/25.jpg

	echo "50% quality..."
	convert final/source-*.jpg -quality 50 final/50.jpg

	echo "100% quality..."
	convert final/source-*.jpg final/100.jpg
fi