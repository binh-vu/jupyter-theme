import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

var extension = window.location.pathname.substring(window.location.pathname.lastIndexOf('.'));
// if (extension != '.ipynb2') {
	// create a container for react element
	var div = document.createElement('div');
	div.className = "pull-right";
	document.getElementById('header-container').append(div)

	// Render component
	ReactDOM.render(
	  <App />,
	  div
	);
// }