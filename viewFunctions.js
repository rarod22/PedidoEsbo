

'use strict';

const SVG_ICON = '<path d="M256 464a208 208 0 1 1 0-416 208 208 0 1 1 0 416zM256 0a256 256 0 1 0 0 512A256 256 0 1 0 256 0zM376.9 294.6c4.5-4.2 7.1-10.1 7.1-16.3c0-12.3-10-22.3-22.3-22.3L304 256l0-96c0-17.7-14.3-32-32-32l-32 0c-17.7 0-32 14.3-32 32l0 96-57.7 0C138 256 128 266 128 278.3c0 6.2 2.6 12.1 7.1 16.3l107.1 99.9c3.8 3.5 8.7 5.5 13.8 5.5s10.1-2 13.8-5.5l107.1-99.9z"/>';


// *********************************************************
// function to change dot for decimal number into a comma for Excel format
function replaceDotPerComma ( dataNumber ) {

    if( dataNumber === NaN ){
        return dataNumber;
    }

    let dataString = String (dataNumber);
    return dataString.replace( ".", ",");
}


// *********************************************************
// function to draw report buttons in the first page
function drawDownloadIcon ( configDataMap ){

    const svgList = document.querySelectorAll(".svg-icon");
    
    for (const linkElement of svgList ) {
        
        const idReport = linkElement.id.replace("-icon", "");
        linkElement.href = configDataMap.get( idReport ).url;
        linkElement.title = "Descargar Reporte " + configDataMap.get( idReport ).name;
        linkElement.firstElementChild.innerHTML = SVG_ICON;
    }
}


// *********************************************************
function drawTableHeaders ( headers ) {

    let htmlHeaders = "";

    htmlHeaders += "<tr>"; 

    headers.forEach( ( cell ) => {
        htmlHeaders += "<th><span>" + cell + "</span></th>";
    });

    htmlHeaders += "</tr>";

    return htmlHeaders;
}


// *********************************************************
function drawTableRow ( row, key ) {

    // console.log("FILA ", row);

    let htmlRow = "";

    // Ref
    htmlRow += "<td>";
    htmlRow += key;
    htmlRow += "</td>";

    // Name
    htmlRow += "<td class='text-left' >";
    htmlRow += row.name;
    htmlRow += "</td>";

    // averageSale
    htmlRow += "<td>";
    // htmlRow += row.averageSale;
    htmlRow += "";
    htmlRow += "</td>";

    // current Forecast Value
    htmlRow += "<td title='Venta media: " + row.averageSale + " / Last Week: " + row.lastWkSales + "'>";
    htmlRow += replaceDotPerComma( row.currentForecastValue );
    htmlRow += "</td>";

    // this Week Sales
    htmlRow += "<td>";
    htmlRow += replaceDotPerComma( row.thisWkSales );
    htmlRow += "</td>";

    // forecast for next week
    htmlRow += "<td>";
    htmlRow += replaceDotPerComma( row.wk2FCO) ;
    htmlRow += "</td>";

    // stock weeks
    htmlRow += "<td class='stockWeeksHighligter'>";
    htmlRow += replaceDotPerComma( row.stockWeeks.toFixed(2) );
    htmlRow += "</td>";

    // EOQ -> ASSQ
    htmlRow += "<td>";
    htmlRow += replaceDotPerComma( row.eoq );
    htmlRow += "</td>";

    // Num EOQ%
    htmlRow += "<td>";
    htmlRow += replaceDotPerComma( row.eoqQty.toFixed(2) );
    htmlRow += "</td>";

    // Pallet Quantity
    htmlRow += "<td>";
    htmlRow += replaceDotPerComma( row.palletQty );
    htmlRow += "</td>";

    // Shop Available stock
    htmlRow += "<td class='shop-available-stock-higlighter' title='Stock Disponible total en tienda (LV + SGF)' >";
    htmlRow += replaceDotPerComma( row.availableShopStock );
    htmlRow += "</td>";
    
    // pallets SGF
    htmlRow += "<td>";
    htmlRow += replaceDotPerComma( row.shopStock.pallets );
    htmlRow += "</td>";

    // Pedir
    const value = ( row.type === typeSpecialProduct.manual ) ? row.manualOrderQuantity : "";
    htmlRow += `<td id='${key}' contentEditable='true' class='order' title='Rango 0 - ${row.esboStock.pallets}' >`; 
    htmlRow += value;
    htmlRow += "</td>";

    // Packing List
    htmlRow += "<td>";
    htmlRow += replaceDotPerComma( row.packingListData.toString() );
    htmlRow += "</td>";

    // Stock ESBO
    htmlRow += "<td title='" + row.esboStock.stock + " unds.'>";
    htmlRow += replaceDotPerComma( row.esboStock.pallets );
    htmlRow += "</td>";

    // LV
    htmlRow += "<td>";
    htmlRow += replaceDotPerComma( row.salesLocation );
    htmlRow += "</td>";

    // Obs Especiales
    htmlRow += "<td class='text-left'>";
    htmlRow += row.quotes;
    htmlRow += "</td>";

    // Analisis column
    htmlRow += "<td>"; 
    htmlRow += row.analisysPriority;
    htmlRow += "</td>"; 

    // Offer-type Column
    htmlRow += "<td>"; 
    htmlRow += row.type;
    htmlRow += "</td>"; 
        
    return htmlRow;
}


// *********************************************************
function drawTableData ( dataMap ) {

    let htmlDataTable = "";
    
    dataMap.forEach( ( object, key ) => {
        htmlDataTable += "<tr class='centrar' data-reference=" + key + " >" + drawTableRow( object, key ) + "</tr>";
    });
    return htmlDataTable;
}


// *********************************************************
function showTable( dataElementsMap ) {
    console.log("ShowTable items: ", dataElementsMap.size );
    analisysPriority( dataElementsMap );

    tableDataButton.textContent = "Copiar " + dataElementsMap.size;

    tableHeaders.innerHTML = drawTableHeaders( tableHeadersView );

    tableData.innerHTML = drawTableData( dataElementsMap );

    setCaptureManualEntry();
}


// *********************************************************
function showFileNameReport  ( idElement, text ) {
    document.getElementById(idElement).innerText = text;
}


// *********************************************************
function initImputListFieldset( idFieldsetElement, parameters ){
    
    const inputslist = document.getElementById(idFieldsetElement).querySelectorAll("input");

    for (const inputElement of inputslist) {
        inputElement.value = getFindVariable(inputElement.id.split("-")[0], parameters );
    }
}


// *********************************************************
function getFindVariable( parameter, objectParams ){

    if(objectParams.hasOwnProperty( parameter )){
        return objectParams[parameter];
    }
    return undefined;
}


// *********************************************************
function initAvoidIgnoreArticlesWithText( inputElementId, paramTextArray ){

    const inputElement = document.getElementById(inputElementId);
    inputElement.value = "";
    for ( const text of paramTextArray ) {
        inputElement.value += text + ";";
    }
}


// *********************************************************
function saveParamsvalues() {

    saveInputListValues( TABLE_REDUCTION_NORMAL_PARAMS, tableReductionParameters.normalParameters );
    saveInputListValues( TABLE_REDUCTION_OFFER_PARAMS, tableReductionParameters.offerParameters );
    saveInputListValues( PRIORITY_PARAMS, priorityParams );

    tableReductionParameters.avoidIgnoreArticlesWithText = saveAvoidIgnoreArticlesWithText( TABLE_REDUCTION_AVOID_TEXT_PARAMS );

    console.log("Parametros reduce table: ", tableReductionParameters );
    console.log("Parametros de prioridad: ", priorityParams);
}


// *********************************************************
function saveInputListValues( fielsetId, parameters ){
    
    const inputList = document.getElementById(fielsetId).querySelectorAll("input");
    
    for ( const inputElement of inputList ) {
        const objectMember = inputElement.id.split("-")[0];
        if( !parameters.hasOwnProperty( objectMember ) ) {
            throw new Error("No fue posible almacenar la propiedad: " + inputElement.id );
        }
        parameters[ objectMember ] = assignUserValueToInput( inputElement, objectMember );
    }
}


// *********************************************************
function assignUserValueToInput( inputElement, objectMember ){

    inputElement.value = inputElement.value.trim();

    if( !validateNumericUserInput( inputElement.value )) {
        inputElement.classList.add("error");
        inputElement.focus();
        throw new Error("El valor dado ( " + objectMember + " ) NO es un número válido.");
    }
    return inputElement.value;
}


// *********************************************************
function validateNumericUserInput( value ){
    
    console.log("Valor a validar: ", value, !isNaN(value) );

    if( isNaN(value) || value === "" ) {
        return false;
    }
    return true;
}


// *********************************************************
function saveAvoidIgnoreArticlesWithText( inputId ){

    const parameters = document.getElementById( inputId ).value.split(";");
    const filterParams = [];

    while ( parameters.length > 0) {
        const param = parameters.shift();
        if( param !== "" ){
            filterParams.push( param );
        }
    }

    return filterParams;
}


// *********************************************************
function cleanParamsInputsErrors(){

    const inputslist = document.getElementById("config-panel-cards");
    for ( const element of inputslist.querySelectorAll("input") ) {
        element.classList.remove("error");
    }
}
// *********************************************************






