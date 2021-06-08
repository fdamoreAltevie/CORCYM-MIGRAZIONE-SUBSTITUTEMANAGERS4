sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/ui/core/UIComponent",
	"sap/ui/core/routing/History",
	"com/livanova/substitutemanager/formatters/formatter",
	"sap/m/MessageBox",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (Controller, JSONModel, MessageToast, UIComponent, History, formatter, MessageBox, Filter, FilterOperator) {
	"use strict";

	return Controller.extend("com.livanova.substitutemanager.controller.BaseController", {
		formatter: formatter,
		onInit: function () {},
		refreshModels: function () {

		},
		destroyEditModel: function () {
			this.getModel("substitutesEditModel").setData({});
			this.getModel("substitutesEditModel").refresh(true);
		},
		getModel: function (sName) {
			return this.getView().getModel(sName);
		},
		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},
		comunicationError: function (error, resourceBoundle, text) {
			// if calling from component i cant have the this
			if (!resourceBoundle) {
				resourceBoundle = this.getView().getModel("i18n").getResourceBundle();
			}

			if (error && error.statusCode === "400") {
				var objText = JSON.parse(error.responseText);
				text = objText.error.message.value;
			} else {
				if (!text) {
					text = resourceBoundle.getText("errCom");
				}
			}

			MessageBox.error(
				text, {
					title: resourceBoundle.getText("err")
				}
			);
		},

		comunicationSuccess: function (resourceBoundle, text) {
			// if calling from component i cant have the this
			if (!resourceBoundle) {
				resourceBoundle = this.getView().getModel("i18n").getResourceBundle();
			}
			if (!text) {
				text = resourceBoundle.getText("succCom");
			}

			MessageToast.show(text);
		},
		comunicationWarning: function (resourceBoundle, text) {
			// if calling from component i cant have the this
			if (!resourceBoundle) {
				resourceBoundle = this.getView().getModel("i18n").getResourceBundle();
			}
			if (!text) {
				text = "";
			}

			MessageBox.warning(text, {
				title: resourceBoundle.getText("att")
			});
		},
		confirmUndo: function (onConfirm, text) {
			var resourceBoundle = this.getView().getModel("i18n").getResourceBundle();
			if (!text) {
				text = resourceBoundle.getText("cancelChanges");
			}
			MessageBox.confirm(
				text, {
					title: resourceBoundle.getText("att"),
					onClose: function (event) {
						if (event === "OK") {
							onConfirm();
						}
					}
				}
			);
			return;
		},
		checkEditInProgress: function (oEvent) {
			var resourceBoundle = this.getModel("i18n").getResourceBundle();
			var message = resourceBoundle.getText("editInProgress");
			var edit = this.getOwnerComponent().getModel("editInProgressModel").getData().value;
			if (edit) {
				this.comunicationWarning(resourceBoundle, message);
				throw message;
			}
		},
		fixDate: function (date) {
			if (date.getMinutes() === 59) {
				date.setHours(0, 0, 0, 0); //if the date is chosen in dateRangePicker, time will be 23:59:59
			}
			if (date.getHours() === 0) {
				date = new Date(date);
				date.setMinutes(-date.getTimezoneOffset());
			}
			return date;
		},
		fixDateVisualization: function (data) { //transform backend dates
			if (data.length > 0) {
				data.forEach(function (element) {
					var keys = Object.keys(element);
					for (var i = 0; i < keys.length; i++) {
						var el = element[keys[i]];
						if (el instanceof Date) {
							el = new Date(el);
							el.setMinutes(el.getTimezoneOffset());
							element[keys[i]] = el;
						}
					}
				});
			}
			return data;
		},
		changeEditInProgress: function (oEvent) {
			var editModel = this.getOwnerComponent().getModel("editInProgressModel");
			var value = editModel.getProperty("/value");
			value = editModel.setProperty("/value", !value);
		},
		updateFilters: function (data) {
			//SUBSTITUTES
			var substitutes = [];
			var substitutesList = [];
			if (data.length > 0) {
				data.forEach(function (element) {
					var found = substitutesList.find(function (value) {
						return value.Id === element.Id;
					});
					if (!found) {
						substitutesList.push({
							Name: element.Name,
							Id: element.Id
						});
					}
				});
			}
			this.getOwnerComponent().getModel("viewModel").setProperty("/filterSubList", substitutesList);
			var dateChanged = this.getModel("viewModel").getProperty("/dateChanged");
			//VALIDITY
			if (!dateChanged) {
				var today = this.getModel("viewModel").getProperty("/today");
				var begda = new Date(today);
				var endda = new Date(today);

				for (var i = 0; i < data.length; i++) {
					begda = data[i].ValidFrom <= begda ? data[i].ValidFrom : begda;
					endda = data[i].ValidTo >= endda ? data[i].ValidTo : endda;
				}
				this.getOwnerComponent().getModel("viewModel").setProperty("/startDateSubList", begda);
				this.getOwnerComponent().getModel("viewModel").setProperty("/endDateSubList", endda);
			}

		},
		fixFilterDates: function () {
			var startDate = this.getModel("viewModel").getProperty("/startDateSubList");
			var endDate = this.getModel("viewModel").getProperty("/endDateSubList");
			var dataModel = Object.assign([], this.getModel("substitutesModel").getData());
			if (dataModel.length > 0) {
				var minSub = dataModel.find(function (value) {
					return value.ValidFrom < startDate && value.ValidTo > startDate;
				});
				var maxSub = dataModel.find(function (value) {
					return value.ValidFrom < endDate && value.ValidTo > endDate;
				});
				if (minSub) {
					startDate = new Date(minSub.ValidFrom);
					this.getModel("viewModel").setProperty("/startDateSubList", startDate);
				}
				if (maxSub) {
					endDate = new Date(maxSub.ValidTo);
					this.getModel("viewModel").setProperty("/endDateSubList", endDate);
				}

			}
		},
		onFiltersApply: function (oEvent, additionalFilters) {
			var filters = [];
			var dateChanged = this.getModel("viewModel") ? this.getModel("viewModel").getProperty("/dateChanged") : undefined;
			/*filters.push(new Filter("ValidFrom", FilterOperator.GE, startDateSubList)); 
			filters.push(new Filter("ValidTo", FilterOperator.LE, endDateSubList));*/
			//fix dates
			/*if (dateChanged) {
				this.fixFilterDates();
			}*/
			var startDateSubList = this.getModel("viewModel").getProperty("/startDateSubList");
			var endDateSubList = this.getModel("viewModel").getProperty("/endDateSubList");
			if (oEvent) {
				var filterKeys = {};
				if (this.filterDialog) {
					filterKeys = this.filterDialog.getSelectedFilterKeys();
				}
				if (additionalFilters) {
					filters = filters.concat(oEvent); //if there are additional filters, the event is the array of additional filters
				}
				//other filters:
				var keys = Object.keys(filterKeys);
				if (keys.length > 0) {
					var filtersId = [];
					for (var i = 0; i < keys.length; i++) {
						filtersId.push(new Filter("Id", FilterOperator.EQ, keys[i]));
					}
					filters.push(new Filter(filtersId, false));
				}
			}
			if (oEvent !== "refresh" && dateChanged === true) {
				this.reloadTable(startDateSubList, endDateSubList);
			}
			this.getView().byId("substitutesTable").getBinding("items").filter(filters, "Application");
			this.changeFilterInserted();
		},
		reloadTable: function (startDate, endDate) {
			var filters = [];
			filters.push(new Filter("ValidFrom", FilterOperator.EQ, this.fixDate(startDate)));
			filters.push(new Filter("ValidTo", FilterOperator.EQ, this.fixDate(endDate)));
			sap.ui.core.BusyIndicator.show();
			this.getModel("approversMgmtModel").read("/SubstituteSet", {
				filters: filters,
				success: function (data) {
					this.fixDateVisualization(data.results);
					// this.updateFilters(data.results);
					// this.onFiltersApply("refresh");
					this.getModel("substitutesModel").setData(data.results);
					this.getModel("substitutesModel").refresh(true);
					// var resourceBoundle = this.getView().getModel("i18n").getResourceBundle();
					// var message = resourceBoundle.getText("updated");
					sap.ui.core.BusyIndicator.hide();
					// this.comunicationSuccess(resourceBoundle, message);
				}.bind(this),
				error: function (e) {
					sap.ui.core.BusyIndicator.hide();
					this.comunicationError(e);
				}.bind(this)
			});
		},
		changeFilterInserted: function () {
			var value = false;
			var dateChanged = this.getModel("viewModel") ? this.getModel("viewModel").getProperty("/dateChanged") : undefined;
			var filterDialog = this.filterDialog;
			if (dateChanged) {
				value = true;
			}
			if (filterDialog) {
				if (filterDialog.getSelectedFilterItems().length > 0) {
					value = true;
				}
			}
			this.getModel("viewModel").setProperty("/filterInserted", value);
		},
		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		//**********Master and detail functions
		onSaveChanges: function (saveData) {
			if (saveData.length === 0) {
				this.onSaveSuccess();
				return;
			}
			var valid = this.checkValidityPeriod(saveData);
			var oModel = this.getOwnerComponent().getModel("approversMgmtModel");
			var that = this;

			function createCall(data0, data1) {
				oModel.create("/SubstituteSet", data0, {
					success: function (results) {
						if (!data1) {
							that.loadSubstitutesModel(that.onSaveSuccess.bind(that), that.onSaveError.bind(that), results);
						} else {
							data0 = data1;
							createCall(data0);
						}
					}.bind(that),
					error: function (e) {
						that.onSaveError();
					}.bind(that)
				});
			}
			if (valid) {
				sap.ui.core.BusyIndicator.show();
				createCall(saveData[0], saveData[1]);
			}
		},
		checkValidityPeriod: function (saveData) {
			var substitute = saveData[0].Id;
			var valid = true;
			var filteredData = this.getModel("substitutesModel").getData().filter(function (value) {
				return value.Id !== substitute; //check if there's an overlap between two different substitutes 
			});
			filteredData.forEach(function (element) {
				for (var i = 0; i < saveData.length; i++) {
					var validFrom = new Date(this.fixDate(element.ValidFrom));
					var validTo = new Date(this.fixDate(element.ValidTo));
					if (saveData[i].ValidFrom <= validTo && saveData[i].ValidTo >= validFrom) {
						valid = false;
					}
				}
			}.bind(this));
			if (!valid) {
				var resourceBoundle = this.getModel("i18n").getResourceBundle();
				var message = resourceBoundle.getText("validityWarning");
				this.comunicationWarning(resourceBoundle, message);
			}
			return valid;
		},

		onCreateSpecialDates: function (Id, objects) {
			objects.forEach(function (element) {
				this.getView().byId(element).removeAllSpecialDates();
			}.bind(this));
			var modelData = this.getModel("substitutesModel").getData();
			if (modelData.length > 0) {
				modelData.forEach(function (element) {
					for (var i = 0; i < objects.length; i++) {
						var specialRange = new sap.ui.unified.DateTypeRange({
							startDate: element.ValidFrom,
							endDate: element.ValidTo,
							type: "Type02"
						});
						this.getView().byId(objects[i]).addSpecialDate(specialRange);
					}
				}.bind(this));
			}
		}

	});
});