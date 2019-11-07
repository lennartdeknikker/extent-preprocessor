const fs = require('fs');

// input and output definitions
const outputFileName = 'output/jsonData';
const rawData = JSON.parse(fs.readFileSync('./input/rawData.json', 'utf8'));
const bindings = rawData.results.bindings;

// string manipulation functions
const removeTextBetweenBrackets = x => x.replace(/ *\([^)]*\) */g, '');
const deleteUnitNotationFrom = oldValue => oldValue.replace('cm','');
const stringToNumber = x => Number(x.trim());

let dataArray = [];

// Pushes all relevant data in an array of objects 
// with the necessary new properties
bindings.forEach(result => {
    let newObject = {
        identifier: result.identifier.value,
        extent: {
            oldValue: result.extentSample.value,
            dimensions: {
                length: null,
                width: null,
                height: null,
                unit: 'cm'
            },
            weight: {
                value: null,
                unit: ''
            },
            exact: true
        } 
    } 
    dataArray.push(newObject);
});

// Loop over all objects
dataArray.forEach(entry => {

    // removes redundant data from the old values.
    entry.extent.oldValue = removeTextBetweenBrackets(entry.extent.oldValue);

    // tests for weight data and stores those in different properties.
    if (entry.extent.oldValue.includes(';')) {
        entry.extent = subtractWeightFrom(entry.extent);
    }
    // tests for measuring units and removes those, since it's all in cm anyway.
    if (entry.extent.oldValue.includes('cm')) {
        entry.extent.oldValue = deleteUnitNotationFrom(entry.extent.oldValue);
    }
    // tests for circa as identifier of possible divergence and
    // replaces 'circa' with a false 'exact' property on extent.
    if (entry.extent.oldValue.includes('circa')) {
        subtractPrecisionFrom(entry.extent);
    }
    // tests for stupid alternative x-characters and replaces those with 'x's
    if (entry.extent.oldValue.includes('×')) {
        entry.extent.oldValue = normalizeXCharactersIn(entry.extent.oldValue);
    }
    // tests for ','s and replaces those with '.'s
    if (entry.extent.oldValue.includes(',')) {
        entry.extent.oldValue = replaceCommasIn(entry.extent.oldValue)
    }
    // splits length, width and height in different properties.
    subtractDimensionValuesFrom(entry.extent);

    // removes the old values.
    delete entry.extent.oldValue;

});

// writes the file to output folder.
writeDataFile(dataArray);

// subtracts weight data from the old value and stores them in weight properties.
function subtractWeightFrom(extent) {
    let newExtent = extent;
    const semicolonPosition = extent.oldValue.indexOf(';')
    const weightText = extent.oldValue.substring(semicolonPosition+1, extent.length);
    const remainingText = extent.oldValue.substring(0, semicolonPosition);
    const weightNumber = weightText.replace(/[^0-9\.]+/g, "");
    const weightUnit = weightText.replace(/\d+/g,'');
    newExtent.oldValue = remainingText;
    newExtent.weight.value = weightNumber;
    newExtent.weight.unit = weightUnit;
    return newExtent;
}

// changes exact property to false when the old value says 'circa'.
function subtractPrecisionFrom(extent) {
    let newExtent = extent;
    newExtent.exact = false;
    newExtent.oldValue = extent.oldValue.replace('circa','');
    return newExtent;
}

// changes strange alternative x-characters to normal 'x's
function normalizeXCharactersIn(oldValue) {
    let newValue = oldValue;    
    while (newValue.includes('×')) {
        newValue = newValue.replace('×', 'x');
    }
    return newValue;
}

// replaces commas in old numeric values to '.'s, so those values can be transformed to numbers.
function replaceCommasIn(oldValue) {
    let newValue = oldValue;
    while (newValue.includes(',')) {
        newValue = newValue.replace(',', '.');
    }
    return newValue;
}

// subtracts the dimension values from the old value and splits them in different properties.
function subtractDimensionValuesFrom(extent) {
let newExtent = extent;
[length = '', width = '', height = ''] = extent.oldValue.split('x');
newExtent.dimensions.length = stringToNumber(length);
newExtent.dimensions.width = stringToNumber(width);
newExtent.dimensions.height = stringToNumber(height);
return newExtent;
}

// copied from: https://github.com/Razpudding/preprocessing-survey/blob/master/preprocessing.js
// writes the transformed array to a .json file.
function writeDataFile(data, fileIndex = 0)
{
	fs.writeFile(outputFileName +'_'+ fileIndex +'.json',
				JSON.stringify(data, null, 4),
				{ encoding:'utf8', flag:'wx' },
				function (err) {
	    //Check if filename already exists, if it does, increase the number at the end by 1
	    if (err && err.code == 'EEXIST') {	
	    	writeDataFile(data, ++fileIndex)
	    } else if(err){
	        return console.log(err)
	    } else {
	    	console.log('The file was saved!')
	    }
	})
}