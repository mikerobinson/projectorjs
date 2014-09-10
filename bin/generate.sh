#!/bin/bash

set -o errexit

if [ $# -lt 5 ]
then 
	echo "Usage: bin/generate.sh mustang.mp4 24 mustang 640x360 8x6"
else
	echo "Preparing target directory..."
	echo frames/$3$4
	mkdir -p frames/$3$4/{frames,final,audio,video}
	
	echo "Converting movie to iPhone friendly MP4..."
	#ffmpeg -i $1 -loglevel panic -c:v libx264 -crf 28 -preset veryslow -tune fastdecode -profile:v baseline -level 3.0 -movflags +faststart -c:a libfdk_aac -ac 2 -ar 44100 -ab 64k -threads 0 -f mp4 -s $4 $1$4.mp4
	#ffmpeg -i mustang.mp4 -loglevel panic -c:v libx264 -crf 28 -preset veryslow -tune fastdecode -profile:v baseline -level 3.0 -movflags +faststart -c:a libfdk_aac -ac 2 -ar 44100 -ab 64k -threads 0 -f mp4 -s 320x180 mustang320x180.mp4
	ffmpeg -i $1 -s $4 frames/$3$4/video/$3$4.mp4

	echo "Converting movie to images..."
	ffmpeg -i $1 -r $2 -s $4 -qscale:v 1 -f image2 frames/$3$4/frames/frame-%04d.jpg -loglevel panic

	echo "Converting movie to audio..."
	ffmpeg -i $1 -ab 96k -ac 2 -ar 44100 -vn frames/$3$4/audio/96-44.mp3 -loglevel panic
	ffmpeg -i $1 -ab 48k -ac 2 -ar 44100 -vn frames/$3$4/audio/48-44.mp3 -loglevel panic

	cd frames/$3$4

	echo "Creating montages..."
	montage frames/frame-*.jpg -geometry $4+0+0 -tile $5 final/source-%04d.jpg

	echo "Compressing montages..."

	echo "10% quality, half size..."
	convert final/source-*.jpg -quality 10 -resize 50% final/10x50.jpg

	echo "10% quality..."
	convert final/source-*.jpg -quality 10 final/10x100.jpg

	echo "25% quality..."
	convert final/source-*.jpg -quality 25 final/25x100.jpg

	echo "50% quality..."
	convert final/source-*.jpg -quality 50 final/50x100.jpg

	echo "75% quality..."
	convert final/source-*.jpg -quality 75 final/75x100.jpg

	# echo "100% quality..."
	# convert final/source-*.jpg final/100x100.jpg
fi