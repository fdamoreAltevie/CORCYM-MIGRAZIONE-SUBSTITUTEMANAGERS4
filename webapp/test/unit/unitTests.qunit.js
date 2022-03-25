/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"substitutemanager_S4Hana/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
