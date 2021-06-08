sap.ui.define([
	"sap/ui/core/XMLComposite",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/ui/core/Fragment",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"com/livanova/substitutemanager/formatters/formatter",
	'sap/ui/model/Sorter'
], function (XMLComposite, JSONModel, MessageBox, Fragment, Filter, FilterOperator, formatter, Sorter) {
	return XMLComposite.extend("com.livanova.substitutemanager.CustomControls.WorkflowListControl", {
		metadata: {
			properties: {
				approverData: {
					type: "object"
				},
				controller: {
					type: "object"
				},
				visibleTbl: {
					type: "boolean",
					defaultValue: false
				},
				noWorkflowsText: "string"
			}
		},
		formatter: formatter,
		onAfterRendering: function () {
			if (this.alreadyRendered) {
				return;
			}
			this.alreadyRendered = true;
			var oModel = new JSONModel();
			this.setModel(oModel, "viewControl");
			this.getModel("viewControl").setProperty("/filterInserted", false);
			var workflowModel = new JSONModel();
			this.setModel(workflowModel, "workflowModel");
			var approver = this.getApproverData();
			var controller = this.getController();
			this.filters = [];
			var filters = [];
			if (approver) {
				/*var tbl, oBinding;
				tbl = this.byId("tableWorkflow");
				oBinding = tbl.getBinding("items");
				this.filters.push(new Filter("ApproverId", FilterOperator.EQ, approver.Id));
				this.filters.push(new Filter("ApprovalDate", FilterOperator.BT, approver.ValidFrom, approver.ValidTo));
				oBinding.filter(this.filters);
				if (tbl.getItems().length === 0 && this.getVisibleTbl() !== false) {
					this.setVisibleTbl(false);
				}
				var resourceBundle = this.getController().getResourceBundle();
				var text = resourceBundle.getText("noWorkflows");
				this.setNoWorkflowsText(text);*/
				this.getModel("viewControl").setProperty("/approver", true);
				var resourceBundle = this.getController().getResourceBundle();
				var text = resourceBundle.getText("noWorkflows");
				this.setNoWorkflowsText(text);
				filters.push(new Filter("ApproverId", FilterOperator.EQ, approver.Id));
				var begda = controller.fixDate(approver.ValidFrom);
				var endda = controller.fixDate(approver.ValidTo);
				filters.push(new Filter("ApprovalDate", FilterOperator.BT, begda, endda));
			} else {
				this.setVisibleTbl(true);
			}

			//load workflow model
			this.setBusyControl(approver, true);

			// 
			controller.getModel("approversMgmtModel").read("/WorkflowSet", {
				filters: filters,
				success: function (data) {
					controller.fixDateVisualization(data.results);
					this.getModel("workflowModel").setData(data.results);
					this.getModel("workflowModel").refresh(true);
					this.updateFiltersControl(data.results);
					this.onFiltersApplyControl("refresh");
					if (approver && data.results.length === 0) {
						this.switchView();
					} else {
						this.setVisibleTbl(true);
					}
					this.setBusyControl(approver, false);
				}.bind(this),
				error: function (e) {
					this.setBusyControl(approver, false);
					controller.comunicationError(e);
				}.bind(this)
			});
		},
		setBusyControl: function (approver, value) {
			if (approver) {
				if (value) {
					sap.ui.core.BusyIndicator.show();
				} else {
					sap.ui.core.BusyIndicator.hide();
				}

			} else {
				this.byId("tableWorkflow").setBusy(value);
			}
		},
		switchView: function () {
			if (this.getVisibleTbl() !== false) {
				this.setVisibleTbl(false);
			}
		},
		updateFiltersControl: function (data) {
			//APPROVERS, WORKFLOW, STATE (APPROVED = true/false) 
			var approversList = [];
			var workflowList = [];
			var stateList = [{
				Approved: true
			}, {
				Approved: false
			}];
			if (data.length > 0) {
				data.forEach(function (element) {
					var foundApprover = approversList.find(function (value) {
						return value.ApproverId === element.ApproverId;
					});
					if (!foundApprover) {
						approversList.push({
							ApproverName: element.ApproverName,
							ApproverId: element.ApproverId
						});
					}
					var foundWorkflow = workflowList.find(function (value) {
						return value.Description === element.Description;
					});
					if (!foundWorkflow) {
						workflowList.push({
							Description: element.Description
						});
					}
				});
			}
			this.getModel("viewControl").setProperty("/filterApproverList", approversList);
			this.getModel("viewControl").setProperty("/filterWorkflowList", workflowList);
			this.getModel("viewControl").setProperty("/filterState", stateList);

			//APPROVAL DATE
			var dateChanged = this.getModel("viewControl").getProperty("/dateChanged");
			if (!dateChanged) {
				var controller = this.getController();
				var today = controller.getModel("viewModel").getProperty("/today");
				var begda = new Date(today),
					endda = new Date(today);

				for (var i = 0; i < data.length; i++) {
					begda = data[i].ApprovalDate <= begda ? data[i].ApprovalDate : begda;
					endda = data[i].ApprovalDate >= endda ? data[i].ApprovalDate : endda;
				}
				this.getModel("viewControl").setProperty("/startDateFilter", begda);
				this.getModel("viewControl").setProperty("/endDateFilter", endda);
			}
		},
		onFiltersApplyControl: function (oEvent, additionalFilters) {
			var filters = [];
			var dateChanged = this.getModel("viewControl") ? this.getModel("viewControl").getProperty("/dateChanged") : undefined;
			var startDateFilter = this.getModel("viewControl").getProperty("/startDateFilter");
			var endDateFilter = this.getModel("viewControl").getProperty("/endDateFilter");
			// var filters = [new Filter("ApprovalDate", FilterOperator.BT, startDateFilter, endDateFilter)];
			if (oEvent) {
				var filterKeys = {};
				if (this.filterDialogWorkflow) {
					filterKeys = this.filterDialogWorkflow.getSelectedFilterCompoundKeys();
				}
				if (additionalFilters) {
					filters = filters.concat(oEvent); //if there are additional filters, the event is the array of additional filters

				}
				/*else {
					filterKeys = oEvent.getParameters().filterCompoundKeys;
				}*/
				//other filters:
				var fieldKeys = Object.keys(filterKeys);
				if (fieldKeys.length > 0) {
					for (var j = 0; j < fieldKeys.length; j++) {
						var arrayFilters = [];
						var keys = Object.keys(filterKeys[fieldKeys[j]]);
						for (var i = 0; i < keys.length; i++) {
							if (keys[i] === "false" || keys[i] === "true") { //transform "Approved" field to boolean
								keys[i] = keys[i] === "true";
							}
							arrayFilters.push(new Filter(fieldKeys[j], FilterOperator.EQ, keys[i]));
						}
						filters.push(new Filter(arrayFilters, false));
					}

				}
			}
			if (oEvent !== "refresh" && dateChanged === true) {
				this.reloadTable(startDateFilter, endDateFilter);
			}
			this.byId("tableWorkflow").getBinding("items").filter(filters, "Application");
			this.changeFilterInserted();
		},
		reloadTable: function (startDate, endDate) {
			var filters = [];

			var approver = this.getApproverData();
			var controller = this.getController();
			if (approver) {
				filters.push(new Filter("ApproverId", FilterOperator.EQ, approver.Id));
				// filters.push(new Filter("ApprovalDate", FilterOperator.BT, controller.fixDate(approver.ValidFrom), controller.fixDate(approver.ValidTo)));
				if (startDate < approver.ValidFrom) {
					startDate = new Date(approver.ValidFrom);
				}
				if (endDate > approver.ValidTo) {
					endDate = new Date(approver.ValidTo);
				}
			}
			filters.push(new Filter("ApprovalDate", FilterOperator.BT, controller.fixDate(startDate), controller.fixDate(endDate)));
			this.byId("tableWorkflow").setBusy(true);

			controller.getModel("approversMgmtModel").read("/WorkflowSet", {
				filters: filters,
				success: function (data) {
					controller.fixDateVisualization(data.results);
					this.getModel("workflowModel").setData(data.results);
					this.getModel("workflowModel").refresh(true);
					this.byId("tableWorkflow").setBusy(false);
				}.bind(this),
				error: function (e) {
					this.byId("tableWorkflow").setBusy(false);
					controller.comunicationError(e);
				}.bind(this)
			});
		},
		changeFilterInserted: function () {
			var value = false;
			var dateChanged = this.getModel("viewControl") ? this.getModel("viewControl").getProperty("/dateChanged") : undefined;
			var filterDialog = this.filterDialogWorkflow;
			if (dateChanged) {
				value = true;
			}
			if (filterDialog) {
				if (filterDialog.getSelectedFilterItems().length > 0) {
					value = true;
				}
			}
			this.getModel("viewControl").setProperty("/filterInserted", value);
		},
		onFilterControl: function (oEvent) {
			var controller = this.getController();
			var approver = this.getApproverData();
			if (!this.filterDialogWorkflow) {
				Fragment.load({
					name: "com.livanova.substitutemanager.view.fragments.FilterDialogWorkflow",
					controller: this
				}).then(function (oDialog) {
					this.filterDialogWorkflow = oDialog;
					// Set initial and reset value for Slider in custom control
					this.filterDialogWorkflow.setModel(this.getModel("viewControl"), "viewControl");
					this.filterDialogWorkflow.setModel(controller.getModel("viewModel"), "viewModel");
					this.filterDialogWorkflow.setModel(controller.getOwnerComponent().getModel("i18n"), "i18n");
					if (approver) {
						var approverItem = this.filterDialogWorkflow.getFilterItems().find(function (value) {
							return value.getKey() === "ApproverId";
						});
						this.filterDialogWorkflow.removeFilterItem(approverItem);
					}
					this.filterDialogWorkflow.open();
				}.bind(this));
			} else {
				this.filterDialogWorkflow.open();
			}
		},

		onFilterCancelControl: function (oEvent) {
			// this.onRefresh();
			var dataModel = this.getModel("workflowModel").getData();
			this.updateFiltersControl(dataModel);
		},
		onFilterResetControl: function (oEvent) {
			var dataModel = this.getModel("workflowModel").getData();
			this.filterDialogWorkflow = undefined;
			this.onRefreshControl(true);
			// this.updateFiltersControl(dataModel);
			// this.onFiltersApplyControl();
		},
		onSearchControl: function (oEvent) {

			var oTableSearchState = [],
				sQuery = oEvent.getParameter("query");

			if (sQuery && sQuery.length > 0) {
				oTableSearchState = [new Filter("Description", FilterOperator.Contains, sQuery)];
			}
			var searchFilters = this.filters.concat(oTableSearchState);
			// this.byId("tableWorkflow").getBinding("items").filter(searchFilters, "Application");
			this.onFiltersApplyControl(oTableSearchState, true);
		},
		onRefreshControl: function (resetFilters) {
			var approver = this.getApproverData();
			var controller = this.getController();
			var startDate = this.getModel("viewControl").getProperty("/startDateFilter");
			var endDate = this.getModel("viewControl").getProperty("/endDateFilter");
			var dateChanged = this.getModel("viewControl").getProperty("/dateChanged");
			var filters = [];
			if (approver) {
				filters.push(new Filter("ApproverId", FilterOperator.EQ, approver.Id));
				if (dateChanged) {
					if (startDate < approver.ValidFrom) {
						startDate = new Date(approver.ValidFrom);
					}
					if (endDate > approver.ValidTo) {
						endDate = new Date(approver.ValidTo);
					}
				} else {
					startDate = new Date(approver.ValidFrom);
					endDate = new Date(approver.ValidTo);
				}

				// filters.push(new Filter("ApprovalDate", FilterOperator.BT, controller.fixDate(startDate), controller.fixDate(endDate)));
			}

			if (!(resetFilters === true) || approver) {
				filters.push(new Filter("ApprovalDate", FilterOperator.BT, controller.fixDate(startDate), controller.fixDate(endDate)));
			}
			this.byId("tableWorkflow").setBusy(true);

			controller.getModel("approversMgmtModel").read("/WorkflowSet", {
				filters: filters,
				success: function (data) {
					controller.fixDateVisualization(data.results);
					this.getModel("workflowModel").setData(data.results);
					this.getModel("workflowModel").refresh(true);
					this.updateFiltersControl(data.results);
					this.onFiltersApplyControl("refresh");
					var resourceBoundle = controller.getView().getModel("i18n").getResourceBundle();
					var message = resourceBoundle.getText("updated");
					this.byId("tableWorkflow").setBusy(false);
					if (!(resetFilters === true)) {
						controller.comunicationSuccess(resourceBoundle, message);
					}
				}.bind(this),
				error: function (e) {
					this.byId("tableWorkflow").setBusy(false);
					controller.comunicationError(e);
				}.bind(this)
			});
		},
		onSortControl: function (oEvent) {
			var controller = this.getController();
			if (!this.popoverSortWorkflow) {
				this.popoverSortWorkflow = sap.ui.xmlfragment("com.livanova.substitutemanager.view.fragments.SorterWorkflowPopover",
					this);
				this.addDependent(this.popoverSortWorkflow);
			}

			this.popoverSortWorkflow.openBy(oEvent.getSource());
		},
		sortTableControl: function (event) {
			var parameters = {};
			var customData = event.getSource().getCustomData();
			for (var i = 0; i < event.getSource().getCustomData().length; i++) {
				parameters[customData[i].getKey()] = customData[i].getValue();
			}

			var sorter = new Sorter(parameters.path, parameters.descending === "true");

			this.byId("tableWorkflow").getBinding("items").sort(sorter);
			this.popoverSortWorkflow.close();
		},
		onChangeFilterDateControl: function (value) {
			this.getModel("viewControl").setProperty("/dateChanged", value);
		}

	});
}, true);