
'use strict';

// *********************************************************
// *********************************************************
// VARIABLES AND CONSTANTS






// *********************************************************
// Compare if all mandatory columns exist into the data object(keys array)
// And first and last row are the same
function validateReportColumns( data, columnsArray ){

    const keys = [];

    // verifiy the first and the last line of data
    keys[0] = Object.keys(data[0]);
    keys[1] = Object.keys(data[( data.length - 1 ) ]);

    if( keys[0].length !== keys[1].length ){
        return false;
    }

    for (const row of keys) {
        if( !compareColumnsArrays( row, columnsArray ) ) {
            return false;
        }    
    }

    return true;
}


// *********************************************************
function compareColumnsArrays( objectKeysArray, mandatoryColumns ){

    for (const column of mandatoryColumns ) {
        if( !objectKeysArray.includes( column )) {
            console.log("Columna no encontrada '" + column + "'");
            return false;
        }
    }

    return true;
}


// *********************************************************
function normalizeRecord ( dataArray, refColumn, stringSize ){

    for (let index = 0; index < dataArray.length; index++) {

        const reference = String( dataArray[index][refColumn]).padStart( stringSize, "0");
        dataArray[index][refColumn] = reference;
    }
    return dataArray;
}


// *********************************************************
function filterByEsboLocation( dataArray, reference, columnSgfLocation, esboLocation ) {

    const referencesMap = new Map();
    for ( const row of dataArray ) {

        if( row[columnSgfLocation] === esboLocation ){

            referencesMap.set( row[reference], new dataObjectElement() );
        }
    }
    return referencesMap;
}


// *********************************************************
function getLocationsByRef( response, referencesMap, reference, columnSgfLocation, palletQuantity ) {

    for ( const row of response ) {

        if( referencesMap.has( row[reference] )){

            const palletLocation = { 
                "palletLocation" : row[ columnSgfLocation ],
                "palletQuantity" : row[ palletQuantity ] 
            };
            
            referencesMap.get( row[reference] ).locations.push( palletLocation );
        }
    }
    return referencesMap;
}


// *********************************************************
function loadSDS0001Values(SDS0001DataArray, dataObjectElements, columns) {

    for (const row of SDS0001DataArray ) {
        
        if( dataObjectElements.has( row[ columns[1]] ) ){
            
            dataObjectElements.get( row[columns[1]])
                .setSDS0001Values( 
                    //H_SLID
                    row[columns[0]], 
                    // ARTNO
                    row[columns[1]],
                    // ARTNAME_UNICODE
                    row[columns[2]],
                    // SALESMETHOD
                    row[columns[3]],
                    // OP_FC_CURR
                    row[columns[5]],
                    // AVGSALES
                    row[columns[6]],
                    // AVAIL_STOCK
                    row[columns[7]],
                    // ASSQ
                    row[columns[4]],
                    // ITEM_VOL
                    row[columns[9]],
                    // PALQ
                    row[columns[10]]
                );
        }
    }
    return dataObjectElements;
}


// *********************************************************
// Load values from "SDS0002" Report
function loadSDS0002Values(SDS0002DataArray, dataObjectElements, columns) {

    const newFilteredArray = filterArray(SDS0002DataArray, columns[1], FORECAST_TYPE_SDS0002 );

    for (const row of newFilteredArray ) {
        
        if( dataObjectElements.has( row[ columns[0]] ) ){
            
            dataObjectElements.get( row[columns[0]])
                .setSDS0002Values( 
                    row[columns[2]],
                    row[columns[3]]
                );
        }
    }
    return dataObjectElements;
}


// *********************************************************
// function to integrate "AL010" values into data strcuture map
function loadAL010Values(AL010DataArray, dataMap, columns) {
    
    for ( const row of AL010DataArray ) {
        if( dataMap.has( row[ columns[0] ])) {
            dataMap.get( row[ columns[0] ]).
                setAL010Values( 
                    row[ columns[1] ], 
                    row[ columns[2] ] 
                );
        }
    }
    return dataMap;
}


// *********************************************************
function loadSA021Values(SA021DataArray, dataMap, columns) {

    for ( const row of SA021DataArray ) {
        if( dataMap.has( row[ columns[0] ])) {

            dataMap.get( row[ columns[0] ]).
                setSA021Values( 
                    // QTYSOLDTHISWEEK
                    row[ columns[2] ], 
                    // QTYSOLDLASTWEEK 
                    row[ columns[3] ], 
                    // EXPSALE
                    row[ columns[1] ]
                );
        }
    }
    return dataMap;
}


// *********************************************************
function loadPackingListValues( packingListDataArray, dataMap, columns ) {

    for ( const row of packingListDataArray ) {
        if( dataMap.has( row[ columns[0] ])) {

            dataMap.get( row[ columns[0] ]).
                setPackingListValues(
                    row[ columns[1] ]
                );
        }
    }
    return dataMap;
}


// *********************************************************
function loadDataObsValues ( dataObsDataArray, dataMap, columns ) {
    
    for ( const row of dataObsDataArray ) {

        if( dataMap.has( row[ columns[0] ])) {
            dataMap.get( row[ columns[0] ]).
                setDataObsValues( 
                    row[ columns[1] ]
                );
        }
    }
    return dataMap;
}


// *********************************************************
// Integrate 'Pedido Anterior ESBO' data into 'dataObjectElementMap'
function loadPreviousOrderValues ( previousOrderDataArray, dataMap, columns ) {

    for ( const row of previousOrderDataArray ) {

        if( dataMap.has( row[ columns[0] ])) {
            
            dataMap.get( row[ columns[0] ]).
                setPreviousOrderValues( 
                    row[ columns[1] ]
                );
        }
    }
    return dataMap;
}


// *********************************************************
function filterArray ( dataArray, column, value ) {

    const newFilteredDataArray = [];
    dataArray.forEach( row => {
        if( row [ column ] === value ){
            newFilteredDataArray.push( row );
        }
    });
    return newFilteredDataArray;
}

// *********************************************************
// *********************************************************
// *********************************************************
