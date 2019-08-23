# The circles of reddit

## What is this

This is a simple webpage for viewing the top reddit posts for /r/programmerHumor. 

The user interface is very simple, each circle (up to 100) represents one reddit post.
Hover over the circle to see the title of the post and click on it to see the image and/or description. 

Keep in mind you can apply a force to the circles with the pointer so you better be quick. 

It is however scaled up a bit and they are quite slow, I think you can manage to use it as long as you have a mouse. 

## What is it made with

It uses comlink to move some computation out on a worker thread (I don't think it is any faster, but at least it is more complex to keep two copies of the state and transfer the difference). 
Three js for the graphics with a shader to provide colors and opacity to the lines between the circles. 
Lastly webpack with html-webpack-plugin to build and host to webpage. 

All html and css is defined in the js (as you probably could guess by the lack of style). 

## Install and run

* Clone the repo
* npm i
* npm run start:dev 

Should be all you need. 