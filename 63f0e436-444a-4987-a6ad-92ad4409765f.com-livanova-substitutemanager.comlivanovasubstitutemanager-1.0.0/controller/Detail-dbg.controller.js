sap.ui.define([
	'jquery.sap.global',
	"sap/ui/model/json/JSONModel",
	"./BaseController",
	"com/livanova/substitutemanager/CustomControls/WorkflowListControl",
	"sap/ui/core/Fragment",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (jQuery, JSONModel, Controller, WorkflowListControl, Fragment, Filter, FilterOperator) {
	"use strict";

	return Controller.extend("com.livanova.substitutemanager.controller.Detail", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.livanova.substitutemanager.view.Detail
		 */
		onInit: function () {

			this.oRouter = this.getOwnerComponent().getRouter();
			this.oModel = this.getOwnerComponent().getModel();

			this.oRouter.getRoute("detail").attachPatternMatched(this.onDataMatched, this);
		},
		onSaveSuccess: function () {
			this.refreshEditModel();
			this.getModel("viewModel").setProperty("/editDetail", false);
			this.changeEditInProgress();
			sap.ui.core.BusyIndicator.hide();
			this.comunicationSuccess();
		},
		onSaveError: function () {
			this.refreshEditModel();
			this.getModel("viewModel").setProperty("/editDetail", false);
			this.changeEditInProgress();
			sap.ui.core.BusyIndicator.hide();
			this.comunicationError();
		},

		loadSubstitutesModel: function (onSuccess, onError, results, groupId) {
			var dateChanged = this.getModel("viewModel") ? this.getModel("viewModel").getProperty("/dateChanged") : undefined;
			if (dateChanged) {
				var startDate = this.getModel("viewModel").getProperty("/startDateSubList");
				var endDate = this.getModel("viewModel").getProperty("/endDateSubList");
				var filters = [];
				filters.push(new Filter("ValidFrom", FilterOperator.EQ, this.fixDate(startDate)));
				filters.push(new Filter("ValidTo", FilterOperator.EQ, this.fixDate(endDate)));
			}
			this.getModel("approversMgmtModel").read("/SubstituteSet", {
				filters: filters,
				success: function (data) {
					this.fixDateVisualization(data.results);
					this.updateFilters(data.results);
					this.getModel("substitutesModel").setData(data.results);
					this.getModel("substitutesModel").refresh(true);

					this.getModel("activeSubstituteModel").setData(Object.assign([], data.results));
					this.getModel("activeSubstituteModel").refresh(true);
					var path = data.results.findIndex(function (el) {
						return el.Id === results.Id && results.ValidFrom >= el.ValidFrom && results.ValidTo <= el.ValidTo;
					});

					if (path >= 0) {
						this._substitute = path;
						var oNextUIState = this.getOwnerComponent().getHelper().getNextUIState(1);
						this.oRouter.navTo("detail", {
							layout: oNextUIState.layout,
							substitute: this._substitute
						});
					}
					onSuccess();

				}.bind(this),
				error: function (e) {
					onError();
				}.bind(this),
				groupId: groupId
			});
		},
		adjustChanges: function (data, newData) {
			var saveData = [];
			var newDate;
			if (data.ValidFrom !== newData.ValidFrom) {
				var tmp = {};
				tmp.Id = data.Id;
				tmp.Name = data.Name;
				if (newData.ValidFrom > data.ValidFrom) {
					tmp.ValidFrom = data.ValidFrom;
					newDate = new Date(newData.ValidFrom);
					newDate.setDate(newDate.getDate() - 1);
					tmp.ValidTo = newDate;
					tmp.Active = false; //delete
				} else {
					tmp.ValidFrom = newData.ValidFrom;
					newDate = new Date(data.ValidFrom);
					newDate.setDate(newDate.getDate() - 1);
					tmp.ValidTo = newDate;
					tmp.Active = true; //create
				}
				//fix date utc
				tmp.ValidFrom = this.fixDate(tmp.ValidFrom);
				tmp.ValidTo = this.fixDate(tmp.ValidTo);
				saveData.push(tmp);
			}
			if (data.ValidTo !== newData.ValidTo) {
				var tmp1 = {};
				tmp1.Id = data.Id;
				tmp1.Name = data.Name;
				if (newData.ValidTo > data.ValidTo) {
					newDate = new Date(data.ValidTo);
					newDate.setDate(newDate.getDate() + 1);
					tmp1.ValidFrom = newDate;
					tmp1.ValidTo = newData.ValidTo;
					tmp1.Active = true; //create
				} else {
					newDate = new Date(newData.ValidTo);
					newDate.setDate(newDate.getDate() + 1);
					tmp1.ValidFrom = newDate;
					tmp1.ValidTo = data.ValidTo;
					tmp1.Active = false; //delete
				}
				//fix date utc
				tmp1.ValidFrom = this.fixDate(tmp1.ValidFrom);
				tmp1.ValidTo = this.fixDate(tmp1.ValidTo);
				saveData.push(tmp1);
			}

			return saveData;
		},

		handleFullScreen: function () {
			var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/fullScreen");
			this.oRouter.navTo("detail", {
				layout: sNextLayout,
				substitute: this._substitute
			});
		},
		handleExitFullScreen: function () {
			var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/exitFullScreen");
			this.oRouter.navTo("detail", {
				layout: sNextLayout,
				substitute: this._substitute
			});
		},
		handleClose: function (checkEdit) {
			var addMode = this.getModel("viewModel").getProperty("/add");
			if (addMode) {
				function confirmFunction() {
					this.getModel("viewModel").setProperty("/add", false);
					this.changeEditInProgress();
					var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/closeColumn");
					this.oRouter.navTo("master", {
						layout: sNextLayout
					});
				};
				this.confirmUndo(confirmFunction.bind(this));

			} else {
				if (checkEdit) {
					this.checkEditInProgress();
				}
				var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/closeColumn");
				this.oRouter.navTo("master", {
					layout: sNextLayout
				});
			}

		},
		onDataMatched: function (oEvent) {
			this._substitute = oEvent.getParameter("arguments").substitute || this._substitute || "0";
			this.refreshEditModel();
			if (!this.getModel("viewModel").getProperty("/add")) {
				this.getView().bindElement({
					path: "/" + this._substitute,
					model: "substitutesModel"
				});
				var selectedApprover = this.getModel("substitutesModel").getProperty("/" + this._substitute);

				var customControl = new WorkflowListControl({
					approverData: selectedApprover,
					controller: this
				});
				var vBox = this.getView().byId("workflowVbox");
				vBox.removeAllItems();
				vBox.addItem(customControl);
			}
		},
		refreshEditModel: function () {
			var data = this.getModel("substitutesModel").getProperty("/" + this._substitute);
			var dataEditModel = this.getModel("substitutesEditModel").getData();
			if (!dataEditModel.ValidFrom) {
				/*if (this.getModel("viewModel").getProperty("/add")) { //no longer used
					data = {
						ValidFrom: new Date(),
						ValidTo: new Date()
					};

				}*/
			} else {
				data = !data ? dataEditModel : data;
			}
			var dataEditModelNew = Object.assign({}, data);
			this.getModel("substitutesEditModel").setData(dataEditModelNew);
			this.getModel("substitutesEditModel").refresh(true);
			if (data) {
				this.onCreateSpecialDates(data.Id, ["datePicker1", "datePicker2"]);
				this.setDelimitedDates();
			}
		},
		setDelimitedDates: function () {
			var substituteData = this.getModel("substitutesEditModel").getData();
			var ids = ["datePicker1", "datePicker2"];
			var dp1 = this.getView().byId("datePicker1");
			var dp2 = this.getView().byId("datePicker2");
			var today = new Date(this.getModel("viewModel").getProperty("/today"));
			try {
				var approverListData = this.getModel("approversListModel").getData().find(function (element) {
					return element.Id === substituteData.Id;
				});
				if (substituteData.ValidFrom >= today) {
					if (approverListData) {
						if (approverListData.ValidFrom <= today) {
							dp1.setMinDate(today);
						} else {
							dp1.setMinDate(approverListData.ValidFrom);
						}
						dp2.setMaxDate(approverListData.ValidTo);
					} else {
						dp1.setMinDate(today);
						//no max date for dp2
						dp2.setMaxDate(null);
					}

					dp1.setMaxDate(substituteData.ValidTo);
					dp2.setMinDate(substituteData.ValidFrom);

				} else {
					if (substituteData.ValidTo >= today) {
						dp2.setMinDate(today);
						if (approverListData) {
							dp2.setMaxDate(approverListData.ValidTo);
						} else {
							dp2.setMaxDate(null);
						}
					}
				}

			} catch (error) {
				dp2.setMinDate(today);
				dp2.setMaxDate(null);
			}

		},
		onEditDetail: function (oEvent) {
			this.getModel("viewModel").setProperty("/editDetail", true);
			this.changeEditInProgress();
		},
		onSaveDetail: function (oEvent) {
			var newData = this.getModel("substitutesEditModel").getData();
			var data = this.getModel("substitutesModel").getProperty("/" + this._substitute);
			var saveData = this.adjustChanges(data, newData);
			this.onSaveChanges(saveData);
		},
		onUndoDetail: function (oEvent) {
			function confirmFunction() {
				this.getModel("viewModel").setProperty("/editDetail", false);
				this.changeEditInProgress();
				this.refreshEditModel();
			};
			this.confirmUndo(confirmFunction.bind(this));
		},
		onDeleteDetail: function () {
			function confirmFunction() {
				this.handleClose(false);
				//delete function
				var data = this.getModel("substitutesModel").getProperty("/" + this._substitute);
				data.Active = false;
				data.ValidFrom = this.fixDate(data.ValidFrom);
				data.ValidTo = this.fixDate(data.ValidTo);
				this.onSaveChanges([data]);
			};
			var resourceBoundle = this.getView().getModel("i18n").getResourceBundle();
			var text = resourceBoundle.getText("deleteSubstitute");
			this.confirmUndo(confirmFunction.bind(this), text);
		}

	});

});