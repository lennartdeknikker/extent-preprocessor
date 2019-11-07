const fs = require('fs')

// input and output definitions
const outputFileName = 'output/jsonData'
const rawData = JSON.parse(fs.readFileSync('./input/rawData.json', 'utf8'));
const bindings = rawData.results.bindings;

let dataArray = [];

// Push all relevant data in an array of objects 
// with identifier and extent as properties
bindings.forEach(result => {
    let newObject = {
        identifier: result.identifier.value,
        extent: result.extentSample.value
    } 
    dataArray.push(newObject);
});

// Loop over all objects
dataArray.forEach(entry => {
    let precise = true;
    let weight = '';
    // remove text between brackets
    entry.extent = entry.extent.replace(/ *\([^)]*\) */g, '');
    // remove text after semicolons
    if (entry.extent.includes(';')) {
        let semicolonPosition = entry.extent.indexOf(';')
        weight = entry.extent.substring(semicolonPosition+1,entry.extent.length);
        entry.extent = entry.extent.substring(0, semicolonPosition);
    }
    // remove measuring units, since it's all in cm's
    if (entry.extent.includes('cm')) {
        entry.extent = entry.extent.replace('cm','');
    }
    // replace 'circa' as identifier of possible divergence
    // with a 'precise' property on extent.
    if (entry.extent.includes('circa')) {
        entry.extent = entry.extent.replace('circa','');
        precise = false;
    }
    // replace stupid alternative x-characters
    if (entry.extent.includes('×')) {
        while (entry.extent.includes('×')) {
        entry.extent = entry.extent.replace('×', 'x');
        }
    }
    
    // split length, width and height in different properties.
    [length = '', width = '', height = ''] = entry.extent.split('x');

    // add metric units
    if (length != '') length +=' cm';
    if (width != '') width +=' cm';
    if (height != '') height +=' cm';

    // redefine extent
    entry.extent = {
        length: length.trim(),
        width: width.trim(),
        height: height.trim(),
        weight: weight.trim(),
        precise: precise
    }
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