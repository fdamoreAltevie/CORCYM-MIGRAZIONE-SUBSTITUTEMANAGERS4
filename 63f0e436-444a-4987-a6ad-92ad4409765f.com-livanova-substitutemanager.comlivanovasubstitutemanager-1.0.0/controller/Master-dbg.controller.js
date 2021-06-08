sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"./BaseController",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	'sap/ui/model/Sorter',
	'sap/m/MessageBox',
	"sap/ui/core/Fragment"
], function (JSONModel, Controller, Filter, FilterOperator, Sorter, MessageBox, Fragment) {
	"use strict";

	return Controller.extend("com.livanova.substitutemanager.controller.Master", {

		onInit: function () {
			this.oRouter = this.getOwnerComponent().getRouter();
			this._bDescendingSort = false;

		},
		onAfterRendering: function () {
			this.onFilterActiveSubstitute();
			this.onRefresh(true);
		},
		handleChangeDate: function (oEvent) {
			oEvent.getSource().getSpecialDates();
			this.onCreateSpecialDates("", ["dateRange"]);
			var today = this.getModel("viewModel").getProperty("/today");
			var minDate = new Date(today);
			this.getView().byId("dateRange").setMinDate(minDate);
		},
		onListItemPress: function (oEvent) {
			this.checkEditInProgress();
			var oldSubstitute = this.substitute;
			var oNextUIState = this.getOwnerComponent().getHelper().getNextUIState(1);
			var substitutePath = oEvent.getSource().getBindingContext("substitutesModel") ? oEvent.getSource().getBindingContext(
				"substitutesModel").getPath() : oEvent.getSource().getBindingContext("activeSubstituteModel").getPath();
			this.substitute = substitutePath.split("/").slice(-1).pop();

			this.oRouter.navTo("detail", {
				layout: oNextUIState.layout,
				substitute: this.substitute
			});
		},
		onSearch: function (oEvent) {
			var oTableSearchState = [],
				sQuery = oEvent.getParameter("query");

			if (sQuery && sQuery.length > 0) {
				oTableSearchState = [new Filter("Name", FilterOperator.Contains, sQuery)];
			}
			this.onFiltersApply(oTableSearchState, true);
		},

		/*onAdd: function (oEvent) { //no longer used
			this.checkEditInProgress();
			this.changeEditInProgress();
			this.destroyEditModel();
			var oModel = this.getModel("viewModel");
			if (!oModel.getProperty("/add")) {
				oModel.setProperty("/add", true);
			}
			var nextSubstitute = this.getModel("substitutesModel").getData().length + 1;
			var oNextUIState = this.getOwnerComponent().getHelper().getNextUIState(1);
			this.oRouter.navTo("detail", {
				layout: oNextUIState.layout,
				substitute: nextSubstitute
			});

		},*/

		onSort: function (oEvent) {
			if (!this.popoverSort) {
				this.popoverSort = sap.ui.xmlfragment("com.livanova.substitutemanager.view.fragments.SorterSubstitutesPopover", this);
				this.getView().addDependent(this.popoverSort);
			}

			this.popoverSort.openBy(oEvent.getSource());
		},
		sortTable: function (event) {
			var parameters = {};
			var customData = event.getSource().getCustomData();
			for (var i = 0; i < event.getSource().getCustomData().length; i++) {
				parameters[customData[i].getKey()] = customData[i].getValue();
			}

			var sorter = new Sorter(parameters.path, parameters.descending === "true");

			this.getView().byId("substitutesTable").getBinding("items").sort(sorter);
			this.popoverSort.close();
		},
		onRefresh: function (resetFilters) {
			var filters = [];
			if (!(resetFilters === true)) {
				var startDateSubList = this.getModel("viewModel").getProperty("/startDateSubList");
				var endDateSubList = this.getModel("viewModel").getProperty("/endDateSubList");
				filters.push(new Filter("ValidFrom", FilterOperator.EQ, this.fixDate(startDateSubList)));
				filters.push(new Filter("ValidTo", FilterOperator.EQ, this.fixDate(endDateSubList)));
			}

			sap.ui.core.BusyIndicator.show();
			this.getModel("approversMgmtModel").read("/SubstituteSet", {
				filters: filters,
				success: function (data) {
					this.fixDateVisualization(data.results);
					this.updateFilters(data.results);
					this.onFiltersApply("refresh");
					this.getModel("substitutesModel").setData(data.results);
					this.getModel("substitutesModel").refresh(true);
					var resourceBoundle = this.getView().getModel("i18n").getResourceBundle();
					var message = resourceBoundle.getText("updated");
					sap.ui.core.BusyIndicator.hide();
					if (!(resetFilters === true)) {
						this.comunicationSuccess(resourceBoundle, message);
					}
				}.bind(this),
				error: function (e) {
					sap.ui.core.BusyIndicator.hide();
					this.comunicationError(e);
				}.bind(this)
			});
		},
		onChangeView: function (oEvent) {
			var edit = this.getOwnerComponent().getModel("editInProgressModel").getData().value;
			this.onCreateSpecialDates("", ["dateRange"]);
		},
		onFilter: function (oEvent) {
			if (!this.filterDialog) {
				Fragment.load({
					name: "com.livanova.substitutemanager.view.fragments.FilterDialog",
					controller: this
				}).then(function (oDialog) {
					this.filterDialog = oDialog;
					this.filterDialog.setModel(this.getModel("viewModel"), "viewModel");
					this.filterDialog.setModel(this.getOwnerComponent().getModel("i18n"), "i18n");
					this.filterDialog.open();
				}.bind(this));
			} else {
				this.filterDialog.open();
			}
		},

		onFilterCancel: function (oEvent) {
			var dataModel = this.getModel("substitutesModel").getData();
			this.updateFilters(dataModel);
		},
		onFilterReset: function (oEvent) {
			var dataModel = this.getModel("substitutesModel").getData();
			// this.filterDialog.destroy();
			this.filterDialog = undefined;
			this.onRefresh(true);
			// this.updateFilters(dataModel);
			// this.onFiltersApply();
		},
		//*************ADD FORM
		onSaveAddDetail: function (oEvent) {
			var data = this.getModel("substitutesAddModel").getData();
			if (!data.Id) { //substitute not selected
				var resourceBoundle = this.getView().getModel("i18n").getResourceBundle();
				var message = resourceBoundle.getText("substituteMissing");
				this.comunicationWarning(resourceBoundle, message);
				return;
			}
			data.Active = true;
			//fix date utc
			data.ValidFrom = this.fixDate(data.ValidFrom);
			data.ValidTo = this.fixDate(data.ValidTo);
			this.onSaveChanges([data]);
		},
		onRefreshAddModel: function () {
			var today = this.getModel("viewModel").getProperty("/today");
			var begda = new Date(today);
			var endda = new Date(today);
			this.getModel("substitutesAddModel").setData({});
			this.getModel("substitutesAddModel").refresh(true);
			this.getModel("substitutesAddModel").setProperty("/ValidFrom", begda);
			this.getModel("substitutesAddModel").setProperty("/ValidTo", endda);
		},
		onSaveSuccess: function () {
			sap.ui.core.BusyIndicator.hide();
			this.onRefreshAddModel();
			this.comunicationSuccess();
		},
		onSaveError: function () {
			sap.ui.core.BusyIndicator.hide();
			this.onRefreshAddModel();
			this.comunicationError();
		},
		onCancelActiveSubstitute: function () {
			var resourceBoundle = this.getView().getModel("i18n").getResourceBundle();
			var message = resourceBoundle.getText("confirmCancelActiveSubstitute");

			function confirmFunction() {
				var newDate = new Date();
				var today = this.getModel("viewModel").getProperty("/today");
				var data = this.getModel("substitutesModel").getData().find(function (value) {
					return value.ValidFrom <= today && value.ValidTo >= today;
				});
				if (data.ValidTo.toDateString() !== today.toDateString()) {
					data.ValidFrom = new Date(today);
					data.ValidFrom.setDate(today.getDate() + 1);
					data.ValidFrom = this.fixDate(data.ValidFrom);
					data.ValidTo = this.fixDate(data.ValidTo);
					data.Active = false;
					this.onSaveChanges([data]);
				}
			};
			this.confirmUndo(confirmFunction.bind(this), message);
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
					onSuccess();

				}.bind(this),
				error: function (e) {
					onError();
				}.bind(this),
				groupId: groupId
			});
		},
		onOpenApproversList: function (oEvent) {
			this.getModel("approversMgmtModel").read("/PossibleSubstituteSet", {
				success: function (data) {
					this.getModel("approversListModel").setData(data.results);
					this.getModel("approversListModel").refresh(true);
					this.getModel("viewModel").setProperty("/loadApprovers", false);
				}.bind(this),
				error: function (e) {
					this.getModel("viewModel").setProperty("/loadApprovers", false);
					this.comunicationError(e);
				}.bind(this)
			});
			if (!this.getView().byId("approversListDialogTable")) {
				// load asynchronous XML fragment
				Fragment.load({
					id: this.getView().getId(),
					name: "com.livanova.substitutemanager.view.fragments.ApproversListDialog",
					controller: this
				}).then(function (oDialog) {
					this.getView().addDependent(oDialog);
					oDialog.open();
				}.bind(this));
			} else {
				this.getView().byId("approversListDialogTable").getBinding("items").filter([], "Application");
				this.getView().byId("approversListDialogTable").open();
			}

		},
		handleCloseApproversDialog: function (oEvent) {
			this.getModel("viewModel").setProperty("/loadApprovers", true);
			var oModel = this.getView().getModel("approversListModel"),
				aProducts = oModel.getProperty("/");
			var addModel = this.getModel("substitutesAddModel");

			var bHasSelected = aProducts.some(function (element) {
				if (element.selected) {
					addModel.setProperty("/Id", element.Id);
					addModel.setProperty("/Name", element.Name);
					this.setDelimitedDates(element);
					return true;
				}
			}.bind(this));
		},
		setDelimitedDates: function (data) {
			var dateRange = this.getView().byId("dateRange");
			var today = this.getModel("viewModel").getProperty("/today");
			var begda = new Date(today);
			var endda = new Date(today);
			begda = data.ValidFrom <= begda ? begda : data.ValidFrom;
			endda = data.ValidTo;
			dateRange.setMinDate(begda);
			dateRange.setMaxDate(endda);
		},
		handleSearchApproversDialog: function (oEvent) {
			var oTableSearchState = [],
				sQuery = oEvent.getParameter("value");

			if (sQuery && sQuery.length > 0) {
				oTableSearchState = [new Filter("Name", FilterOperator.Contains, sQuery)];
			}

			this.getView().byId("approversListDialogTable").getBinding("items").filter(oTableSearchState, "Application");
		},
		onFilterActiveSubstitute: function () {
			var today = this.getView().getModel("viewModel").getProperty("/today");
			var filter = [new Filter("ValidFrom", FilterOperator.LE, today)];
			filter.push(new Filter("ValidTo", FilterOperator.GE, today));
			this.getView().byId("activeSubstituteTable").getBinding("items").filter(filter, "Application");
		},
		onChangeFilterDate: function (value) {
			this.getModel("viewModel").setProperty("/dateChanged", value);
		}

	});

});