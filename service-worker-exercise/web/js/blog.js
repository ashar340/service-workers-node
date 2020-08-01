(function Blog() {
	"use strict";

	var offlineIcon;
	var isOnline = ("onLine" in navigator) ? navigator.online : true;
	var isLoggedIn = /isLoggedIn=1/.test(document.cookie.toString() || "");
	var usingSW = ("serviceWorker" in navigator);
	var swReg;
	var svcworker;

	document.addEventListener("DOMContentLoaded", ready, false);

	initSerrviceWorker().catch(console.error);

	// **********************************

	function ready() {
		offlineIcon = document.getElementById("connectivity-status");

		if (!isOnline) {
			offlineIcon.classList.remove("hidden");
		}

		window.addEventListener("online", function online() {
			offlineIcon.classList.add("hidden");
			isOnline = true;
			sendStatusUpdate();
		});

		window.addEventListener("offline", function offline() {
			offlineIcon.classList.remove("hidden");
			isOnline = false;
			sendStatusUpdate();
		})
	}

	async function initSerrviceWorker() {
		swReg = await navigator.serviceWorker.register("/sw.js", {
			updateViaCache: "none"
		});

		svcworker = swReg.installing || swReg.waiting || swReg.active;

		navigator.serviceWorker.addEventListener("controllerchange", function onController() {
			svcworker = navigator.serviceWorker.controller;
			sendStatusUpdate(svcworker);
		});

		navigator.serviceWorker.addEventListener("message", onSWMessage);
	}

	function onSWMessage(evt) {
		var {
			data
		} = evt;
		if (data.reqStatusUpdate) {
			console.log("received status update req from sw");
			sendStatusUpdate(evt.ports && evt.ports[0]);
		}
	}

	function sendStatusUpdate(target) {
		sendSWMessage({
			statusUpdate: {
				isOnline,
				isLoggedIn
			}
		}, target);
	}

	function sendSWMessage(msg, target) {
		if (target) {
			target.postMessage(msg);
		} else if (svcworker) {
			svcworker.postMessage(msg);
		} else {
			navigator.serviceWorker.controller.postMessage(msg);
		}
	}

})();