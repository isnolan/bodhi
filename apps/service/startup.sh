#!/bin/sh

Xvfb :10 -screen 0 1920x1080x16 & 

node main.js