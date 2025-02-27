sap.ui.define([
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
    "XLSX"
], function(MessageToast, Fragment,XLSX) {
    'use strict';

    return {
        excelUploadButton: function(oEvent) {
            var oView = this.getView();
            if (!this.pDialog) {
                Fragment.load({
                    id: "excel_upload",
                    name: "com.sap.zemployeeman.ext.fragments.ExcelUpload",
                    type: "XML",
                    controller: this
                }).then((oDialog) => {
                    var oFileUploader = Fragment.byId("excel_upload", "uploadSet");
                     oFileUploader.removeAllItems();
                    this.pDialog = oDialog;
                    this.pDialog.open();
                })
                    .catch(error => alert(error.message));
            } else {
                var oFileUploader = Fragment.byId("excel_upload", "uploadSet");
                 oFileUploader.removeAllItems();
                this.pDialog.open();
            }
        },
        
        onUploadFile: function(oEvent)
        {
            var files = oEvent.getParameter("item").getFileObject();
            this.aFile = files;
        },

        onMyreq: function(oEvent){

        },

        onUploadSet: function(oEvent) {
            console.log("Upload Button Clicked!!!")
            /* TODO:Call to OData */
             // checking if excel file contains data or not
             if (!this.excelSheetsData.length) {
                MessageToast.show("Select file to Upload");
                return;
            }

            var that = this;
            var oSource = oEvent.getSource();

            // creating a promise as the extension api accepts odata call in form of promise only
            var fnAddMessage = function () {
                return new Promise((fnResolve, fnReject) => {
                    that.callOdata(fnResolve, fnReject);
                });
            };

            var mParameters = {
                sActionLabel: oSource.getText() // or "Your custom text" 
            };
            // calling the oData service using extension api
            this.extensionAPI.securedExecution(fnAddMessage, mParameters);

            this.pDialog.close();

        },
        onTempDownload: function (oEvent) {
            console.log("Template Download Button Clicked!!!")
            /* TODO: Excel file template download */
            // get the odata model binded to this application
            var oModel = this.getView().getModel();
            // get the property list of the entity for which we need to download the template
            var oBuilding = oModel.getServiceMetadata().dataServices.schema[0].entityType.find(x => x.name === 'EmployeesType');
            // set the list of entity property, that has to be present in excel file template
           
            var propertyList = ['FirstName', 'LastName', 'Dob','Gender',
                                //'Role','Technology',
                                'PromoEligibility', 'PemanantEmp',
                                'City','State', 'Country','DepartmentId',
                                'Salary', 'Managerid', 'Taxable','Yearsofexp'
                                ];

            var excelColumnList = [];
            var colList = {};

            // finding the property description corresponding to the property id
            propertyList.forEach((value, index) => {
                let property = oBuilding.property.find(x => x.name === value);
                colList[property.extensions.find(x => x.name === 'label').value] = '';
            });
            excelColumnList.push(colList);
            
            // initialising the excel work sheet
            const ws = XLSX.utils.json_to_sheet(excelColumnList);
            // creating the new excel work book
            const wb = XLSX.utils.book_new();
            // set the file value
            XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
            // download the created excel file
            XLSX.writeFile(wb, 'EMP - Upload.xlsx');

            MessageToast.show("Template File Downloading...");
        },
        onCloseDialog: function (oEvent) {
            this.excelSheetsData = [];
            this.pDialog.close();
        },
        onBeforeUploadStart: function (oEvent) {
            console.log("File Before Upload Event Fired!!!")
            this.excelSheetsData = [];
            /* TODO: check for file upload count */
        },
        onUploadSetComplete: function (oEvent) {
            console.log("File Uploaded!!!")
            /* TODO: Read excel file data*/

             // getting the UploadSet Control reference
             var oFileUploader = Fragment.byId("excel_upload", "uploadSet");
             // since we will be uploading only 1 file so reading the first file object
             var oFile = oFileUploader.getItems()[0].getFileObject();
 
             var reader = new FileReader();
             var that = this;
 
             reader.onload = (e) => {
                 // getting the binary excel file content
                 let xlsx_content = e.currentTarget.result;
 
                 let workbook = XLSX.read(xlsx_content, { type: 'binary' });
                 // here reading only the excel file sheet- Sheet1
                 var excelData = XLSX.utils.sheet_to_row_object_array(workbook.Sheets["Sheet1"]);
                 
                 workbook.SheetNames.forEach(function (sheetName) {
                     // appending the excel file data to the global variable
                     that.excelSheetsData.push(XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]));
                 });
                 console.log("Excel Data", excelData);
                 console.log("Excel Sheets Data", this.excelSheetsData);
             };
            //  reader.readAsBinaryString(oFile);
             reader.readAsArrayBuffer(oFile);
 
             MessageToast.show("Upload Successful");
        },
        onItemRemoved:function (oEvent) {
            console.log("File Remove/delete Event Fired!!!")  
            /* TODO: Clear the already read excel file data */ 
            this.excelSheetsData = [];          
        },

        callOdata: function (fnResolve, fnReject) {
            //  intializing the message manager for displaying the odata response messages
            var oModel = this.getView().getModel();

            // var mydate = new Date();
            // let dateObj = new Date(timestamp);

            // creating odata payload object for Building entity
            var payload = {};

            this.excelSheetsData[0].forEach((value, index) => {
                // setting the payload data
                payload = {
                    "FirstName": value["First Name"],
                    "LastName": value["Last Name"],
                    // "Dob": new Date(value["Date of Birth"]),
                    "Dob":   value["Date of Birth"] ? "/Date(" + new Date(value["Date of Birth"]).getTime() + ")/" : null,                    
                    "Gender": value["Gender"],
                    "PromoEligibility": value["Promotion Eligibility?"],
                    "City": value["City"],
                    "State": value["State"],
                    "Country": value["Country"],
                    "DepartmentId": value["Department ID"],
                    // "Technology": value["Technology"],
                    "Salary": value["Salary"],
                    "Taxable": value["Taxable?"],
                    "Managerid": value["Manager ID"],
                    "PemanantEmp": value["Permanant Employee?"],
                    "Yearsofexp": value["Experience"]
                    //"Role": value["Role"]                    
                };
                // setting excel file row number for identifying the exact row in case of error or success
                payload.ExcelRowNumber = (index + 1);
                // calling the odata service
                oModel.create("/Employees", payload, {
                    success: (result) => {
                        console.log(result);
                        var oMessageManager = sap.ui.getCore().getMessageManager();
                        var oMessage = new sap.ui.core.message.Message({
                            message: "Employee Created with ID: " + result.EmployeeId,
                            persistent: true, // create message as transition message
                            type: sap.ui.core.MessageType.Success
                        });
                        oMessageManager.addMessages(oMessage);
                        oModel.refresh();
                        fnResolve();
                    },
                    error: fnReject
                });
            });
        }     

    };
});