
const statuslattice = {
  "unseen": 0,
  "review": 1,
  "seen": 2,
};

class GeneralSet {
  constructor(arg) {
    this.map = new Map(arg);
    this[Symbol.iterator] = () => this.map.values();
  }
  add(item, projector, ignore) {
    if(projector) {
      if(ignore) {
        if(ignore(this.map, item))
          return;
      }
      else if(this.map.has(projector(item), projector))
        return;
      return this.map.set(projector(item), item);
    }
    else {
      if(ignore) {
        if(ignore(this.map, item))
          return;
      }
      else if(this.map.has(item))
        return;
      return this.map.set(item, item);
    }
  }
  has(item, projector) {
    if(projector) {
      return this.map.has(projector(item));
    }
    else {
      return this.map.has(item);
    }
  }
  delete(item, projector) {
    if(projector) {
      return this.map.delete(projector(item));
    }
    else {
      return this.map.delete(item);
    }
  }
  forEach(f) {
    return this.map.forEach((v,_k) => { f(v) } );
  }
};

var date = new Date();

var state = {
  jsons : [],
  info: {
    year: date.getYear() + 1900,
    version: 1,
    description: "Merged using LabelIt",
    date_created: date.toISOString(),
  },
  licenses: [{
    id: 1,
    url: "https://creativecommons.org/publicdomain/zero/1.0/",
    name: "Public Domain"
  }],
  categories: [],
  images: [],
  annotations: [],
};

function parsecocos() {
  mergecategories();
  mergeimages();
  mergeboxes();

  // danone
  state.jsons = undefined;
  $('#downloadbut').prop('disabled', false);
}

function areaequals(bbox0, bbox1) {
  var left0   = bbox0.bbox[0]; var left1   = bbox1.bbox[0];
  var top0    = bbox0.bbox[1]; var top1    = bbox1.bbox[1];
  var width0  = bbox0.bbox[2]; var width1  = bbox1.bbox[2];
  var height0 = bbox0.bbox[3]; var height1 = bbox1.bbox[3];

  var area0 = width0 * height0; var area1 = width1 * height1;
  if(area0 - area1 > 25) {
    return false;
  }
  var diffx = left1 - left0;
  var diffy = top1 - top0;
  if(Math.abs(diffx) > 5 && Math.abs(diffy) > 5) {
    return false;
  }
  return true;
}

function mergeboxes() {
  var boxes = [];
  for(var e in state.jsons) {
    var json = state.jsons[e];
    var innerboxes = [];
    for(var i in json.annotations) {
      var box = JSON.parse(JSON.stringify(json.annotations[i]));
      var img = findimg(json,box.image_id);
      if(img == undefined) {
        console.log(box);
        console.log(json.images);
      }
      box.image_id = findimgid(img);
      if(box.category_id !== undefined) {
        var cat = findcat(json,box.category_id);
        box.category_id = findcatid(cat);
      }
      innerboxes.push(box);
    }
    innerboxes.forEach((v) => {
      var add = true;
      for(var e in boxes) {
        var box = boxes[e];
        // what we want to do is the following:
        //  1) get image name of box "v"
        var eimgname = findimg(state,v.image_id).file_name;
        //  2) get image name of box "box"
        var boximgname = findimg(state,box.image_id).file_name;
        //  3) compare
        //   '-> true: continue with 4)
        //   '-> false: `continue` loop, these boxes are unequal
        if(eimgname != boximgname) {
          continue;
        }
        //  4) Use areaequals on "v" & "box"
        //   '-> true: continue with 5)
        //   '-> false: `continue` loop, these boxes are unequal
        if(!areaequals(v, box)) {
          continue;
        }
        //  5) Compare confidences "box" & "v"
        //   '-> LT: just use "v" instead of "box"
        //   '-> EQ: continue with step 6)
        //   '-> GT: use "box" as better candidate instead of "v"
        if(box.conf < v.conf) {
          box.category_id = v.category_id;
          box.area = v.area;
          box.bbox = v.bbox;
          box.conf = v.conf;
          box.attributes = v.attributes;
          add = false;
          continue;
        }
        else if(box.conf > v.conf) {
          add = false;
          continue;
        }
        //  6) Get attributes of "box", check if any is undefined
        //   '-> true: set respective attributes
        //   '-> false: continue with step 7)
        // and
        //  7) Check whether the boxes attributes are equal
        //   '-> false: change image status of `box.image_id` to "review"
        //              and set the respective attribute to undefined
        var modified = false;
        var equal = true;
        equal = equal && (box.category_id == v.category_id);
        if(box.category_id == "undefined") {
          box.category_id = v.category_id; // <- either, too, undefined or smthing else
          modified = true;
        }
        if(box.attributes == "undefined") {
          equal = equal && (box.attributes == v.attributes);
          box.attributes = v.attributes;
          modified = true;
        }
        else {
          equal = equal && (box.attributes.sex == v.attributes.sex);
          if(box.attributes.sex == "undefined") {
            box.attributes.sex = v.attributes.sex;
            modified = true;
          }
          equal = equal && (box.attributes.age == v.attributes.age);
          if(box.attributes.age == "undefined") {
            box.attributes.age = v.attributes.age;
            modified = true;
          }
        }
        if(modified && !equal) {
          add = false;
          continue;
        }
        else if(!modified && equal) {
          // fine, just continue
        }
        else if(!equal) {
          // set image status to "review" and offending fields to "undefined"
          var img = findimg(state,box.image_id);
          img.status = "review";
          if(v.category_id !== undefined && box.category_id != v.category_id) {
            box.category_id = undefined;
          }
          // important! : attributes are set undefined using the *text*, not the JS value
          //  why? JS value *removes* the respective thing from the final JSON
          if(box.attributes && v.attributes && v.attributes.sex != "undefined" && box.attributes.sex != v.attributes.sex) {
            box.attributes.sex = "undefined"; 
          }
          if(box.attributes && v.attributes && box.attributes.age != "undefined" && box.attributes.age != v.attributes.age) {
            box.attributes.age = "undefined";
          }
        }
      }
      if(add) {
        boxes.push(v);
      }
    });
  }
  state.annotations = boxes;
  // update indices (we are still using the old ones)
  var count = 0;
  for(var e in state.annotations) {
    var box = state.annotations[e];
    count = count + 1;
    box.id = count;
  }
}

function mergeimages() {
  const projector = (x) => x.file_name;
  const ignore =  (map, x) => {
    var el = map.get(x.file_name);
    if(el == undefined) {
      return false;
    }
    // update if new element has higher status
    return !(statuslattice[el.status] < statuslattice[x.status]);
  };
  var imgs = new GeneralSet();
  for(var e in state.jsons) {
    var json = state.jsons[e];
    var innerimgs = new GeneralSet();
    for(var i in json.images) {
      var img = json.images[i];
      innerimgs.add(JSON.parse(JSON.stringify(img)), projector, ignore);
    }
    innerimgs.forEach((v) => {
      imgs.add(v, projector, ignore);
    });
  }
  state.images = [...imgs];
  // update indices (we are still using the old ones)
  var count = 0;
  for(var e in state.images) {
    var img = state.images[e];
    count = count + 1;
    img.id = count;
  }
}

function mergecategories() {
  var cats = new Set();
  for(var e in state.jsons) {
    var json = state.jsons[e];
    var innercats = new Set(json.categories);
    innercats.forEach(function(v) { cats.add(v.name.trim()); });
  }

  state.categories = [...cats];
  var count = 1;
  for(var e in state.categories) {
    var cat = {
      id: count,
      name: state.categories[e].trim(),
    };
    state.categories[e] = cat;
    count = count + 1;
  }
}

function findcatid(cat) {
  if(cat == undefined)
    console.log(Error().stack);
  var idx = state.categories.findIndex((e) => e.name == cat.name.trim());
  if(idx == -1) {
    alert("BUG: findcatid should always work! Please report this.\nOffending category: \"" + cat.name + "\"");
    idx = 0;
  }
  return state.categories[idx].id;
}

function findimgid(img) {
  var idx = state.images.findIndex((e) => e.file_name == img.file_name.trim());
  if(idx == -1) {
    alert("BUG: findimgid should always work! Please report this.\nOffending image: \"" + img.file_name + "\"");
    idx = 0;
  }
  return state.images[idx].id;
}


function findcat(st,id) {
  var idx = st.categories.findIndex((e) => e.id == id);
  if(idx == -1) {
    alert("JSON may be broken, since annotation refers to category that does not exist.");
    console.log(Error().stack);
  }
  return st.categories[idx];
}

function findimg(st,id) {
  var idx = st.images.findIndex((e) => e.id == id);
  if(idx == -1) {
    alert("JSON may be broken, since annotation refers to image that does not exist.");
    console.log(id);
    console.log(Error().stack);
  }
  return st.images[idx];
}

function readfiles(files) {
  if(files.length == 0)
    return;
  $('#filecheckmark').hide(400);
  var ignored = [];
  var noerr = true;
  for(var count = 0; count < files.length; count++) {
    var file = files[count];
    var reader = new FileReader();
    reader.count = count;
    reader.onloadend = function(event) {
      var str = event.target.result;
      var content;
      try {
        content = JSON.parse(str);
      } catch (e) {
        alert("You did not select a JSON file. Offender: \"" + files[this.count].name + "\"");
        noerr = false;
        return ;
      }
      state.jsons[this.count] = content;

      if(this.count + 1 >= files.length) {
        $('#filecheckmark').show(400);
        parsecocos();
      }
    };
    reader.readAsText(files[count]);
  }
}

function download() {
  downloadObjectAsJson(state, date.toISOString().slice(0,10).replace(/-/g,"") + "_merged_coco");
}
function downloadObjectAsJson(exportObj, exportName){
  if(window.showSaveFilePicker) {
    try {
      (async () => {
        var saveFile = await window.showSaveFilePicker({
            suggestedName: exportName + ".json"
        });
        const writable = await saveFile.createWritable();
        await writable.write(JSON.stringify(exportObj, null, '  '));
        await writable.close();
      })();
    } catch(e) {
      console.log(e);
    }
  }
  else {
    var downloadAnchorNode = document.createElement('a');

    var file = new Blob([JSON.stringify(exportObj, null, '  ')], {type:'application/json;charset=utf-8'});

    var url = (window.URL || window.webkitURL).createObjectURL(file);
    downloadAnchorNode.setAttribute("href",     url);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    (window.URL || window.webkitURL).revokeObjectURL(url);
  }

  $("body").html('<h1>Refresh the page if you want to merge something else.</h1>');
}

