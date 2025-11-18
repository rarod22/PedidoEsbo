
'use strict';

class dataObjectElement {

    constructor( ){
        this.reference = "";
        this.name = "";
        this.salesLocation = "";
        this.salesMethod = 0;
        this.localPrice = 0;
        this.familyPrice = 0;
        this.currentForecastValue = 0;
        this.averageSale = 0;
        this.lastWkSales = 0;
        this.thisWkSales = 0;
        this.wk1FCO = 0;
        this.wk2FCO = 0;
        this.eoq = 0;
        this.palletQty = 0;
        this.packingListData = [];
        this.quotes = "";

        this.locations = [];
        this.esboStock = {};
        this.shopStock = {};

        this.totalStock = 0;
        this.availableShopStock = 0;

        this.eoqQty = 0;
        this.stockWeeks = 0;

        this.analisysPriority = 8;
        this.type = "";
    }

    setSDS0001Values( salesLocation, ref, name, salesMethod, currentForecastValue, averageSale, availableStock, eoq, volume, palletQty ) {
        this.salesLocation = salesLocation;
        this.reference = ref;
        this.name = name;
        this.salesMethod = salesMethod;
        this.currentForecastValue = currentForecastValue;
        this.averageSale = averageSale;
        this.totalStock = availableStock;
        this.eoq = eoq;
        this.volume = volume;
        this.palletQty = palletQty;
    }

    setSDS0002Values ( wk1FCO, wk2FCO ) {
        // the file value needs to be divided by ten to match the SDS values screen
        this.wk1FCO = ( wk1FCO / 10 );
        this.wk2FCO = ( wk2FCO / 10 );
    }

    setAL010Values( localPrice, familyPrice ){
        this.localPrice = localPrice;
        this.familyPrice = familyPrice;
    }

    setSA021Values( thisWkSales, lastWkSales, expSale ){
        this.thisWkSales = thisWkSales;
        this.lastWkSales = lastWkSales;
        if( this.currentForecastValue !== expSale ){
            console.log(`Venta + Alta: ERROR! Ref: ${this.reference} / ${this.currentForecastValue} / ${expSale}`);
        }
    }

    setPackingListValues( packingListData ) {
        this.packingListData.push( packingListData );
    }

    subtractPrevOrderQuantityPallets ( prevOrderQty ) {
        this.esboStock.pallets = this.esboStock.pallets - prevOrderQty;
        this.esboStock.stock = this.esboStock.stock - ( this.palletQty * prevOrderQty );
    }

    addPreviousOrderQuantityPallets( prevOrderQty ){
        this.shopStock.stock = this.shopStock.stock + ( prevOrderQty * this.palletQty );
        this.shopStock.pallets = this.shopStock.pallets + prevOrderQty;
    }

    setPreviousOrderValues( previousOrderData ) {
        // add ordered pallets quantity to 'trucks' column
        this.packingListData.unshift( previousOrderData );
        // remove ordered quantity from external storage 
        this.subtractPrevOrderQuantityPallets( previousOrderData );
        // add quantity ordered to 'shop stock'
        this.addPreviousOrderQuantityPallets( previousOrderData );
    }

    setDataObsValues( quotes ){
        this.quotes = quotes;
    }

    setShopAndEsboStockPallets( shopStock, esboStock ){
        this.shopStock.stock = shopStock.stock;
        this.shopStock.pallets = shopStock.pallets;

        this.esboStock.stock = esboStock.stock;
        this.esboStock.pallets = esboStock.pallets;
    }

    setAvailableShopStock(){
        this.availableShopStock = this.totalStock - this.esboStock.stock;
    }

    setEoqQty(){
        this.eoqQty = this.availableShopStock / this.eoq;
    }

    setStockWeeks(){
        // const higestvalue = ( this.averageSale > this.lastWkSales ? this.averageSale : this.lastWkSales );
        // this.stockWeeks = this.availableShopStock / higestvalue;

        this.stockWeeks = this.availableShopStock / this.currentForecastValue;
        
        if( this.stockWeeks === Infinity ){
            this.stockWeeks = 999;
        }
    }
}

// *********************************************************
// VARIABLES AND CONSTANTS

// Shop Special locations
let shopSpecialLocations;

// product mark with "offer", "end cap" or "zone"
let typeSpecialProduct;

// Parameters and values used to reduce the total amount of rows in the data table. 
let tableReductionParameters;

// Params to define priority columns in the final table
let priorityParams;

// Configuration Data Map
let reportsConfigMap;

// Data object elements Map (SG010 Data and references)
let dataObjectElementsMap;

// Data map for filtered data
let filteredDataMap;

// data from 'SDS0001' report
let dataSDS0001;

// data from 'SDS0002' report
let dataSDS0002;

// data from 'AL010' report
let dataAL010;

// data from 'SA021' report 
let dataSA021;

// data from 'Packing List' report 
let dataPackingList;

// data from 'Obs Especiales' report 
let dataObs;

// data from 'Pedido anterior ESBO' report 
let dataPreviousOrder;

const version = "3.5";

const configDataURL = "./res/configData.json";
const teclas = ["ArrowDown", "ArrowUp", "PageDown", "PageUp"];

const TABLE_REDUCTION_OFFER_PARAMS = "tableReductionParameters-offerParameters";
const TABLE_REDUCTION_NORMAL_PARAMS = "tableReductionParameters-normalParameters";
const PRIORITY_PARAMS = "priorityParams";
const TABLE_REDUCTION_AVOID_TEXT_PARAMS = "avoidIgnoreArticlesWithText-param";

let tableHeadersView = [];

const MV0 = 0;
const MV1 = 1;
const MV2 = 2;

const REPO_AL010 = "AL010";
const REPO_SDS0001 = "SDS0001";
const REPO_SDS0002 = "SDS0002";
const REPO_SA021 = "SA021";
const REPO_SG010 = "SG010";
const REPO_OBS_ESPECIAL = "Obs-Especiales";
const REPO_PACKING_LIST = "Packing-List";
const REPO_PREVIOUS_ORDER = "Pedido-ESBO";

const SGF_LOCATION = "SGFLOCATION";
const ESBO_LOCATION = "990501";
const REFERENCE_SG010 = "STORAGE_UNICODE";
const PALLET_QUANTITY = "QTY";
const FORECAST_TYPE_SDS0002 = "5 OpFC";


const auxPanel = document.getElementById("auxiliar-panel-loading");

// reports panel 
const reportsPanel = document.getElementById("reports-panel");
const AL010_Button = document.getElementById(REPO_AL010);
const SDS0001_Button = document.getElementById(REPO_SDS0001);
const SDS0002_Button = document.getElementById(REPO_SDS0002);
const SA021_Button = document.getElementById(REPO_SA021);
const SG010_Button = document.getElementById(REPO_SG010);
const PACKING_LIST_Button = document.getElementById(REPO_PACKING_LIST);
const OBS_ESPECIAL_Button = document.getElementById(REPO_OBS_ESPECIAL);
const previousOrder_Button = document.getElementById(REPO_PREVIOUS_ORDER);
const loadReportsB = document.getElementById("process-reports-go");

// table results panel
const tableResultsPanel = document.getElementById("table-results-panel");

// Table Elements
const table = document.getElementById("table");
const tableHeaders = document.getElementById("table-headers");
const tableData = document.getElementById("table-data");
const reduceDataTable = document.getElementById("reduce-data-table");
const tableDataButton = document.getElementById("copy-data-table");

// Configuration panel
const configPanel = document.getElementById("auxiliar-panel-configuration");
const configurationB = document.getElementById("configuration-button");
const configParamsOk = document.getElementById("config-params-ok");
const configParamsCancel = document.getElementById("config-params-cancel");
const configReduceDataPanel = document.getElementById("config-reduce-data-panel");
const configReduceDataPanelB = document.getElementById("config-reduce-data-panel-B");
const configPrioritiesPanel = document.getElementById("config-priorities-panel");
const configPrioritiesPanelB = document.getElementById("config-priorities-panel-B");

    // configuration panel - Config reduce data panel values
    const stockWeeksParamNormal = document.getElementById("stockWeeks-param-normal");
    const eoqQtyParamNormal = document.getElementById("eoqQty-param-normal");
    const totalUnitsParamNormal = document.getElementById("totalUnits-param-normal");
    const stockWeeksParamOffer = document.getElementById("stockWeeks-param-offer");
    const eoqQtyParamOffer = document.getElementById("eoqQty-param-offer");


// *********************************************************
// EVENT LISTENERS

// auxPanel.addEventListener("wheel", ( evento ) => {
//     console.log("Evento RUEDA.");
//     evento.preventDefault();
// });


// document.addEventListener("keydown", ( evento ) => {
//     if( teclas.includes(evento.key) && auxPanel.hidden === false){
//         console.log("Key down");
//         // TODO: revisar el comportamiento
//         // evento.preventDefault();
//     }
// });


// table.addEventListener("keydown", () => {
//     console.log("EVENTO TABLE Keydown: ");
// });

// table.addEventListener("onblur", ( evento ) => {
//     console.log("EVENTO on blur ", evento );
// })


SG010_Button.addEventListener("change", loadSG010_File );
SDS0001_Button.addEventListener("change", loadSDS0001_File) ;
SDS0002_Button.addEventListener("change", loadSDS0002_File) ;
AL010_Button.addEventListener("change", loadAL010_File);
SA021_Button.addEventListener("change", loadSA021_File );
PACKING_LIST_Button.addEventListener("change", loadPackingList_File );
OBS_ESPECIAL_Button.addEventListener("change", loadObservations_File );
previousOrder_Button.addEventListener("change", loadPreviousOrder_File );

loadReportsB.addEventListener("click", ProcessReports );

reduceDataTable.addEventListener("click", reduceDataTableFunction );
tableDataButton.addEventListener("click", copyTable );

// Config params Panel
configPanel.addEventListener("wheel", ( evento ) => {
    evento.preventDefault();
});

configurationB.addEventListener("click", ( evento ) => {
    configPanel.classList.remove("no-visible");
});

configParamsCancel.addEventListener("click", () => {
    configPanel.classList.add("no-visible");
    cleanParamsInputsErrors();
    initParameters();
});

configParamsOk.addEventListener("click", () => {
    try {
        cleanParamsInputsErrors();
        saveParamsvalues();
    
        configPanel.classList.add("no-visible");
        // show data table complete again
        showTable( dataObjectElementsMap );
        tableData.classList.remove("reduced-data");
        
    } catch (error) {
        console.log("ERROR:saveParamsvalues: " + error.message, error );
        alert( error.message );
    }
});

configReduceDataPanelB.addEventListener("click", () => {
    configReduceDataPanel.classList.remove("no-visible");
    configPrioritiesPanel.classList.add("no-visible");
    configReduceDataPanelB.classList.add("custom-button-green");
    configPrioritiesPanelB.classList.remove("custom-button-green");
});

configPrioritiesPanelB.addEventListener("click", () => {
    configReduceDataPanel.classList.add("no-visible");
    configPrioritiesPanel.classList.remove("no-visible");
    configReduceDataPanelB.classList.remove("custom-button-green");
    configPrioritiesPanelB.classList.add("custom-button-green");
});




// *********************************************************
// *********************************************************

window.addEventListener("load", initialize );

// *********************************************************
function initialize() {
    console.log("Cargando datos de configuración...")

    dataObjectElementsMap = new Map();
    dataSDS0001 = [];
    dataSDS0002 = [];
    dataAL010 = [];
    dataSA021 = [];
    dataPackingList = [];
    dataObs = [];
    dataPreviousOrder = [];

    fetch( configDataURL )
    .then((response) => response.json())
    .then(( jsonData ) => {

        console.log("JSON DATA CONFIG: ", jsonData);
        const reportsConfig = new Map();

        jsonData.reports.forEach( element => {
            reportsConfig.set( element.name, element );
        });

        // load shop special locations
        shopSpecialLocations = jsonData.shopSpecialLocations;

        // load config for distinction about products (offer, end cap and season zones)
        typeSpecialProduct = jsonData.typeSpecialProduct;

        // load table reduction parameters
        tableReductionParameters = jsonData.tableReductionParameters;
    
        // load params to identify priorities at the final table.
        priorityParams = jsonData.priorityParams;

        initParameters();

        // load table headers names
        tableHeadersView = jsonData.tableHeadersView;

        // console.log("MAPA de configuraion: ", reportsConfig );

        // reportsConfig hacerlo global para acceso
        reportsConfigMap = reportsConfig;
        drawDownloadIcon( reportsConfig );
    })
    .catch((error) => {
        console.log("ERROR:initialize: " + error.message );
        alert("Fallo al cargar datos de configuración inicial.");
    });

    document.getElementById("version").innerText = version;
    console.log("Versión: ", version );
}


// *********************************************************
// *********************************************************
function initParameters(){

    // init UI table data reduction parameters
    initImputListFieldset( TABLE_REDUCTION_NORMAL_PARAMS, tableReductionParameters.normalParameters );
    initImputListFieldset( TABLE_REDUCTION_OFFER_PARAMS, tableReductionParameters.offerParameters );
    initAvoidIgnoreArticlesWithText( TABLE_REDUCTION_AVOID_TEXT_PARAMS, tableReductionParameters.avoidIgnoreArticlesWithText );

    // init UI Priorities Params
    initImputListFieldset( PRIORITY_PARAMS, priorityParams );
}


// *********************************************************
function loadFile ( evento, report ){

    const file = evento.target.files[0];
    auxPanel.classList.remove("no-visible");

    const filePointer = new ExcelFileOpen(file, report.FILE_EXTENSION_ARRAY, report.FILE_WORKBOOK_SHEET, report.FILE_MYME_TYPE_ARRAY );

    console.log("FILE: ", filePointer.file );

    return new Promise( ( resolve, reject ) => {
        const promiseData = loadExcelFile(filePointer);
        promiseData.then( (response) => {
            console.log("Carga \"" + filePointer.file.name + "\" Finalizada!", response.length); 
            
            showFileNameReport( report.name + "-file-name" , filePointer.file.name);
            resolve( response );
        })
        .catch( (error) => {
            // Delete the file name in the view
            showFileNameReport( report.name + "-file-name" , "");
            reject( error );
        });
    });
}


// *********************************************************
// Function to read 'SG010' Report selected file
function loadSG010_File( evento ) {

    const report = reportsConfigMap.get( REPO_SG010 ); 
    const promise = loadFile( evento, report );   
    promise.then( ( response ) => {

        // validating data structure
        if( !validateReportColumns( response, report.columns )) {
            throw new Error("Validación de datos en '" + report.name + "' fallida!");
        }

        // convert sales locations from number to string
        response = normalizeRecord( response, report.columns[0], 6 );

        // global map variable for export data
        const referencesMap = filterByEsboLocation( response, REFERENCE_SG010, SGF_LOCATION, ESBO_LOCATION );

        dataObjectElementsMap = getLocationsByRef( response, referencesMap, REFERENCE_SG010, SGF_LOCATION, PALLET_QUANTITY );

        dataObjectElementsMap = locationsSpliter( dataObjectElementsMap, ESBO_LOCATION );

        console.log("DATA ARRAY '" + report.name + "': ", dataObjectElementsMap );
    })
    .catch( (error) => {
        console.log("ERROR:loadSG010_File: ", error );
        dataObjectElementsMap = new Map();
        showFileNameReport( ( report.name ) + "-file-name" , "");
        alert(error.message);
    })
    .finally( () => {
        auxPanel.classList.add("no-visible");
    });
}


// *********************************************************
// Function to read 'SDS0001' Report selected file
function loadSDS0001_File ( evento ) {
    
    const report = reportsConfigMap.get( REPO_SDS0001 ); 
    const promise = loadFile( evento, report );   
    promise.then( ( response ) => {

        // validating data structure
        if( !validateReportColumns( response, report.columns )) {
            throw new Error("Validación de datos en '" + report.name + "' fallida!");
        }

        response = normalizeRecord( response, report.columns[1], 8 );
        response = normalizeRecord( response, report.columns[0], 6 );

        // global map variable for export data
        dataSDS0001 = response;
        console.log("DATA ARRAY '" + report.name + "': ", response );
    })
    .catch( (error) => {
        console.log("ERROR:loadSDS0001_File: ", error );
        dataSDS0001 = [];
        showFileNameReport( ( report.name ) + "-file-name" , "");
        alert(error.message);
    })
    .finally( () => {
        auxPanel.classList.add("no-visible");
    });
}


// *********************************************************
// Function to read 'SDS0002' Report selected file
function loadSDS0002_File ( evento ) {
    
    const report = reportsConfigMap.get( REPO_SDS0002 ); 
    const promise = loadFile( evento, report );   
    promise.then( ( response ) => {

        // validating data structure
        if( !validateReportColumns( response, report.columns )) {
            throw new Error("Validación de datos en '" + report.name + "' fallida!");
        }

        response = normalizeRecord( response, report.columns[0], 8 );
        // response = normalizeRecord( response, report.columns[0], 6 );

        // global map variable for export data
        dataSDS0002 = response;
        console.log("DATA ARRAY '" + report.name + "': ", response );
    })
    .catch( (error) => {
        console.log("ERROR:loadSDS0002_File: ", error );
        dataSDS0002 = [];
        showFileNameReport( ( report.name ) + "-file-name" , "");
        alert(error.message);
    })
    .finally( () => {
        auxPanel.classList.add("no-visible");
    });
}


// *********************************************************
// Function to read 'AL010' Report selected file
function loadAL010_File ( evento ) {
    
    const report = reportsConfigMap.get( REPO_AL010 ); 
    const promise = loadFile( evento, report );   
    promise.then( ( response ) => {

        // validating data structure
        if( !validateReportColumns( response, report.columns )) {
            throw new Error("Validación de datos en '" + report.name + "' fallida!");
        }

        response = normalizeRecord( response, report.columns[0], 8 );
        // response = normalizeRecord( response, report.columns[0], 6 );

        // global map variable for export data
        dataAL010 = response;
        console.log("DATA ARRAY '" + report.name + "': ", response );
    })
    .catch( (error) => {
        console.log("ERROR:loadAL010_File: ", error );
        dataAL010 = [];
        showFileNameReport( ( report.name ) + "-file-name" , "");
        alert(error.message);
    })
    .finally( () => {
        auxPanel.classList.add("no-visible");
    });
}


// *********************************************************
// Function to read 'SA021' Report selected file
function loadSA021_File ( evento ) {

    const report = reportsConfigMap.get( REPO_SA021 ); 
    const promise = loadFile( evento, report );   
    promise.then( ( response ) => {

        // validating data structure
        if( !validateReportColumns( response, report.columns )) {
            throw new Error("Validación de datos en '" + report.name + "' fallida!");
        }
        
        response = normalizeRecord( response, report.columns[0], 8 );

        // global map variable for export data
        dataSA021 = response;
        console.log("DATA ARRAY '" + report.name + "': ", response );
    })
    .catch( (error) => {
        console.log("ERROR:loadSA021_File: ", error );
        dataSA021 = [];
        showFileNameReport( ( report.name ) + "-file-name" , "");
        alert(error.message);
    })
    .finally( () => {
        auxPanel.classList.add("no-visible");
    });
}


// *********************************************************
// Function to read 'Packing-List' Report selected file
function loadPackingList_File( evento ){

    const report = reportsConfigMap.get( REPO_PACKING_LIST ); 
    const promise = loadFile( evento, report );   
    promise.then( ( response ) => {

        // validating data structure
        if( !validateReportColumns( response, report.columns )) {
            throw new Error("Validación de datos en '" + report.name + "' fallida!");
        }

        response = normalizeRecord( response, report.columns[0], 8 );

        // global map variable for export data
        dataPackingList = response;
        console.log("DATA ARRAY '" + report.name + "': ", response );
    })
    .catch( (error) => {
        console.log("ERROR:loadObservations_File: ", error );
        dataPackingList = [];
        showFileNameReport( ( report.name ) + "-file-name" , "");
        alert(error.message);
    })
    .finally( () => {
        auxPanel.classList.add("no-visible");
    });
}


// *********************************************************
// Function to read 'Obs Especiales' Report selected file
function loadObservations_File( evento ){

    const report = reportsConfigMap.get( REPO_OBS_ESPECIAL ); 
    const promise = loadFile( evento, report );   
    promise.then( ( response ) => {

        // validating data structure
        if( !compareColumnsArrays( Object.keys( response[0] ), report.columns )){
            throw new Error("Validación de datos en '" + report.name + "' fallida!");
        }

        response = normalizeRecord( response, report.columns[0], 8 );

        // global map variable for export data
        dataObs = response;
        console.log("DATA ARRAY '" + report.name + "': ", response );
    })
    .catch( (error) => {
        console.log("ERROR:loadObservations_File: ", error );
        dataObs = [];
        showFileNameReport( ( report.name ) + "-file-name" , "");
        alert(error.message);
    })
    .finally( () => {
        auxPanel.classList.add("no-visible");
    });
}


// *********************************************************
// Function to read 'Pedido Anterior ESBO' Report selected file
function loadPreviousOrder_File( evento ){

    const report = reportsConfigMap.get( REPO_PREVIOUS_ORDER ); 
    const promise = loadFile( evento, report );   
    promise.then( ( response ) => {

        // validating data structure
        if( !compareColumnsArrays( Object.keys( response[0] ), report.columns )){
            throw new Error("Validación de datos en '" + report.name + "' fallida!");
        }

        response = normalizeRecord( response, report.columns[0], 8 );

        // global map variable for export data
        dataPreviousOrder = response;
        console.log("DATA ARRAY '" + report.name + "': ", response );
    })
    .catch( (error) => {
        console.log("ERROR:loadPreviousOrder_File: ", error );
        dataPreviousOrder = [];
        showFileNameReport( ( report.name ) + "-file-name" , "");
        alert(error.message);
    })
    .finally( () => {
        auxPanel.classList.add("no-visible");
    });
}


// *********************************************************
function ProcessReports() {

    console.log("INFO:ProcessReports: Procesando Reportes función!");

    try {
        if( dataObjectElementsMap.size <= 0 ){
            console.log(`WARNING:ProcessReports: No '${REPO_SG010}' data loaded.`);
            throw new Error(`No se han cargado datos del reporte '${REPO_SG010}'.`);
        }

        // Ask to continue if some report is not provided
        // TODO: enable/disable validation
        if( !forgottenReportsWarning() ){
            return;
        }

        // Integrate 'SDS0001' data into 'dataObjectElementMap'
        dataObjectElementsMap = loadSDS0001Values( dataSDS0001, dataObjectElementsMap, reportsConfigMap.get( REPO_SDS0001 ).columns );
        
        // Integrate 'SDS0002' data into 'dataObjectElementMap'
        dataObjectElementsMap = loadSDS0002Values( dataSDS0002, dataObjectElementsMap, reportsConfigMap.get( REPO_SDS0002 ).columns );
        
        // Integrate 'AL010' data into 'dataObjectElementMap'
        dataObjectElementsMap = loadAL010Values( dataAL010, dataObjectElementsMap, reportsConfigMap.get( REPO_AL010 ).columns );
        
        // Integrate 'SA021' data into 'dataObjectElementMap'
        dataObjectElementsMap = loadSA021Values( dataSA021, dataObjectElementsMap, reportsConfigMap.get( REPO_SA021 ).columns );

        // Integrate 'Packing-List' data into 'dataObjectElementMap'
        dataObjectElementsMap = loadPackingListValues( dataPackingList, dataObjectElementsMap, reportsConfigMap.get( REPO_PACKING_LIST ).columns );
        
        // Integrate 'Obs-Especiales' data into 'dataObjectElementMap'
        dataObjectElementsMap = loadDataObsValues( dataObs, dataObjectElementsMap, reportsConfigMap.get( REPO_OBS_ESPECIAL ).columns );

        // Integrate 'Pedido Anterior ESBO' data into 'dataObjectElementMap'
        dataObjectElementsMap = loadPreviousOrderValues( dataPreviousOrder, dataObjectElementsMap, reportsConfigMap.get( REPO_PREVIOUS_ORDER ).columns );

        // Fill calculated data
        dataObjectElementsMap = setShopAvailibility( dataObjectElementsMap );
        dataObjectElementsMap = setEOQavailable( dataObjectElementsMap );
        dataObjectElementsMap = setStockWeeks( dataObjectElementsMap );

        // Fill column "Type" => Offer, season zone or End Cap
        dataObjectElementsMap.forEach( ( row, key ) => {
            isThisOffer_EndCap_Zone( row );
        });

        // UI updates
        reportsPanel.classList.add("no-visible");
        tableResultsPanel.classList.remove("no-visible");

        showTable( dataObjectElementsMap );
        tableData.classList.remove("reduced-data");
        setCaptureManualEntry();

    } catch (error) {
        console.log(error)
        alert(error.message);
    }
}


// *********************************************************
function forgottenReportsWarning() {

    if( !alertNoReportProvided( dataSDS0001, REPO_SDS0001 )) {
        return false;
    }

    if( !alertNoReportProvided( dataSDS0002, REPO_SDS0002 )) {
        return false;
    }
    
    if( !alertNoReportProvided( dataAL010, REPO_AL010 )) {
        return false;
    }

    if( !alertNoReportProvided( dataSA021, REPO_SA021 )) {
        return false;
    }

    if( !alertNoReportProvided( dataPackingList, REPO_PACKING_LIST )) {
        return false;
    }

    if( !alertNoReportProvided( dataObs, REPO_OBS_ESPECIAL )) {
        return false;
    }
    return true;
}


// *********************************************************
// function that assing event listeners for user entries.
function setCaptureManualEntry(){
    console.log("INFO:setCaptureManualEntry: Setting user input event listener.");

    const nodeList = document.querySelectorAll(".order");

    for ( const node of nodeList ) {
        node.addEventListener("keyup", validateUserInput );
    }
}


// *********************************************************
// Collect info from the user, validate and save into data structure.
function validateUserInput(  ) {

    const quantity = this.innerText.trim();
    const reference = this.id;

    // console.log("Validando: ", this.id, !isNaN( quantity ), Number.parseInt(quantity) );
    try {
        if(isNaN( quantity ) ){
            throw new Error("El valor ingresado debe ser numérico.");
        }

        if( quantity === "" ){
            this.classList.remove("error");
            return;
        }

        if( quantity > dataObjectElementsMap.get( reference ).esboStock.pallets ){
            throw new Error(`La cantidad pedida (${quantity}) supera el stock disponible (${dataObjectElementsMap.get( reference ).esboStock.pallets})`);
        }
    
        // validation == Valid!
        dataObjectElementsMap.get( reference ).type = typeSpecialProduct.manual;
        dataObjectElementsMap.get( reference ).manualOrderQuantity = Number.parseInt(quantity); 
        this.classList.remove("error");    
        console.log(`INFO:validateUserInput: Cantidad Manual (${quantity}) agregada en Referencia (${reference})` );

    } catch (error) {
        console.log("ERROR:validateUserInput: " + error.message, error );        
        alert( error.message );
        this.innerText = "";
        dataObjectElementsMap.get( reference ).manualOrderQuantity = 0;
        dataObjectElementsMap.get( reference ).type = "";
        this.classList.add("error");
        this.focus();
    }
}


// *********************************************************
// function for reduce data rows following some criteria
// NOTE: if is needed to use a different functions than "compareParamsVsValuesLessThanOrEqualTo" for comparison you must 
// change the whole approach of the "reduceDataTableFunction" function!!
function reduceDataTableFunction() {
    console.log("INFO:reduceDataTableFunction: Reduciendo valores de la tabla.");

    let parameters = [];
    const mustCheckQuotes = ( tableReductionParameters.avoidIgnoreArticlesWithText.length <= 0 ) ? false : true;

    const newFilteredDataMap = new Map();

    for (const rowArray of dataObjectElementsMap ) {

        // Add manual row to the data structure
        if( rowArray[1].type === typeSpecialProduct.manual ){
            newFilteredDataMap.set( rowArray[0], rowArray[1] );
            continue;
        }

        // Ignore rows from filter with matching text in quotes column
        if( mustCheckQuotes && isAvoidIgnoreArticlesWithText( rowArray[1], tableReductionParameters.avoidIgnoreArticlesWithText )) {
            newFilteredDataMap.set( rowArray[0], rowArray[1] );
            continue;
        }
        
        // clean type for new calculation
        rowArray[1].type = "";

        // the product (row) is or not an offer! => assign the correct parameters
        if( isThisOffer_EndCap_Zone( rowArray[1] ) ) {
            parameters = tableReductionParameters.offerParameters;
        } else {
            parameters = tableReductionParameters.normalParameters;
        }

        for ( const paramObject in parameters ) {
            if( compareParamsVsValuesLessThanOrEqualTo( paramObject, parameters[paramObject], rowArray[1] ) ){
                newFilteredDataMap.set( rowArray[0], rowArray[1] );
            }
        }
    }
    showTable( newFilteredDataMap );
    tableData.classList.add("reduced-data");
}


// *********************************************************
// Mark if a product has an offer or it have a special location to select the correct params for it. 
function isThisOffer_EndCap_Zone( row ){
    
    if( row.familyPrice !== 0 || row.localPrice !== 0 ){
        // console.log("OFFERTA: ", row );
        row.type += typeSpecialProduct.offer;
        return true;
    }

    if( isEndCap( shopSpecialLocations.endCap, row.salesLocation) ){
        // console.log("Cabecera: ", row );
        row.type += typeSpecialProduct.endCap;
        return true;
    } 

    if( belongsToSeasonZone( shopSpecialLocations.seasonZones, row.salesLocation ) ) {
        // console.log("ZONA: ", row );
        row.type += typeSpecialProduct.seasonZone;
        return true;
    } 

    return false;
}


// *********************************************************
function isEndCap( shopEndCapsLocationsParams, salesLocationItem ) {
    return shopEndCapsLocationsParams.includes( salesLocationItem );
}


// *********************************************************
function belongsToSeasonZone ( shopSeasonZonesParams, salesLocationItem ){
    
    let location = salesLocationItem.substr(0, 4);
    return shopSeasonZonesParams.includes( location );
}


// *********************************************************
function compareParamsVsValuesLessThanOrEqualTo( param, paramValue, rowObject ){

    return ( rowObject[param] <= paramValue ) ? true : false;
}


// *********************************************************
// function to filter a row when a text match with text in row's quote
function isAvoidIgnoreArticlesWithText( row, parametersArray ){

    return parametersArray.includes( row.quotes );
}


// *********************************************************
// function that mark a product with a number of priority for analisys
function analisysPriority ( filteredDataArray ) {

    console.log("INFO:analisysPriority: Ejecutando análisis de prioridades.");
    for ( const row of filteredDataArray ) {

        // 1.	MERCANCIA QUE VIENE DE CAMION O ESBO
        // camion != "" 
        if( row[1].packingListData.length !== 0 ){
            // console.log("P 1", row[0]);
            row[1].analisysPriority = 1;
            continue;
        }
    
        // 2.	SEMANAS STOCK POR DEBAJO DE 1
        // stockWeeks <= 1
        if( row[1].stockWeeks <= priorityParams.stockWeeks ) {
            // console.log("P 2", row[0]);
            row[1].analisysPriority = 2;
            continue;
        }
        
        // 3.	MARKET POR DEBAJO DE 1 EOQ
        // if MV == 0 & EOQ <= 1
        if( (row[1].salesMethod === MV0 && row[1].eoqQty <= priorityParams.marketEoqQty )) {
            // console.log("P 3", row[0]);
            row[1].analisysPriority = 3;
            continue;
        }

        // 4.	MARKET 1 PALLET O MENOS EN EL AIRE
        // MV == 0 & shopStock.pallets <= 1
        if( (row[1].salesMethod === MV0 && row[1].shopStock.pallets <= priorityParams.shopStockPallets )) {
            // console.log("P 4", row[0]);
            row[1].analisysPriority = 4;
            continue;
        }

        // 5.	AUTO FULL POR DEBAJO 1 EOQ
        // MV == 1 || MV == 2 & EOQ <= 1
        if( (row[1].salesMethod === MV1 || row[1].salesMethod === MV2) && row[1].eoqQty <= priorityParams.selfWarehouseEoqQty ) {
            // console.log("P 5", row[0]);
            row[1].analisysPriority = 5;
            continue;
        }

        // 6.	AUTO FULL NINGUN PALLET EN EL AIRE
        // MV == 1 || MV == 2 &  shopStock.pallets <= 0
        if( (row[1].salesMethod === MV1 || row[1].salesMethod === MV2) && row[1].shopStock.pallets <= priorityParams.selfWarehouseSgfPallets ) {
            // console.log("P 6", row[0]);
            row[1].analisysPriority = 6;
            continue;
        }

        // 7.	ARTICULOS CON STOCK EN TIENDA INFERIOR A 6 UNDS
        // availableShopStock <= 6 unds    
        if( row[1].availableShopStock <= priorityParams.totalUnits ) {
            // console.log("P 7", row[0]);
            row[1].analisysPriority = 7;
            continue;
        }

        // 8.	RESTO DE ARTICULOS
        // value already assigned
        // console.log("**************************************");
    }
    
    // console.log("Analisis Priority: ", filteredDataArray);
    return filteredDataArray;
}


// *********************************************************
function copyTable( evento ){

    console.log("EVENTO: ", evento );
    const table = document.getElementById("table");
    const tableHeaders = document.getElementById( "table-headers" );

    tableHeaders.classList.add("no-visible");
    copyElement( table );
    tableHeaders.classList.remove("no-visible");
}


// *********************************************************
// Function to 'copy' a DOM node into the clipboard. 
function copyElement( element ){
    console.log("Copy ELEMENT: ", element);

    // clear all selection made before
    window.getSelection().removeAllRanges();

    let result = false;

    let range = document.createRange();
    range.selectNode( element );
    window.getSelection().addRange(range);
    
    try {
        result = document.execCommand('copy');
        console.log("Resultado de la copia: ", result );
        window.getSelection().removeAllRanges();
    } catch (error) {
        console.log("ERROR:copyElement: Problema al copiar el elemento.", result);
        alert("Problema al copiar el elemento.");
    }
}


// *********************************************************
function alertNoReportProvided( dataArray, reportName ) {
    if( dataArray.length <= 0 ){
        const message = `No se ha cargado el reporte '${reportName}', Desea continuar?`;
        console.log("WARNING:alertNoReportProvided: " + message);
        return confirm(message);
    }
    return true;
}


// *********************************************************
// function for assigment a pallet between ESBO or SGF stock
function locationsSpliter( dataMap, esboLocation ) {

    for (const element of dataMap.entries() ) {
        
        const esboStock = {
            stock : 0,
            pallets : 0
        }
        
        const shopStock = {
            stock : 0,
            pallets : 0
        }
        
        for ( const location of element[1].locations ) {
            
            if( location.palletLocation === esboLocation ){
                esboStock.stock += location.palletQuantity;
                esboStock.pallets++;
                
            } else {
                shopStock.stock += location.palletQuantity;
                shopStock.pallets++;
            }
        }

        dataMap.get( element[0] ).setShopAndEsboStockPallets( shopStock, esboStock );
    }
    return dataMap;
}


// *********************************************************
function setShopAvailibility ( dataMap ){

    for (const ref of dataMap.keys() ) {

        dataMap.get( ref ).setAvailableShopStock();
    }
    return dataMap;
}


// *********************************************************
function setEOQavailable( dataMap ){

    for ( const ref of dataMap.keys() ) {

        dataMap.get( ref ).setEoqQty();
    }
    return dataMap;
}


// *********************************************************
function setStockWeeks( dataMap ){
    
    for (const ref of dataMap.keys() ) {
        dataMap.get( ref ).setStockWeeks();
    }
    return dataMap;
}


// *********************************************************


// *********************************************************
// *********************************************************
// *********************************************************
