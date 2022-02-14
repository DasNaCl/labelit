
var hasCsv = false;

var deleteIcon = "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3C!DOCTYPE svg PUBLIC '-//W3C//DTD SVG 1.1//EN' 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'%3E%3Csvg version='1.1' id='Ebene_1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' width='595.275px' height='595.275px' viewBox='200 215 230 470' xml:space='preserve'%3E%3Ccircle style='fill:%23F44336;' cx='299.76' cy='439.067' r='218.516'/%3E%3Cg%3E%3Crect x='267.162' y='307.978' transform='matrix(0.7071 -0.7071 0.7071 0.7071 -222.6202 340.6915)' style='fill:white;' width='65.545' height='262.18'/%3E%3Crect x='266.988' y='308.153' transform='matrix(0.7071 0.7071 -0.7071 0.7071 398.3889 -83.3116)' style='fill:white;' width='65.544' height='262.179'/%3E%3C/g%3E%3C/svg%3E";
var deleteImg = document.createElement('img');
deleteImg.src = deleteIcon;
function renderDeleteIcon(ctx, left, top, styleOverride, fabricObject) {
  var size = this.cornerSize;
  ctx.save();
  ctx.translate(left, top);
  ctx.drawImage(deleteImg, -size/2, -size/2, size, size);
  ctx.restore();
}
fabric.Object.prototype.controls.deleteControl = new fabric.Control({
  x: 0.25,
  y: -0.5,
  offsetY: -16,
  offsetX: 16,
  cursorStyle: 'pointer',
  mouseUpHandler: deletebox,
  render: renderDeleteIcon,
  cornerSize: 24
});

function isDark(bgColor) {
  var color = (bgColor.charAt(0) === '#') ? bgColor.substring(1, 7) : bgColor;
  var r = parseInt(color.substring(0, 2), 16); // hexToR
  var g = parseInt(color.substring(2, 4), 16); // hexToG
  var b = parseInt(color.substring(4, 6), 16); // hexToB
  return (((r * 0.299) + (g * 0.587) + (b * 0.114)) > 186) ? false : true;
}
function getTextWidth(text, font) {
    // if given, use cached canvas for better performance
    // else, create new canvas
    var canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
    var context = canvas.getContext("2d");
    context.font = font;
    var metrics = context.measureText(text);
    return metrics.width;
}

var XCross = fabric.util.createClass(fabric.Object, {
  initialize: function(options) {
    this.callSuper('initialize', options);

    this.set({ originX: 'center', originY: 'center', selectable: false });

    this.width = 10000;
    this.height = 10000;

    this.w1 = this.h2 = 10000;
    this.h1 = this.w2 = 4;

    this.begin_left = null;
    this.begin_top = null;
  },

  _render: function(ctx) {
    ctx.fillRect(-this.w1 / 2, -this.h1 / 2, this.w1, this.h1);
    ctx.fillRect(-this.w2 / 2, -this.h2 / 2, this.w2, this.h2);
  }
});

var label2rainbowstep_len = 0;
var label2rainbowstep = [];
function rainbow(numOfSteps, step) {
    var r, g, b;
    var h = step / numOfSteps;
    var i = ~~(h * 6);
    var f = h * 6 - i;
    var q = 1 - f;
    switch(i % 6){
        case 0: r = 1; g = f; b = 0; break;
        case 1: r = q; g = 1; b = 0; break;
        case 2: r = 0; g = 1; b = f; break;
        case 3: r = 0; g = q; b = 1; break;
        case 4: r = f; g = 0; b = 1; break;
        case 5: r = 1; g = 0; b = q; break;
    }
    var c = "#" + ("00" + (~ ~(r * 255)).toString(16)).slice(-2) + ("00" + (~ ~(g * 255)).toString(16)).slice(-2) + ("00" + (~ ~(b * 255)).toString(16)).slice(-2);
    return (c);
}

var LabeledRect = fabric.util.createClass(fabric.Rect, {
  type: 'labeledRect',
  initialize: function(options) {
    options || (options = { });

    this.callSuper('initialize', options);
    this.set('label', options.label || '');
    this.set('fontSize', options.fontSize || 20);
    this.set('strokeWidth', options.strokeWidth || (this.fontSize / 5.0));
    this.set('fill', 'transparent');
    this.set('conf', options.conf || 1.0);

    this.updateCol();

    this.setControlsVisibility({'mtr':false});
  },

  updateCol: function() {
    var defcol = "#171717";
    if(this.label != "undefined")
      defcol = rainbow(label2rainbowstep_len, label2rainbowstep[this.label]);
    this.set('stroke', defcol);
  },

  toObject: function() {
    return fabric.util.object.extend(this.callSuper('toObject'), {
      label: this.get('label')
    });
  },

  _render: function(ctx) {
    this.callSuper('_render', ctx);

    ctx.fillStyle = this.stroke;
    ctx.font = `${this.fontSize}px Verdana`;
    ctx.fillRect(-this.width/2, -this.height/2 - this.fontSize,
                 getTextWidth(this.label + ` (${this.conf})`, ctx.font), this.fontSize);
    ctx.fillStyle = isDark(this.stroke) ? 'white' : 'black';
    ctx.fillText(this.label + ` (${this.conf})`, -this.width/2, -this.height/2);
  }
});

var canvas = {};
var internal_unique_box_id = 0;
var state = {
  current_pic: 0,
  boxes: [],
  images: [],
  spec: {},
  pic_in_spec: {},
  xcross: null,
  max_zoom: 0.1,
};

function setBBOXControl(val) {
  $('#dropdown').prop('disabled', !val);

  $('#age-y').prop('checked', false).parent().toggleClass('disabled', !val);
  $('#age-u').prop('checked', false || !val).parent().toggleClass('disabled', !val);
  $('#age-m').prop('checked', false).parent().toggleClass('disabled', !val);

  $('#sex-f').prop('checked', false).parent().toggleClass('disabled', !val);
  $('#sex-u').prop('checked', false || !val).parent().toggleClass('disabled', !val);
  $('#sex-m').prop('checked', false).parent().toggleClass('disabled', !val);

  if(val) {
    // update which buttons are checked
    var bbox = canvas.getActiveObject();
    if(bbox == null) {
      $('#age-y').prop('checked', false).parent().toggleClass('disabled', true);
      $('#age-u').prop('checked', false).parent().toggleClass('disabled', true);
      $('#age-m').prop('checked', false).parent().toggleClass('disabled', true);

      $('#sex-f').prop('checked', false).parent().toggleClass('disabled', true);
      $('#sex-u').prop('checked', false).parent().toggleClass('disabled', true);
      $('#sex-m').prop('checked', false).parent().toggleClass('disabled', true);
      return;
    }

    if(bbox.attrs.sex == 'female')
      $('#sex-f').prop('checked', true);
    else if(bbox.attrs.sex == 'male')
      $('#sex-m').prop('checked', true);
    else
      $('#sex-u').prop('checked', true);

    if(bbox.attrs.age == 'juvenile')
      $('#age-y').prop('checked', true);
    else if(bbox.attrs.age == 'mature')
      $('#age-m').prop('checked', true);
    else
      $('#age-u').prop('checked', true);
  }
}
function updateBBOXInfo(what) {
  if($('#dropdown').prop('disabled'))
    return;
  var bbox = canvas.getActiveObject();

  var old_conf = bbox.conf;
  // always set confidence to 1.0 if any property is changed by the user
  bbox.conf = 1.0;
  var needs_update = (1.0 - old_conf) > 0.00001;
  if(what.label) {
    bbox.label = what.label;
    bbox.updateCol();
    needs_update = true;
  }
  if(what.sex)
    bbox.attrs.sex = what.sex;
  if(what.age)
    bbox.attrs.age = what.age;

  if(needs_update) {
    bbox.dirty = true;
    canvas.requestRenderAll();
    setBBOXControl(true);

    //update_canvas(() => {
    //  canvas.setActiveObject(bbox);
    //  setBBOXControl(true);
    //});
  }
}

function display_img(idx, callback) {
  var path = state.images[idx].file;
  var src = (window.URL || window.webkitURL).createObjectURL(path);

  fabric.Image.fromURL(src, (oImg) => {
    oImg.hoverCursor = 'default';
    oImg.selectable = oImg.hasControls = canvas.hasBorders = false;
    canvas.add(oImg);
    (window.URL || window.webkitURL).revokeObjectURL(src)

    var bboxes = state.images[idx].bboxes;
    for(var i = 0; bboxes && i < bboxes.length; ++i) {
      var bbox = bboxes[i];
      addbox({
        left: bbox.left * oImg.width,
        top: bbox.top * oImg.height,
        width: bbox.width * oImg.width,
        height: bbox.height * oImg.height,
        conf: bbox.conf,
        label: bbox.label,
        attrs: bbox.attrs,
      }, true);
    }
    state.images[idx].bboxes = [];
    state.images[idx].width = oImg.width;
    state.images[idx].height = oImg.height;
    state.max_zoom = Math.min(canvas.width / oImg.width, canvas.height / oImg.height);

    callback();
  });
}

function display_boxes() {
  for(var i = 0; i < state.boxes.length; i++) {
    var box = state.boxes[i];
    box.set({
      fontSize: 20.0 / Math.max(canvas.viewportTransform[0], canvas.viewportTransform[3]),
      strokeWidth: (20.0 / Math.max(canvas.viewportTransform[0], canvas.viewportTransform[3]))/ 5.0,
    });
    canvas.add(box);
  }
}

function update_canvas(callback = function() {}) {
  canvas.clear().renderAll();
  display_img(state.current_pic, () => {
    display_boxes();
    if(state.xcross) {
      canvas.add(state.xcross);
    }
    callback();
  });
}

function addbox(desc, dirty = false) {
  state.boxes.push(new LabeledRect(desc));
  var last = state.boxes[state.boxes.length - 1];
  last.boxid = internal_unique_box_id++;
  last.on('moving', (opt) => {
    const me = opt.transform.target;
    var l = Math.max(0, me.left);
    var t = Math.max(0, me.top);
    if(l + me.width > state.images[state.current_pic].width) {
      l = state.images[state.current_pic].width - me.width;
    }
    if(t + me.height > state.images[state.current_pic].height) {
      t = state.images[state.current_pic].height - me.height;
    }
    opt.transform.target.set({
      left: l,
      top: t,
    });
  });
  last.on('scaling', (opt) => {
    last.is_scaling = true;
    const me = opt.transform.target;
    var l = Math.max(0, me.left);
    var t = Math.max(0, me.top);
    var w = me.width * me.scaleX;
    var h = me.height * me.scaleY;

    var sX = me.scaleX;
    var sY = me.scaleY;
    if(me.left < 0) {
      if(me.flipX) {
        sX = (opt.transform.original.left) / me.width;
      }
      else {
        sX = (opt.transform.original.left + me.width) / me.width;
      }
    }
    if(me.top < 0) {
      if(me.flipY) {
        sY = (opt.transform.original.top) / me.height;
      }
      else {
        sY = (opt.transform.original.top + me.height) / me.height;
      }
    }

    // right img
    if(l + w > state.images[state.current_pic].width) {
      sX = (state.images[state.current_pic].width - l - 1) / me.width;
    }
    // bottom img
    if(t + h > state.images[state.current_pic].height) {
      sY = (state.images[state.current_pic].height - t - 1) / me.height;
    }
    opt.transform.target.set({
      left: l,
      top: t,
      scaleX: sX,
      scaleY: sY,
    });
  });
  last.on('mouseup', (opt) => {
    if(last.is_scaling) {
      const me = opt.transform.target;

      // don't scale, literally change the width
      opt.transform.target.set({
        scaleX: 1.0,
        scaleY: 1.0,
        width: me.width * me.scaleX,
        height: me.height * me.scaleY,
        flipX: false,
        flipY: false,
      });
      last.is_scaling = false;
      me.conf = 1.0;
      me.dirty = true;
      canvas.requestRenderAll();
      update_canvas(() => {
        canvas.setActiveObject(me);
        setBBOXControl(true);
      });
    }
  });
  if(!dirty) {
    update_canvas(() => {
      canvas.setActiveObject(last);
      setBBOXControl(true);
    });
  }
}
function deletebox(eventData, transform) {
  var target = transform.target;
  canvas.remove(target);

  for(var i = 0; i < state.boxes.length; ++i) {
    if(state.boxes[i].boxid == target.boxid) {
      state.boxes.splice(i, 1);
      break;
    }
  }
  update_canvas();
}
function applyFilter() {
  if($('#filtercheckbox').prop('checked')) {
    var todel = [];
    for(var i = 0; i < state.boxes.length; ++i) {
      var bbox = state.boxes[i];
      if(bbox.conf < $('#filternumber').val()) {
        todel.push(bbox);
      }
    }
    for(var i = 0; i < todel.length; ++i) {
      deletebox(undefined, {target: todel[i]});
    }
  }
}


function drawbox() {
  let xcross = new XCross();
  state.xcross = xcross;
  canvas.selection = true;
  canvas.add(xcross);
  update_canvas();
}

function updateViewport() {
  var scale = Math.min(
    canvas.width / state.images[state.current_pic].width,
    canvas.height / state.images[state.current_pic].height);

  canvas.viewportTransform = [
    scale,
    0,
    0,
    scale,
    0,
    0,
  ];
}
function canvasevents() {
canvas.on(
  'mouse:move', function(opt) {
    if(state.xcross) {
      var p = canvas.getPointer(opt.e);
      state.xcross.set({ left: p.x, top: p.y, h1: 4 / canvas.getZoom(), w2: 4 / canvas.getZoom() });
      this.requestRenderAll();
    }
    if(this.isDragging) {
      var e = opt.e;
      var vpt = this.viewportTransform;
      vpt[4] += e.clientX - this.lastPosX;
      vpt[5] += e.clientY - this.lastPosY;
      this.requestRenderAll();
      this.lastPosX = e.clientX;
      this.lastPosY = e.clientY;
    }
  });
canvas.on('mouse:wheel', function(opt) {
    var delta = opt.e.deltaY;
    var zoom = canvas.getZoom();
    zoom *= 0.999 ** delta;
    if(zoom > 20) zoom = 20;
    if(zoom < state.max_zoom) zoom = state.max_zoom;
    canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
    if(state.xcross) {
      state.xcross.set({ h1: 4 / zoom, w2: 4 / zoom });
    }
    this.requestRenderAll();
    opt.e.preventDefault();
    opt.e.stopPropagation();
  });
canvas.on('mouse:down', function(opt) {
    if (opt.e.altKey === true || opt.button == 2) {
      this.isDragging = true;
      this.selection = false;
      this.lastPosX = opt.e.clientX;
      this.lastPosY = opt.e.clientY;
    }
    if (opt.button != 2 && opt.target && opt.target.selectable) {
      opt.target.opacity = 0.5;
      this.requestRenderAll();
      setBBOXControl(true);
    }
    if (state.xcross && !this.isDragging) {
      if (!state.xcross.begin_top) {
        var p = canvas.getPointer(opt.e);
        state.xcross.begin_top = p.y;
        state.xcross.begin_left = p.x;
      }
    }
  });
canvas.on('mouse:up', function(e) {
    if (state.xcross && !this.isDragging) {
      if (state.xcross.begin_top) {
        this.selection = false;
        var p = canvas.getPointer(e);
        var x = state.xcross.begin_left;
        var y = state.xcross.begin_top;
        var w = Math.abs(p.x - x);
        var h = Math.abs(p.y - y);
        if(p.x < x) x = p.x;
        if(p.y < y) y = p.y;
        addbox({
          left: x,
          top: y,
          width: w,
          height: h,
          conf: 1.0,
          label: "undefined",
          attrs: { sex: "undefined", age: "undefined" },
        });
        state.xcross = null;
        update_canvas(() => canvas.setActiveObject(state.boxes[state.boxes.length-1]));
      }
    }
    this.isDragging = false;
    if (e.target) {
      e.target.opacity = 1.0;
      e.target.conf = 1.0;
      e.target.dirty = true;
      this.requestRenderAll();
    }
  });
canvas.on('object:moved', function(e) {
    e.target.opacity = 0.5;
  });
canvas.on('object:modified', function(e) {
    e.target.opacity = 1;
  });
canvas.on('selection:cleared', function(e) {
    setBBOXControl(false);
});
}

function storebboxes() {
  for(var i = 0; i < state.boxes.length; ++i) {
    var bbox = state.boxes[i];

    var w = state.images[state.current_pic].width;
    var h = state.images[state.current_pic].height;
    state.images[state.current_pic].bboxes.push({
      left: bbox.left / w,
      top: bbox.top / h,
      width: bbox.width / w,
      height: bbox.height / h,
      conf: bbox.conf,
      label: bbox.label,
      attrs: bbox.attrs,
    });
  }
  state.boxes = [];
}

function reloadImgStatus() {
  var st = state.images[state.current_pic].status;

  $('#btnunseen').prop('checked', false).css('active', false);
  $('#btnreview').prop('checked', false).css('active', false);
  $('#btnseen').prop('checked', false).css('active', false);

  if(st == 'review') {
    $('#btnreview').prop('checked', true).css('active', true);
  }
  else if(st == 'seen') {
    $('#btnseen').prop('checked', true).css('active', true);
  }
  else {
    $('#btnunseen').prop('checked', true).css('active', true);
  }
}

// "gameloop"
function choosePic(idx) {
  storebboxes();

  state.current_pic = idx;
  reloadImgStatus();
  update_canvas(function() {
    updateViewport();
    applyFilter();
    update_canvas();
    updatePagination();
  });
}

function downloadObjectAsJson(exportObj, exportName){
  var downloadAnchorNode = document.createElement('a');

  var file = new Blob([JSON.stringify(exportObj)], {type:'application/json;charset=utf-8'});

  var url = (window.URL || window.webkitURL).createObjectURL(file);
  downloadAnchorNode.setAttribute("href",     url);
  downloadAnchorNode.setAttribute("download", exportName + ".json");
  document.body.appendChild(downloadAnchorNode); // required for firefox
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
  (window.URL || window.webkitURL).revokeObjectURL(url);
}

// this function prepares the state.images.bboxes stuff as such that we have the COCO format as download
function exportData() {
  var coco = {};

  var date = new Date();
  coco.info = {
    year: date.getFullYear(),
    version: "1",
    description: "Exported using LabelIt",
    date_created: date.toISOString(),
  };
  coco.license = {
    "id": 1,
    "url": "https://creativecommons.org/publicdomain/zero/1.0/",
    "name": "Public Domain"
  };
  coco.categories = [];
  var idx = 0;
  var label2id = [];
  for(var e in label2rainbowstep) {
    label2id[e] = idx;
    coco.categories.push({
      id: idx++,
      name: e
    });
  }
  idx = 0;
  coco.images = [];
  var handle_annotations = function () {
    coco.annotations = [];
    var bboxid = 0;
    var undefined_imgs = [];
    var hasundef = false;
    for(var i = 0; i < state.images.length; ++i) {
      var imgw = state.images[i].width;
      var imgh = state.images[i].height;
      if(i == state.current_pic) {
        for(var j = 0; j < state.boxes.length; ++j) {
          var bbox = state.boxes[j];
          coco.annotations.push({
            id: bboxid,
            image_id: i,
            category_id: label2id[bbox.label],
            segmentation: [],
            iscrowd: 0,
            area: ((bbox.width) * (bbox.height)),
            bbox: [(bbox.left),
                   (bbox.top),
                   (bbox.width),
                   (bbox.height)],
            // TODO: non-standard?
            conf: bbox.conf,
            attributes: bbox.attrs,
          });
          if(bbox.label == "undefined") {
            undefined_imgs["\"" + state.images[i].file.name + "\"\n"] = true;
            hasundef = true;
          }
        }
      }
      else {
        if(state.images[i].bboxes) {
          for(var j = 0; j < state.images[i].bboxes.length; ++j) {
            var bbox = state.images[i].bboxes[j];
            coco.annotations.push({
              id: bboxid,
              image_id: i,
              category_id: label2id[bbox.label],
              segmentation: [],
              iscrowd: 0,
              area: ((bbox.width * imgw) * (bbox.height * imgh)),
              bbox: [(bbox.left * imgw),
                     (bbox.top * imgh),
                     (bbox.width * imgw),
                     (bbox.height * imgh)],
              conf: bbox.conf,
              attributes: bbox.attrs,
            });
            if(bbox.label == "undefined") {
              undefined_imgs["\"" + state.images[i].file.name + "\"\n"] = true;
              hasundef = true;
            }
          }
        }
      }
      ++bboxid;
    }
    if(hasundef) {
      var str = "";
      for(var e in undefined_imgs) {
        str += e;
      }
      alert("Some images have boxes with label \"undefined\":\n" + str
          + "\nNote: this is expected if you want to continue later on where you left off.");
    }
    downloadObjectAsJson(coco, date.toISOString().slice(0,10).replace(/-/g,"") + "_coco");
  }
  var store_pic = function(jdx, callback) {
    if(jdx >= state.images.length)
      return callback();
    var src = (window.URL || window.webkitURL).createObjectURL(state.images[jdx].file);
    fabric.Image.fromURL(src, (oImg) => {
      coco.images.push({
        id: jdx,
        license: 1,
        file_name: state.images[jdx].file.name,
        height: oImg.height,
        width: oImg.width,
      });
      state.images[jdx].width = oImg.width;
      state.images[jdx].height = oImg.height;
      (window.URL || window.webkitURL).revokeObjectURL(src);
      store_pic(jdx + 1, callback);
    });
  };
  store_pic(0, handle_annotations);
}

function updatePagination() {
  var ul = $('#controlul');
  ul.html('');
  $("<li class=\"page-item" + (state.current_pic == 0 ? " disabled" : "") +
    "\"><a class=\"page-link\" href=\"#\" onclick=\"choosePic(state.current_pic-1)\" aria-label=\"Previous\">" +
    "<span aria-hidden=\"true\">&laquo;</span><span class=\"sr-only\">Previous</span>" +
    "</a></li>").appendTo(ul);

  var min = (state.current_pic > 10 ? state.current_pic - 10 : 0);
  var max = (state.images.length - state.current_pic > 10 ? state.current_pic + 10 + Math.max(10 - state.current_pic, 0) : state.images.length);

  if(state.images.length - state.current_pic < 10) {
    min = Math.max(0, Math.min(min, min - (10 - (state.images.length - state.current_pic))));
  }
  for(var i = min; i < max; ++i) {
    var status = state.images[i].status;
    var text = status == 'unseen' ? "<span class=\"fa-solid fa-eye-slash\"></span>"
             : (status == 'review' ? "<span class=\"fa-solid fa-magnifying-glass\"></span>"
                                   : "<span class=\"fa-solid fa-eye\"></span>");

    $("<li class=\"page-item" + (state.current_pic == i ? " active" : "") +
      "\"><a class=\"page-link\" href=\"#\" onclick=\"choosePic("
      + i + ");\">" + text //(i + 1)
      + "</a></li>").appendTo(ul);
  }
  $("<li class=\"page-item" + (state.current_pic + 1 < state.images.length ? "" : " disabled") +
    "\"><a class=\"page-link\" href=\"#\" onclick=\"choosePic(state.current_pic+1)\" aria-label=\"Next\">" +
    "<span aria-hidden=\"true\">&raquo;</span><span class=\"sr-only\">Next</span>" +
    "</a></li>").appendTo(ul);
}

function startAnnotation() {
  // go to annotation phase
  $('#initial-menu').hide(200, function() {
    updatePagination();
    $('#annot').show(200, function() {
      var w = window.innerWidth * 0.8;
      if(hasCsv) {
        console.log($('#canvasdiv').innerWidth());
        w = $('#canvasdiv').innerWidth();
      }
      canvas = new fabric.Canvas('canvas', {
        width: w,
        height: window.innerHeight * 0.7,
        selection: false,
        fireMiddleClick: true,
      });
      canvasevents();
      choosePic(0);
    });
  });
}

// menu logic and loading files (=images, json)
function nojson() {
  if($('#nojsoncheck').prop('checked')) {
    $('#megaradio').prop('checked', false).prop('disabled', true);
    $('#cocoradio').prop('checked', false).prop('disabled', true);
    $('#jsonbutton').prop('disabled', true).val('');

    $('#jsoncheckmark').show(500, mayEnableAnnotButton);
  }
  else {
    $('#megaradio').prop('checked', false).prop('disabled', false);
    $('#cocoradio').prop('checked', false).prop('disabled', false);
    $('#jsonbutton').prop('disabled', true).val('');

    $('#jsoncheckmark').hide();
    $('#annotatebutton').prop("disabled", true);
  }
}
function jsonformatupdate() {
  $('#jsonbutton').prop('disabled', false).val('');
  $('#jsoncheckmark').hide(100);
  $('#annotatebutton').prop('disabled', true);
}
function mayEnableAnnotButton() {
  if($('#filecheckmark').css('display') != 'none') {
    if(!($('#jsoncheckmark').css("display") != "none"))
      return;
    if($('#nojsoncheck').prop('checked')) {
      $('#annotatebutton').prop("disabled", false);
      return;
    }
  }
  else
    return;
  // try to match filenames from json to filenames in state.images
  var matches = [];
  var unmatched = "";
  if($('#cocoradio').prop('checked')) {
    // read categories
    var catstring = "";
    var catid2cat = [];
    if(!state.spec.categories) {
      alert("Unexpected JSON file format.");
      $('#jsoncheckmark').hide(100);
      $('#jsonbutton').val('');
      return;
    }
    for(var i = 0; i < state.spec.categories.length; ++i) {
      catstring += state.spec.categories[i].name + (i + 1 >= state.spec.categories.length ? "" : ";");
      catid2cat[state.spec.categories[i].id] = state.spec.categories[i].name;
    }
    $("#classinput").val(catstring);
    $("#classinput").trigger("input");
    var imgid2img = [];
    for(var i = 0; i < state.spec.images.length; ++i) {
      imgid2img[state.spec.images[i].id] = state.spec.images[i].file_name;
    }
    for(var j = 0; j < state.images.length; ++j) {
      var img = state.images[j].file;
      var bboxes = [];
      for(var i = 0; i < state.spec.annotations.length; ++i) {
        var annot = state.spec.annotations[i];
        var imgw = state.spec.images[annot.image_id].width;
        var imgh = state.spec.images[annot.image_id].height;
        if(imgid2img[annot.image_id].includes(img.name)) {
          bboxes.push({
            left: annot.bbox[0] / imgw,
            top: annot.bbox[1] / imgh,
            width: annot.bbox[2] / imgw,
            height: annot.bbox[3] / imgh,
            conf: (annot.conf || 1.0),
            label: (typeof annot.category_id !== "undefined" ? catid2cat[annot.category_id] : "undefined"),
            attrs: (annot.attributes || { sex: "undefined", age: "undefined" }),
          });
        }
      }
      state.images[j].bboxes = bboxes;
    }
  }
  else {
    for(var j = 0; j < state.images.length; ++j) {
      var img = state.images[j].file;
      var added = false;
      for(var i = 0; i < state.spec.images.length; ++i) {
        var imginfo = state.spec.images[i];
        if(!(imginfo.file)) {
          alert("Unexpected JSON file format.");
          $('#jsoncheckmark').hide(100);
          $('#jsonbutton').val('');
          return;
        }
        if(imginfo.file.includes(img.name)) {
          matches.push({ idx: j, json: imginfo });
          added = true;
          break;
        }
      }
      if(!added) {
        unmatched += "\"" + img.name + "\"\n";
      }
    }
    if(unmatched != "") {
      alert("JSON does not contain:\n" + unmatched + "\n(you may still annotate it)");
    }
    // add bboxes to the images
    for(var i = 0; i < matches.length; ++i) {
      var bboxes = [];
      for(var j = 0; j < matches[i].json.detections.length; ++j) {
        var detection = matches[i].json.detections[j];

        bboxes.push({
          left: detection.bbox[0],
          top: detection.bbox[1],
          width: detection.bbox[2],
          height: detection.bbox[3],
          conf: detection.conf,
          label: "undefined",
          attrs: { sex: "undefined", age: "undefined" },
        });
      }
      state.images[matches[i].idx].bboxes = bboxes;
    }
  }
  $('#annotatebutton').prop("disabled", false);
}
function loadjson(files) {
  $('#jsoncheckmark').hide();
  var reader = new FileReader();
  reader.onload = function(event) {
      var str = event.target.result;
      var content;
      try {
        content = JSON.parse(str);
      } catch (e) {
        alert("not a json file");
        $('#jsonbutton').val('');
        return ;
      }
      $('#bag').toggle();
      $('#jsoncheckmark').show(500, mayEnableAnnotButton);

      state.spec = content;
    };
  reader.readAsText(files[0]);
}
function parseCsv(data, fieldSep, newLine) {
    fieldSep = fieldSep || ',';
    newLine = newLine || '\n';
    var nSep = '\x1D';
    var qSep = '\x1E';
    var cSep = '\x1F';
    var nSepRe = new RegExp(nSep, 'g');
    var qSepRe = new RegExp(qSep, 'g');
    var cSepRe = new RegExp(cSep, 'g');
    var fieldRe = new RegExp('(?<=(^|[' + fieldSep + '\\n]))"(|[\\s\\S]+?(?<![^"]"))"(?=($|[' + fieldSep + '\\n]))', 'g');
    var grid = [];
    data.replace(/\r/g, '').replace(/\n+$/, '').replace(fieldRe, function(match, p1, p2) {
        return p2.replace(/\n/g, nSep).replace(/""/g, qSep).replace(/,/g, cSep);
    }).split(/\n/).forEach(function(line) {
        var row = line.split(fieldSep).map(function(cell) {
            return cell.replace(nSepRe, newLine).replace(qSepRe, '"').replace(cSepRe, ',');
        });
        grid.push(row);
    });
    return grid;
}
function loadcsv(files) {
  var reader = new FileReader();
  reader.onload = function(event) {
      var str = event.target.result;
      var grid = parseCsv(str, ';');
      if(!grid) {
        return;
      }
      for(var i = 0; i < grid[0].length; ++i) {
        $('#csvspace').append('<p>' + grid[0][i] + "</p>");
      }
      $('#canvasdiv').css('min-width', '80%').css('max-width', '80%');
      $('#csvspace').css('min-width', '20%');
    hasCsv = true;
      console.log(grid);
    };
  reader.readAsText(files[0]);
}

function isImage(file) {
  return file && file['type'].split('/')[0] === 'image';
}
function readfiles(files) {
  if(files.length == 0)
    return;
  $('#filecheckmark').hide();
  var ignored = "";
  var count = 0;
  for(var i = 0; i < files.length; i++) {
    if(!isImage(files[i])) {
      ignored += "\"" + files[i].name + "\"\n";
    }
    else {
      state.images[i] = state.images[i] ? state.images[i] : {};
      state.images[i].file = files[i];
      state.images[i].status = 'unseen';
      ++count;
    }
  }
  if(ignored != "") {
    alert("The following files do not appear to be images and are thus ignored:\n" + ignored);
  }
  if(count > 0)
    $('#filecheckmark').show(500, mayEnableAnnotButton);
  else
    $('#filecheckmark').hide();
}

// handle logic of little test box for classes
$('#classinput').on('input', function() {
  var text = $('#classinput').val();
  var match = text.split(';')
  var ul = $('#testdropdown + ul.dropdown-menu');
  ul.html('');
  var ul2 = $('#dropdown + ul.dropdown-menu');
  ul2.html('');
  label2rainbowstep = [];
  var i = 0;
  for(var a in match) {
    if(match[a] == "" || !(/\S/.test(match[a])))
      continue;
    $("<a class=\"dropdown-item\" href=\"#\">" + match[a] + "</a>").appendTo(ul);
    $("<a class=\"dropdown-item\" href=\"#\" onclick=\"updateBBOXInfo({label:'" +
      match[a] + "'})\">" + match[a] + "</a>").appendTo(ul2);

    label2rainbowstep[match[a]] = i++;
  }
  label2rainbowstep_len = i;
});
$('#classinput').trigger("input");


$(document).on('keyup', function(e) {
  if(e.key == "Delete" || e.key == "Backspace" || e.key == "x") {
    var bbox = canvas.getActiveObject();
    if(bbox && bbox.conf) {
      deletebox(undefined, {target: bbox});
    }
  }
  else if(e.key == " " || e.key == "ArrowRight") {
    if(e.key == " ") {
      state.images[state.current_pic].status = 'seen';
    }
    var next_pic = state.current_pic + 1;
    if(next_pic >= state.images.length) {
      next_pic = 0;
    }
    if(next_pic != state.current_pic) {
      choosePic(next_pic);
    }
    updatePagination();
  }
  else if(e.key == "ArrowLeft") {
    var next_pic = state.current_pic - 1;
    if(next_pic < 0) {
      next_pic = state.images.length - 1;
    }
    if(next_pic != state.current_pic) {
      choosePic(next_pic);
    }
  }
});

function markImg(what) {
  state.images[state.current_pic].status = what;
  var next_pic = state.current_pic + 1;
  if(next_pic >= state.images.length) {
    next_pic = 0;
  }
  if(next_pic != state.current_pic) {
    choosePic(next_pic);
  }
  updatePagination();
}



