sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device",
	"substitutemanager/controller/BaseController"
], function (JSONModel, Device, Controller) {
	"use strict";

	return {
		createSubstitutesModel: function (component, context) {
			var oModel = new JSONModel();
			var resourceBoundle = component.getModel("i18n").getResourceBundle();
			component.getModel("approversMgmtModel").read("/SubstituteSet", {
				success: function (data) {
					context.fixDateVisualization(data.results);
					context.updateFilters(data.results);
					oModel.setData(data.results);
				}.bind(this),
				error: function (e) {
					Controller.prototype.comunicationError.apply(component, [e, resourceBoundle]);
				},
				groupId: "initialCall"
			});
			return oModel;
		},
		setDateFormat: function(component, context){
			var oModel = new JSONModel();
			var resourceBoundle = component.getModel("i18n").getResourceBundle();
			component.getModel("approversMgmtModel").read("/UserParametersSet", {
				success: function (data) {
					data.results[0].DateFormat = data.results[0].DateFormat.replace(/D/g, "d");
					if(!(data.results[0].DateFormat.includes("dd") && data.results[0].DateFormat.includes("MM") && data.results[0].DateFormat.includes("YYYY"))){
						data.results[0].DateFormat = "dd/MM/yyyy";
					}
					oModel.setData(data.results[0]);
				}.bind(this),
				error: function (e) {
					Controller.prototype.comunicationError.apply(component, [e, resourceBoundle]);
				},
				groupId: "initialCall"
			});
			return oModel;
		},
		createApproversListModel: function (component, context) {
			var oModel = new JSONModel();
			var resourceBoundle = component.getModel("i18n").getResourceBundle();
			component.getModel("approversMgmtModel").read("/PossibleSubstituteSet", {
				success: function (data) {
					context.fixDateVisualization(data.results);
					oModel.setData(data.results);
				}.bind(this),
				error: function (e) {
					Controller.prototype.comunicationError.apply(component, [e, resourceBoundle]);
				},
				groupId: "initialCall"
			});
			return oModel;
		},
		createWorkflowModel: function (component) {
			var oModel = new JSONModel();
			var resourceBoundle = component.getModel("i18n").getResourceBundle();
			/*component.getModel("approversMgmtModel").read("/WorkflowSet", {
				success: function (data) {
					oModel.setData(data.results);
				}.bind(this),
				error: function (e) {
					Controller.prototype.comunicationError.apply(component, [e, resourceBoundle]);
				},
				groupId: "initialCall"
			});*/
			return oModel;
		},
		createActiveSubstituteModel: function (component, context) {
			var oModel = new JSONModel();
			var resourceBoundle = component.getModel("i18n").getResourceBundle();
			component.getModel("approversMgmtModel").read("/SubstituteSet", {
				success: function (data) {
					// context.fixDateVisualization(data.results);
					oModel.setData(data.results);
				}.bind(this),
				error: function (e) {
					Controller.prototype.comunicationError.apply(component, [e, resourceBoundle]);
				},
				groupId: "initialCall"
			});
			return oModel;
		},
		createDeviceModel: function () {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},
		createEditInProgressModel: function () {
			var oModel = new JSONModel({
				value: false
			});
			return oModel;
		},
		createViewModel: function (context) {
			var today = new Date();
			var day = today.getDate();
			today.setHours(0, 0, 0, 0);
			// today.setDate(day);

			/*today.setMinutes(-today.getTimezoneOffset());
			
			var hours = Math.abs(today.getTimezoneOffset() / 60);
			today.setHours(hours, 0, 0, 0);*/

			var vModel = new JSONModel({
				editDetail: false,
				today: today,
				substitutesListView: true,
				controller: this,
				dateFormat: "dd/MM/yyyy",
				add: false,
				loadApprovers: true,
				filterInserted: false
			});
			return vModel;
		},
		createSubstitutesEditModel: function () {
			var oModel = new JSONModel({});
			return oModel;
		},
		createSubstitutesAddModel: function () {
			var today = new Date();
			var day = today.getDate();
			today.setHours(0, 0, 0, 0);
			// today.setDate(day);
			/*var hours = Math.abs(today.getTimezoneOffset() / 60);
			today.setHours(hours, 0, 0, 0);
			today.setMinutes(-today.getTimezoneOffset());
			today = today.toDateString();*/
			var oModel = new JSONModel({
				ValidFrom: today,
				ValidTo: today
			});
			return oModel;
		}

	};
});