sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"sap/ui/model/json/JSONModel",
	"sap/f/FlexibleColumnLayoutSemanticHelper",
	"com/livanova/substitutemanager/model/models",
	"com/livanova/substitutemanager/controller/BaseController",
], function (UIComponent, Device, JSONModel, FlexibleColumnLayoutSemanticHelper, Models, Controller) {
	"use strict";

	return UIComponent.extend("com.livanova.substitutemanager.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);
			sap.ui.getCore().getConfiguration().setLanguage("en");
			// enable routing
			this.getRouter().initialize();
		},
		loadAll: function (context) {
			var groupId = "initialCall";
			var resourceBoundle = this.getModel("i18n").getResourceBundle();
			var oDatamodel = this.getModel("approversMgmtModel");
			// oDatamodel.setDefaultCountMode(false);
			// oDatamodel.setUseBatch(true);
			oDatamodel.setDeferredBatchGroups([groupId]);

			this.setEditInProgressModel();
			this.setViewModel(context);
			var oModel = new JSONModel();
			this.setModel(oModel);
			this.setSubstitutesModel(context);
			this.setApproversListModel(context);
			this.setActiveSubstituteModel(context);
			// this.setWorkflowModel();

			this.setSubstitutesEditModel();
			this.setSubstitutesAddModel();
			this.setDateFormat();
			
			// set the device model
			this.setModel(Models.createDeviceModel(), "device");
			var oRootPath = jQuery.sap.getModulePath("com.livanova.substitutemanager");
			var oImageModel = new sap.ui.model.json.JSONModel({
				path: oRootPath,
			});
			this.setModel(oImageModel, "rootPath");
			sap.ui.core.BusyIndicator.show();
			oDatamodel.submitChanges({
				"groupId": groupId,
				success: function () {
					var dateFormat = this.getModel("dateFormatModel").getData().DateFormat;
					if(dateFormat){
						var viewModel = this.getModel("viewModel").getData();
						viewModel.dateFormat = dateFormat;
						this.getModel("viewModel").refresh(true);
					}
			
					this._substitute = undefined;
					this.getRouter().navTo("master", {
						layout: "OneColumn"
					});
					sap.ui.core.BusyIndicator.hide();
				}.bind(this),
				error: function (e) {
					sap.ui.core.BusyIndicator.hide();
					Controller.prototype.comunicationError.apply(this, [e, resourceBoundle]);
				}.bind(this)
			});
		},
		setSubstitutesModel: function (context) {
			var oModel = Models.createSubstitutesModel(this, context);
			oModel.setSizeLimit(10000);
			this.setModel(oModel, "substitutesModel");
			/*var oModelActiveSub = new JSONModel();
			this.setModel(oModelActiveSub, "activeSubstituteModel");
			oModelActiveSub.setData(Object.assign([], oModel.getData()));*/
		},
		setDateFormat: function(context){
			var oModel = Models.setDateFormat(this, context);
			oModel.setSizeLimit(10000);
			this.setModel(oModel, "dateFormatModel");
		},
		setApproversListModel: function (context) {
			var oModel = Models.createApproversListModel(this, context);
			oModel.setSizeLimit(10000);
			this.setModel(oModel, "approversListModel");
		},
		setActiveSubstituteModel: function (context) {
			var oModel = Models.createActiveSubstituteModel(this, context);
			this.setModel(oModel, "activeSubstituteModel");
			oModel.setSizeLimit(10000);
		},
		setWorkflowModel: function () {
			var oModel = Models.createWorkflowModel(this);
			oModel.setSizeLimit(10000);
			this.setModel(oModel, "workflowModel");
		},
		setEditInProgressModel: function () {
			var oModel = Models.createEditInProgressModel();
			this.setModel(oModel, "editInProgressModel");
		},
		setViewModel: function (context) {
			var oModel = Models.createViewModel(context);
			this.setModel(oModel, "viewModel");
		},
		setSubstitutesEditModel: function () {
			var oModel = Models.createSubstitutesEditModel();
			this.setModel(oModel, "substitutesEditModel");
		},
		setSubstitutesAddModel: function () {
			var oModel = Models.createSubstitutesAddModel();
			this.setModel(oModel, "substitutesAddModel");
		},

		createContent: function () {
			return sap.ui.view({
				viewName: "com.livanova.substitutemanager.view.App",
				type: "XML"
			});
		},
		getHelper: function () {
			var oFCL = this.getRootControl().byId("fcl"),
				oParams = jQuery.sap.getUriParameters(),
				oSettings = {
					defaultTwoColumnLayoutType: sap.f.LayoutType.TwoColumnsMidExpanded,
					defaultThreeColumnLayoutType: sap.f.LayoutType.ThreeColumnsMidExpanded,
					mode: oParams.get("mode"),
					maxColumnsCount: oParams.get("max")
				};

			return FlexibleColumnLayoutSemanticHelper.getInstanceFor(oFCL, oSettings);
		}
	});
});