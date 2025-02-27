sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment"
], (Controller, MessageToast, Fragment) => {
    "use strict";

    return Controller.extend("com.sap.zfileuploader.controller.View1", {
        onInit() {
        },

        onUpload: function(){
                MessageToast.show('Clicked');
        }    
    });
});