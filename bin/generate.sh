#!/bin/bash

set -o errexit

if [ $# -lt 5 ]
then 
	echo "Usage: ./generate.sh ../fiesta.m4v 24 ~/sites/temp 300x250 10x10"
else
	echo "Preparing target directory..."
	echo $3
	mkdir -p $3/{frames,final}
	
	echo "Converting movie to images..."
	ffmpeg -i $1 -r $2 -s $4 -qscale:v 1 -f image2 $3/frames/frame-%4d.jpg -loglevel panic

	cd $3

	echo "Creating montage..."
	montage frames/frame-*.jpg -geometry $4+0+0 -tile $5 final/source.jpg

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