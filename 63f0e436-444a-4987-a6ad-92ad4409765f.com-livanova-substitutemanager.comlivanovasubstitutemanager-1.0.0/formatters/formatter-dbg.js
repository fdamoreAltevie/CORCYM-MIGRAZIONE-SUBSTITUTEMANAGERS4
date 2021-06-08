sap.ui.define([], function () {
	"use strict";

	return {
		formatDate: function (date) {
			var pattern = this.getModel("viewModel").getProperty("/dateFormat");
			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: pattern
			});
			var dateFormatted = dateFormat.format(date);

			if (dateFormatted === "01/01/1970" || dateFormatted === "") {
				dateFormatted = null;
			}
			return dateFormatted;
		},
		dateValidityState: function (begda, endda) {
			var state = "Error";
			var today = this.getModel("viewModel").getProperty("/today");
			if ((today >= begda && today <= endda) || (today.toDateString() === begda.toDateString()) || (today.toDateString() === endda.toDateString())) {
				state = "Success";
			} else if (today < begda) {
				state = "None";
			}
			return state;
		},
		visibilityDetailEdit: function (edit, validFrom, type) {
			var visible = true;
			var today = this.getModel("viewModel").getProperty("/today");
			if (!edit) {
				visible = type === "Text" ? true : false;
			} else {
				if (validFrom <= today) {
					visible = type === "Text" ? true : false;
				} else {
					visible = type === "Date" ? true : false;
				}
			}
			return visible;
		},
		enableTerminateSub: function (data) {
			var enabled = true;
			if (this.byId('activeSubstituteTable').getItems().length === 0) {
				enabled = false;
			}
			return enabled;
		}
	};
});