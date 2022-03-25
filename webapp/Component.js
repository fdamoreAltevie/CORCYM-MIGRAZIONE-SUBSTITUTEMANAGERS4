sap.ui.define(["sap/ui/core/UIComponent", 
                "sap/ui/Device", 
                "sap/ui/model/json/JSONModel", 
                "sap/f/FlexibleColumnLayoutSemanticHelper", 
                "substitutemanager_S4Hana/model/models", 
                "substitutemanager_S4Hana/controller/BaseController"], function(e, t, s, o, i, a) {
    "use strict";
    return e.extend("substitutemanager_S4Hana.Component", {
        metadata: {
            manifest: "json"
        },
        init: function() {
            e.prototype.init.apply(this, arguments);
            sap.ui.getCore().getConfiguration().setLanguage("en");
            this.getRouter().initialize()
        },
        loadAll: function(e) {
            var t = "initialCall";
            var o = this.getModel("i18n").getResourceBundle();
            var r = this.getModel("approversMgmtModel");
            r.setDeferredBatchGroups([t]);
            this.setEditInProgressModel();
            this.setViewModel(e);
            var u = new s;
            this.setModel(u);
            this.setSubstitutesModel(e);
            this.setApproversListModel(e);
            this.setActiveSubstituteModel(e);
            this.setSubstitutesEditModel();
            this.setSubstitutesAddModel();
            this.setDateFormat();
            this.setModel(i.createDeviceModel(), "device");
            var d = jQuery.sap.getModulePath("substitutemanager_S4Hana");
            var n = new sap.ui.model.json.JSONModel({
                path: d
            });
            this.setModel(n, "rootPath");
            sap.ui.core.BusyIndicator.show();
            r.submitChanges({
                groupId: t,
                success: function() {
                    var e = this.getModel("dateFormatModel").getData().DateFormat;
                    if (e) {
                        var t = this.getModel("viewModel").getData();
                        t.dateFormat = e;
                        this.getModel("viewModel").refresh(true)
                    }
                    this._substitute = undefined;
                    this.getRouter().navTo("master", {
                        layout: "OneColumn"
                    });
                    sap.ui.core.BusyIndicator.hide()
                }.bind(this),
                error: function(e) {
                    sap.ui.core.BusyIndicator.hide();
                    a.prototype.comunicationError.apply(this, [e, o])
                }.bind(this)
            })
        },
        setSubstitutesModel: function(e) {
            var t = i.createSubstitutesModel(this, e);
            t.setSizeLimit(1e4);
            this.setModel(t, "substitutesModel")
        },
        setDateFormat: function(e) {
            var t = i.setDateFormat(this, e);
            t.setSizeLimit(1e4);
            this.setModel(t, "dateFormatModel")
        },
        setApproversListModel: function(e) {
            var t = i.createApproversListModel(this, e);
            t.setSizeLimit(1e4);
            this.setModel(t, "approversListModel")
        },
        setActiveSubstituteModel: function(e) {
            var t = i.createActiveSubstituteModel(this, e);
            this.setModel(t, "activeSubstituteModel");
            t.setSizeLimit(1e4)
        },
        setWorkflowModel: function() {
            var e = i.createWorkflowModel(this);
            e.setSizeLimit(1e4);
            this.setModel(e, "workflowModel")
        },
        setEditInProgressModel: function() {
            var e = i.createEditInProgressModel();
            this.setModel(e, "editInProgressModel")
        },
        setViewModel: function(e) {
            var t = i.createViewModel(e);
            this.setModel(t, "viewModel")
        },
        setSubstitutesEditModel: function() {
            var e = i.createSubstitutesEditModel();
            this.setModel(e, "substitutesEditModel")
        },
        setSubstitutesAddModel: function() {
            var e = i.createSubstitutesAddModel();
            this.setModel(e, "substitutesAddModel")
        },
        createContent: function() {
            return sap.ui.view({
                viewName: "substitutemanager_S4Hana.view.App",
                type: "XML"
            })
        },
        getHelper: function() {
            var e = this.getRootControl().byId("fcl"),
                t = jQuery.sap.getUriParameters(),
                s = {
                    defaultTwoColumnLayoutType: sap.f.LayoutType.TwoColumnsMidExpanded,
                    defaultThreeColumnLayoutType: sap.f.LayoutType.ThreeColumnsMidExpanded,
                    mode: t.get("mode"),
                    maxColumnsCount: t.get("max")
                };
            return o.getInstanceFor(e, s)
        }
    })
});