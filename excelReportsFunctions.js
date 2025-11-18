
'use strict';

class ExcelFileOpen {

    constructor(pointerFile, fileExtensionArray, workingSheet, mimeTypeArray ) {
        if(!pointerFile) {
            console.log("ERROR:ExcelFileOpen: No se ha seleccionado ningun archivo.");
            throw new Error("No se ha seleccionado ningun archivo.");
        }

        this.file = pointerFile;
        this.fileExtensionArray = fileExtensionArray;
        this.workingSheet = workingSheet;
        this.mimeTypeArray = mimeTypeArray;
    }
}

// *********************************************************
// The following lines are an example about how to communicate the needed values and his format.
// Multiple Mime Types and file extension are allowed for check validity of a single file.

// EXCEL_MIME_TYPES[0] = excel mime type for truck shipments format
// EXCEL_MIME_TYPES[1] = excel mime type for report 'OR130'

// const EXCEL_MIME_TYPES = [ "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                            // "application/vnd.ms-excel.sheet.macroEnabled.12" ];
// const WORKING_SHEET = "Sheet1";
// const EXTENSION_VALID_FILE = [ "xlsx", "xlsm", "xls" ];

    // *********************************************************
    function validateMymeType(ExcelMetadata){

        let isValidExtensionFile = false;
        let isValidMimeType = false;

        // check the file type
        if(ExcelMetadata.file === undefined ) {
            console.log("ERROR:readReportsExcel: El archivo \"" + ExcelMetadata.file.name + "\" NO es válido.");
            throw new Error("El archivo \"" + ExcelMetadata.file.name + "\" NO es válido.");
        }

        // check IF the extension file is valid
        for (const extensionFile of ExcelMetadata.fileExtensionArray ) {
            if((ExcelMetadata.file.name.toLowerCase().endsWith( extensionFile ))){
                isValidExtensionFile = true;
                break;
            }
        }

        if(!isValidExtensionFile){
            console.log("ERROR:validateMymeType: La extensión del archivo no se reconoce como válida.");
            throw new Error("La extensión del archivo no se reconoce como válida.");
        }

        // check for MIME type valid
        for (const mimeType of ExcelMetadata.mimeTypeArray ) {
            if((ExcelMetadata.file.type === mimeType )){
                isValidMimeType = true;
                break;
            }
        }

        if(!isValidMimeType){
            console.log("ERROR:validateMymeType: El tipo de archivo MIME no se reconoce como válido.");
            throw new Error("El tipo de archivo MIME no se reconoce como válido.");
        }
        console.log("Validado Myme type y extensión del archivo.");
    }

    
    // *********************************************************
    function loadExcelFile(excelFile){
    
        return new Promise( (resolve, reject ) => {

            console.log("INFO:loadExcelFile: Iniciando lectura de archivo.");
            
            let fileReader = new FileReader();
            // Constants for minification
            const read = "read";
            const utils = "utils";
            const sheet_to_row_object_array = "sheet_to_row_object_array";
            const Sheets = "Sheets";
                
            validateMymeType(excelFile);
            
            fileReader.readAsArrayBuffer(excelFile.file);
            fileReader.onload = function(){
                
                try {
                    let buffer = this.result;
                    let workbook =  XLSX[read](buffer);

                    // validate workSheet exist
                    if(!workbook.SheetNames.includes(excelFile.workingSheet)){
                        reject( new Error("El archivo NO contiene la hoja de trabajo '" + excelFile.workingSheet + "'"));
                    };

                    let contentExcelFile = XLSX[utils][sheet_to_row_object_array](workbook[Sheets][excelFile.workingSheet]);
                    
                    resolve(contentExcelFile);
                    
                } catch (error) {
                    console.log("ERROR:loadExcelFile: ", error);
                    alert(error.message);
                    reject(error);
                }
            };
        });
    }

