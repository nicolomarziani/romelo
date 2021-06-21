// Methods and jQuery UI for Wax search box
function excerptedString(str) {
  str = str || ''; // handle null > string
  if (str.length < 40) {
    return str;
  }
  else {
    return `${str.substring(0, 40)} ...`;
  }
}

function getThumbnail(item, url) {
  if ('thumbnail' in item) {
    return `<img class='sq-thumb-sm' src='${url}${item.thumbnail}'/>&nbsp;&nbsp;&nbsp;`
  }
  else {
    return '';
  }
}

function displayResult(item, fields, url, store) {
  var pid   = item.pid;
  var label = item.label || 'Untitled';
  // var link  = store[item["dds_id"]].permalink;
  var link = getRecordByPID(store, item.pid).permalink.toLowerCase();
  var thumb = getThumbnail(item, url);
  var meta  = []

  for (i in fields) {
    fieldLabel = fields[i];
    if (fieldLabel in item ) {
      meta.push(`<b>${fieldLabel}:</b> ${excerptedString(item[fieldLabel])}`);
    }
  }
  return `<div class="result"><a href="${url}${link}">${thumb}<p><span class="title">${item.label}</span><br><span class="meta">${meta.join(' | ')}</span></p></a></div>`;
}

function isEquiv(result1, result2){
  return result1["lunr_id"] == result2["lunr_id"] ? true : false
}

function makeUnique(resultSet){
  let payload = [];
  for(let i = 0; i < resultSet.length - 1; i++){
    let include = true;
    for(let j = i + 1; j < resultSet.length; j++){
      if(isEquiv(resultSet[i], resultSet[j])){
        include = false;
        break;
      }
    }
    if(include){
      payload.push(resultSet[i]);
    }
  }
  return payload;
}

function getIntersection(resultSet1, resultSet2){
  let intersection = [];
  resultSet1.forEach((result1) => {
    for(let result2 of resultSet2){
      if(isEquiv(result1, result2)){
        intersection.push(result1);
        break;
      }
    }
  });
  return intersection;
}

function startSearchUI(fields, indexFile, url) {
  $.getJSON(indexFile, function(store) {

    var index  = new elasticlunr.Index;

    index.saveDocument(false);
    index.setRef('lunr_id');

    for (i in fields) { index.addField(fields[i]); }
    for (i in store)  { index.addDoc(store[i]); }

    $('input#search').on('keyup', function() {
      var results_div = $('#results');
      var query       = $(this).val();
      var results     = index.search(query, { boolean: 'AND', expand: true });

      results_div.empty();
      results_div.append(`<p class="results-info">Displaying ${results.length} results</p>`);

      for (var r in results) {
        var ref    = results[r].ref;
        var item   = store[ref];
        var result = displayResult(item, fields, url);

        results_div.append(result);
      }
    });
  });
}

function isLeaf(obj){
  return (typeof obj === "object" && obj != null) ? false : true;
}

function flattenData(data, delineator = " ||| ", parentName = false, payload = {}){
  if (isLeaf(data) ){
    payload[parentName] = data;
  }
  else if (Array.isArray(data)) {
    data.forEach((item) => {
      let nestedObject = flattenData(item, delineator, parentName, payload);
      Object.keys(nestedObject).forEach((key) => {
        payload[key] = nestedObject[key];
      });
    });
  } else {
    Object.keys(data).forEach((key) => {
      fieldName = parentName ? `${parentName}.${key}` : key;
      if (isLeaf(data[key])) {
        payload[fieldName] = Object.keys(payload).includes(fieldName) ? `${payload[fieldName]}${delineator}${data[key]}` : data[key]; 
      } else {
        let nestedObject = flattenData(data[key], delineator, fieldName, payload);
        Object.keys(nestedObject).forEach((key) => {
          payload[key] = nestedObject[key];
        });
      }
    });
  }
  return payload
}

function recursiveSearch(nugget, data, placeholder){
  let index  = new elasticlunr.Index;
  index.saveDocument(false);
  index.setRef('lunr_id');
  index.addField(nugget[0][0]);
  for (i in data)  { 
    data[i]["lunr_id"] = i;
    index.addDoc(data[i]); 
  }
  let results;
  if(nugget[0][1] == placeholder){
    results = data;
  } else {
    let preresults = index.search(nugget[0][1], { bool: 'AND', expand: true }); 
    results = []
    preresults.forEach((result) => {
      console.log("result", result);
      results.push(data[result.ref]);
    });
  } 
  if(nugget.length == 1){
    console.log("results ", results)
    return results
  } else {
    return recursiveSearch(nugget.slice(1), results, placeholder)
  }
}

function unionSearch(nugget, data){ // nugget = [{field: fieldName, text: searchTerm}, ...]
  let results = [];
  let index;
  nugget.forEach((term) => {
    index = new elasticlunr.Index;
    index.saveDocument(false);
    index.setRef('lunr_id');
    if(term.field == "~"){
      Object.keys(data[0]).forEach((key) => {
        index.addField(key);
      });
    } else {
      index.addField(term.field);
    }
    
    for (i in data)  { 
      data[i]["lunr_id"] = i;
      index.addDoc(data[i]); 
    }
    let preresults = index.search(term.text, { bool: 'AND', expand: true }); 
    preresults.forEach((result) => {
      console.log("result", result);
      results.push(data[result.ref]);
    });

  });
  return results;
}


function dropdownSearchUI(fields, indexFile, url, nugget, placeholder, db) {
  let blanksearch = true;
      for(i in nugget){ 
        if(nugget[i][1] != placeholder){ 
          blanksearch = false; 
        } 
      }
  $.getJSON(indexFile, function(store) {
    searchData = [];
    for (i in store) {
      searchDatum = flattenData(db[i]);
      searchDatum["lunr_id"] = i;
      searchDatum["dds_id"] = i;
      searchData.push(searchDatum);
      
    }

    let results = blanksearch ? [] : recursiveSearch(nugget, searchData, placeholder);
    var results_div = $('#results');

    results_div.empty();
    results_div.append(`<p class="results-info">Displaying ${results.length} results</p>`);

    for (var r in results) {
      var result = displayResult(results[r], fields, url, store);
      results_div.append(result);
    }
  });
};


function termSearchUI(fields, indexFile, url, nuggets, db){
  $.getJSON(indexFile, function(store) {
    searchData = [];
    for (i in store) {
      searchDatum = flattenData(db[i]);
      searchDatum["lunr_id"] = i;
      searchDatum["dds_id"] = i;
      searchData.push(searchDatum);
      
    }

    let resultSets = []
    nuggets.forEach((nugget) => {
      resultSets.push(unionSearch(nugget, searchData));
    });

    console.log("resultSets", resultSets);
    let results;
    if(resultSets.lengtgh == 1){
      results = resultSets[0];
    } else {
      results = resultSets[0];
      for(let i = 1; i < resultSets.length; i++){
        results = getIntersection(results, resultSets[i]);
      }
    }
    console.log("these results", results);
    // results = makeUnique(results);
    // let results = blanksearch ? [] : recursiveSearch(nugget, searchData, placeholder);
    var results_div = $('#results');

    results_div.empty();
    results_div.append(`<p class="results-info">Displaying ${results.length} results</p>`);

    for (var r in results) {
      var result = displayResult(results[r], fields, url, store);
      results_div.append(result);
    }
  });
}
