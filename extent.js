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

// Push all relevant data in an array of objects 
// with identifier and extent as properties
bindings.forEach(result => {
    let newObject = {
        identifier: result.identifier.value,
        extent: {
            oldValue: result.extentSample.value,
            size: {
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
//     let exact = true;
//     let weight = '';
// remove text between brackets
entry.extent.oldValue = removeTextBetweenBrackets(entry.extent.oldValue);
// remove text after semicolons
if (entry.extent.oldValue.includes(';')) {
    entry.extent = subtractWeightFrom(entry.extent);
}
// remove measuring units, since it's all in cm's
if (entry.extent.oldValue.includes('cm')) {
    entry.extent.oldValue = deleteUnitNotationFrom(entry.extent.oldValue);
}
// replace 'circa' as identifier of possible divergence
// with a 'exact' property on extent.
if (entry.extent.oldValue.includes('circa')) {
    subtractPrecisionFrom(entry.extent);
}
// replace stupid alternative x-characters
if (entry.extent.oldValue.includes('×')) {
    entry.extent.oldValue = normalizeXCharactersIn(entry.extent.oldValue);
}
// replace ',' with '.'
if (entry.extent.oldValue.includes(',')) {
    entry.extent.oldValue = replaceCommasIn(entry.extent.oldValue)
}

// split length, width and height in different properties.
subtractSizeValuesFrom(entry.extent);

// remove the old values.
delete entry.extent.oldValue;

});

// write file to output folder
writeDataFile(dataArray);

// copied from: https://github.com/Razpudding/preprocessing-survey/blob/master/preprocessing.js
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

function subtractPrecisionFrom(extent) {
    let newExtent = extent;
    newExtent.exact = false;
    newExtent.oldValue = extent.oldValue.replace('circa','');
    return newExtent;
}

function normalizeXCharactersIn(oldValue) {
    let newValue = oldValue;    
    while (newValue.includes('×')) {
        newValue = newValue.replace('×', 'x');
    }
    return newValue;
}

function replaceCommasIn(oldValue) {
    let newValue = oldValue;
    while (newValue.includes(',')) {
        newValue = newValue.replace(',', '.');
    }
    return newValue;
}

function subtractSizeValuesFrom(extent) {
let newExtent = extent;
[length = '', width = '', height = ''] = extent.oldValue.split('x');
newExtent.size.length = stringToNumber(length);
newExtent.size.width = stringToNumber(width);
newExtent.size.height = stringToNumber(height);
return newExtent;
}
