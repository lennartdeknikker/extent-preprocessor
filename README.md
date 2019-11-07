# Preprocessor for Extent Data
This script is used to process extent properties obtained from the [Volkenkunde Museum](https://www.volkenkunde.nl/en)'s collection data.
The extent data does not come back in a universal format. 
### Some examples
- circa 124 x 17 x 18 cm (48 13/16 x 6 11/16in.)
- 88,5 \u00D7 31 \u00D7 21,5cm ; 60 kg
- 82 cm

This script transforms all extent data to the same format.


## File structure
### Input (.json)
```
{ "head": { "link": [], "vars": ["identifier", "extentSample"] },
  "results": { "distinct": false, "ordered": true, "bindings": [
    { "identifier": { "type": "literal", "value": "AB-1234-56" },
    "extentSample": { "type": "literal", "value": "circa 124 x 17 x 18 cm (48 13/16 x 6 11/16in.); 60 kg" }},
    ...
    ] } 
}
```

### Output (.json)
```
[
    {
        "identifier": "AB-1234-56",
        "extent": {
            "length": "124 cm",
            "width": "17 cm",
            "height": "18 cm",
            "weight": "60 kg",
            "precise": false
        }
     },
        ...
]
```

## Usage
1. Clone this repo to your local environment.
2. Install dependencies using `npm install`
3. Create an input and an output folder.
4. Add a .json file with your input data.
5. Run the script with `node extent.js`.
6. Check out the result in the output folder.


## Query example
The input data, this script is built to work on, can be obtained from Volkenkunde's database by SPARQL queries like this one:
```
PREFIX dc: <http://purl.org/dc/elements/1.1/>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX edm: <http://www.europeana.eu/schemas/edm/>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>

SELECT ?identifier 
(SAMPLE(?extent) AS ?extentSample)
WHERE {
   	<https://hdl.handle.net/20.500.11840/termmaster7745> skos:narrower* ?place .
   	?place skos:prefLabel ?placeName .

  VALUES ?type { "Voorouderbeelden" "Voorouderbeeld" "voorouderbeelden" "voorouderbeeld" }
  
  	?cho dct:spatial ?place ;
         dc:type ?type ;
         dc:description ?description ;
         dct:medium ?medium ;
         foaf:depiction ?depiction ;
         dct:extent ?extent ;
         dc:subject ?subject; 
         edm:isRelatedTo ?related ;
         dc:identifier ?identifier .
}
GROUP BY ?identifier
```
