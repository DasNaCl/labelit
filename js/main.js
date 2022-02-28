
const TIP_THRESHHOLD = 4;
const REQUEST_BRAKE_TIME = 90 * 60 * 1000;

const MIN_BBOX_AREA = 10 * 10;

var toastElList = [].slice.call(document.querySelectorAll('.toast'))
var toastList = toastElList.map(function (toastEl) {
  var delay = (toastEl.id == 'success-toast' ? 5000
            : (toastEl.id == 'tip-toast' ? 10000 : 10000));
  return new bootstrap.Toast(toastEl, { delay: delay })
})
var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
  return new bootstrap.Tooltip(tooltipTriggerEl, { delay: 300 })
})
var hasCsv = false;

function fire_tip(text) {
  if($('#tipsenabled').prop('checked')) {
      $('#tip-toast-body').html(text);
      bootstrap.Toast.getInstance(document.getElementById('tip-toast')).show(400);
  }
}

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
  mouseUpHandler: deleteboxbyicon,
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
    this.h1 = this.w2 = 2;

    this.begin_left = undefined;
    this.begin_top = undefined;

    this.objectCaching = false;
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
    this.set('strokeWidth', options.strokeWidth || 2);
    this.set('fill', 'transparent');
    this.set('conf', options.conf || 1.0);

    this.updateCol();

    this.setControlsVisibility({'mtr':false});
    this.objectCaching = false;
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
  var classch = $("#classdropdown").prev().children();
  classch.filter("* > input").prop("disabled", !val).val('');
  var classchdivch = classch.filter("* > div").children();
  classchdivch.filter("* > input").prop("disabled", !val).val('');
  classchdivch.prop('disabled', !val);

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
    if(bbox.label != "undefined") {
      var classch = $("#classdropdown").prev().children();
      classch.filter("* > input").prop("disabled", !val).val(bbox.label);
      var classchdivch = classch.filter("* > div").children();
      classchdivch.filter("* > input").prop("disabled", !val).val(bbox.label);
      reloadImgStatus();
    }

    if(bbox.attrs.sex == 'female')
      $('#sex-f').prop('checked', true);
    else if(bbox.attrs.sex == 'male')
      $('#sex-m').prop('checked', true);
    else
      $('#sex-u').prop('checked', true);

    if(bbox.attrs.age == 'juvenile')
      $('#age-y').prop('checked', true);
    else if(bbox.attrs.age == 'adult')
      $('#age-m').prop('checked', true);
    else
      $('#age-u').prop('checked', true);
  }
}
function updateBBOXInfo(what) {
  if($('#age-y').prop('disabled'))
    return;
  var bbox = canvas.getActiveObject();
  if(bbox == null)
    return;

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
    state.max_zoom = Math.min(canvas.width / oImg.width, canvas.height / oImg.height) - 0.1;

    callback();
  });
}

function display_boxes() {
  for(var i = 0; i < state.boxes.length; i++) {
    var box = state.boxes[i];
    box.set({
      fontSize: 20.0 / Math.max(canvas.viewportTransform[0], canvas.viewportTransform[3]),
      strokeWidth: 2.0 / Math.max(canvas.viewportTransform[0], canvas.viewportTransform[3]),
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
function update_canvas_btn() {
  if(this.statistics) {
    if(this.statistics++ == TIP_THRESHHOLD) {
      fire_tip('Weird stuff is still happening?<br>Open an issue on <a target="_blank" href="https://github.com/DasNaCl/labelit">github.com/DasNacl/labelit</a> and describe what is happening.');
    }
  }
  else {
    this.statistics = 1;
  }
  return update_canvas();
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
    opt.transform.target.dirty = true;
    canvas.requestRenderAll();
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
  reloadImgStatus();
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
function deleteboxbyicon(eventData, transform) {
  if(this.statistics) {
    if(this.statistics++ == TIP_THRESHHOLD) {
      fire_tip('Delete a <i>selected</i> box: [x] or [Backspace] (<i class="fa-solid fa-delete-left"></i>) or [Delete] key.');
    }
  }
  else {
    this.statistics = 1;
  }
  return deletebox(eventData, transform);
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

function useprev() {
  var prevpic = (state.current_pic > 0 ? state.current_pic - 1 : state.images.length-1);
  var prev = state.images[prevpic].bboxes;
  var imgw = state.images[prevpic].width;
  var imgh = state.images[prevpic].height;
  for(var i = 0; i < prev.length; ++i) {
    addbox({
      left: prev[i].left * imgw,
      top: prev[i].top * imgh,
      width: prev[i].width * imgw,
      height: prev[i].height * imgh,
      conf: prev[i].conf,
      label: prev[i].label,
      attrs: prev[i].attrs,
    });
  }
  $('#prevbutton').prop('disabled', true);
}

function drawbox() {
  let xcross = new XCross();
  state.xcross = xcross;
  canvas.selection = true;
  canvas.add(xcross);
  update_canvas();
}

function updateViewport() {
  var imgw = state.images[state.current_pic].width;
  var imgh = state.images[state.current_pic].height;
  var mw = canvas.width / imgw;
  var mh = canvas.height / imgh;
  var scale = Math.min(mw, mh);

  canvas.viewportTransform = [
    scale,
    0,
    0,
    scale,
    (mh < mw ? (imgw * mw - imgw * mh) / 2.0 : 0),
    (mw < mh ? (imgh * mh - imgh * mw) / 2.0 : 0),
  ];
}
function canvasevents() {
canvas.on(
  'mouse:move', function(opt) {
    if(state.xcross) {
      var p = canvas.getPointer(opt.e);
      var x = Math.min(state.images[state.current_pic].width, Math.max(0, p.x));
      var y = Math.min(state.images[state.current_pic].height, Math.max(0, p.y));
      state.xcross.set({ left: x, top: y, h1: 2 / canvas.getZoom(), w2: 2 / canvas.getZoom() });
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
      state.xcross.set({ h1: 2 / zoom, w2: 2 / zoom });
    }
    this.requestRenderAll();
    opt.e.preventDefault();
    opt.e.stopPropagation();
  });
canvas.on('mouse:down', function(opt) {
    if (opt.e.altKey === true || opt.button == 2) {
      this.isDragging = true;
      this.bkpselection = this.selection;
      this.selection = false;
      this.lastPosX = opt.e.clientX;
      this.lastPosY = opt.e.clientY;
    }
    if (opt.button != 2 && opt.target && opt.target.selectable) {
      opt.target.opacity = 0.5;
      this.requestRenderAll();
      setBBOXControl(true);
    }
    if (!state.xcross && (opt.target == null || opt.target.attrs === undefined)) {
      if(this.clickednowhere) {
        if(this.clickednowhere++ == 2) {
          fire_tip('Press and hold the middle mouse button to move. You may as well use the left mousebutton and hold the modifier [Alt] key.');
        }
      }
      else {
        this.clickednowhere = 1;
      }
    }
    if (state.xcross && !this.isDragging) {
      if (state.xcross.begin_top === undefined) {
        var p = canvas.getPointer(opt.e);
        state.xcross.begin_left = Math.min(state.images[state.current_pic].width, Math.max(0, p.x));
        state.xcross.begin_top  = Math.min(state.images[state.current_pic].height, Math.max(0, p.y));
      }
    }
  });
canvas.on('mouse:up', function(e) {
    if (state.xcross && !this.isDragging) {
      if (state.xcross.begin_top !== undefined) {
        this.bkpselection = this.selection = false;
        var p = canvas.getPointer(e);
        var x = state.xcross.begin_left;
        var y = state.xcross.begin_top;
        var w = Math.abs(p.x - x);
        var h = Math.abs(p.y - y);
        if(p.x < x) x = p.x;
        if(p.y < y) y = p.y;

        x = Math.min(state.images[state.current_pic].width, Math.max(0, x));
        y = Math.min(state.images[state.current_pic].height, Math.max(0, y));
        if(x + w - state.images[state.current_pic].width > 0) {
          w = state.images[state.current_pic].width - x;
        }
        if(y + h - state.images[state.current_pic].height > 0) {
          h = state.images[state.current_pic].height - y;
        }
        if(w * h <= MIN_BBOX_AREA) {
          $('#error-toast-body').text("No bounding box added. Area too small!");
          bootstrap.Toast.getInstance(document.getElementById('error-toast')).show(100);
        }
        else {
          addbox({
            left: x,
            top: y,
            width: w,
            height: h,
            conf: 1.0,
            label: "undefined",
            attrs: { sex: "undefined", age: "undefined" },
          });
        }
        state.xcross = null;
        update_canvas(() => canvas.setActiveObject(state.boxes[state.boxes.length-1]));
      }
    }
    this.selection = this.bkpselection;
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
    state.images[state.current_pic].bboxes = state.images[state.current_pic].bboxes === undefined ? [] : state.images[state.current_pic].bboxes;
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

  var nothing_undefined = true;
  for(var i = 0; i < state.boxes.length; ++i) {
    if(state.boxes[i].label == "undefined") {
      nothing_undefined = false;
      break;
    }
  }
  $('#btnseen').prop('checked', false).css('active', false).prop('disabled', !nothing_undefined);

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

function updateprevbutton(idx) {
  if((idx - 1 == state.current_pic)
  || (idx != state.current_pic && 0 <= idx && idx <= state.images.length && state.images[idx].width)) {
    $("#prevbutton").prop('disabled', false);
  }
  else {
    $("#prevbutton").prop('disabled', true);
  }
}
function addcsvboxes() {
  if(!hasCsv)
    return;
  var csvobj = state.images[state.current_pic].csvobj;
  var bboxes = csvobj.bounding_boxes;

  var imgw = state.images[state.current_pic].width;
  var imgh = state.images[state.current_pic].height;
  for(var i = 0; i < bboxes.length; ++i) {
    var bbox = bboxes[i];



    addbox({
      left: bbox.left * imgw,
      top: bbox.top * imgh,
      width: bbox.width * imgw,
      height: bbox.height * imgh,
      conf: 1.0,
      label: csvobj.species_common_name || "undefined",
      attrs: {
        sex: (csvobj.sex.split(',')[i] || "undefined").trim().toLowerCase(),
        age: (csvobj.age.split(',')[i] || "undefined").trim().toLowerCase(),
      },
    });
  }

  state.images[state.current_pic].csvobj.bounding_boxes = [];
  $('#csvaddboxbutton').hide(200, () => {
    $('#csvaddboxbutton').remove();
    $('#csvspace').append('<h5 class="text-justify">No bounding boxes.</h5>');
  });
}
function displayCSV() {
  if(!hasCsv)
    return;
  var csvobj = state.images[state.current_pic].csvobj;

  $('#csvspace').html('');

  var sex = csvobj.sex.replace(/[Ff]emale/, '<span class="fa-solid fa-venus"></span>')
                      .replace(/[Mm]ale/, '<span class="fa-solid fa-mars"></span>')
                      .replace(/[Uu]ndefined/, '<span class="fa-solid fa-venus-mars"></span>');
  var age = csvobj.age.replace(/[Aa]dult/, '<span class="fa-solid fa-user-graduate"></span>')
                      .replace(/[Jj]uvenile/, '<span class="fa-solid fa-child"></span>')
                      .replace(/[Uu]ndefined/, '<span class="fa-solid fa-question"></span>');
  
  $('#csvspace').append('<h2>From CSV:</h2>');
  $('#csvspace').append('<h4 class="text-justify">' + csvobj.species_common_name + "</h4>");
  $('#csvspace').append('<h5 class="text-justify">' + csvobj.species_sci + "</h5>");
  $('#csvspace').append('<h5 class="text-justify">Sex: ' + sex + "</h5>");
  $('#csvspace').append('<h5 class="text-justify">Age: ' + age + "</h5>");
  $('#csvspace').append('<h5 class="text-justify">Count:' + csvobj.count + "</h5>");
  if(csvobj.bounding_boxes.length != 0) {
    $('#csvspace').append('<button id="csvaddboxbutton" class="btn btn-success" onclick="addcsvboxes()">Add boxes</button>');
  }
  else {
    $('#csvspace').append('<h5 class="text-justify">No bounding boxes.</h5>');
  }
}

// "gameloop"
function choosePic(idx) {
  storebboxes();
  updateprevbutton(idx);

  state.current_pic = idx;
  update_canvas(function() {
    updateViewport();
    applyFilter();
    update_canvas();
    updatePagination();
    displayCSV();
    reloadImgStatus();
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
      console.log("Some images have boxes with label \"undefined\":\n" + str
          + "\nNote: this is expected if you want to continue later on where you left off.");
      $('#error-toast-body').text("Some images were not present in the JSON. Check them out by [RightClick] -> Inspect and then read what is written on the console.");
      bootstrap.Toast.getInstance(document.getElementById('error-toast')).show(100);
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
        status: state.images[jdx].status,
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
  $("#pagenumbertext").val('');
  var ul = $('#controlul');
  ul.html('');
  $("<li class=\"page-item" + (state.current_pic == 0 ? " disabled" : "") +
    "\"><a class=\"page-link\" href=\"#\" onclick=\"choosePic(prev_pic_number())\" aria-label=\"Previous\">" +
    "<span aria-hidden=\"true\">&laquo;</span><span class=\"sr-only\">Previous</span><br>&nbsp;" +
    "</a></li>").appendTo(ul);

  var pics = []; var pic_count = 0; var curpic = 0;
  for(var i = 0; i < state.images.length; ++i) {
    var status = state.images[i].status;
    var filter = ((status == "review" && $("#filterreview").prop('checked'))
               || (status == "seen" && $("#filterseen").prop('checked')));
    if(!filter || state.current_pic == i) {
      pics[pic_count++] = i;
      if(state.current_pic == i) {
        curpic = pic_count - 1;
      }
    }
  }
  var half = 5;
  var min = Math.max(0, (curpic > half ? curpic - half : 0));
  var max = Math.min(pics.length, (pics.length - curpic > half ? curpic + half + Math.max(half - curpic, 0) : pics.length));

  if(pics.length - curpic < half) {
    min = Math.max(0, Math.min(min, min - (half - (pics.length - curpic))));
  }
  for(var i = min; i < max; ++i) {
    var status = state.images[pics[i]].status;
    var text = status == 'unseen' ? "<span class=\"fa-solid fa-eye-slash\"></span>"
             : (status == 'review' ? "<span class=\"fa-solid fa-magnifying-glass\"></span>"
                                   : "<span class=\"fa-solid fa-eye\"></span>");

    var activestr = state.current_pic == pics[i] ? " active" : "";
    $("<li class=\"page-item" + activestr +
      "\"><span style=\"text-align:center;\"><a class=\"page-link\" href=\"#\" onclick=\"choosePic("
      + pics[i] + ");\">" + text + "<br>" + (pics[i] + 1)
      + "</a></span></li>").appendTo(ul);
  }
  $("<li class=\"page-item" + (state.current_pic + 1 < state.images.length ? "" : " disabled") +
    "\"><a class=\"page-link\" href=\"#\" onclick=\"choosePic(next_pic_number())\" aria-label=\"Next\">" +
    "<span aria-hidden=\"true\">&raquo;</span><span class=\"sr-only\">Next</span><br>&nbsp;" +
    "</a></li>").appendTo(ul);

  // update progressbar
  var num = []; num["seen"] = 0; num["review"] = 0; num["unseen"] = 0;
  var counts = [];
  var curcounting = state.images[0].status;
  var count = 0;
  for(var i = 0; i < state.images.length; ++i) {
    if(state.images[i].status == curcounting) {
      count += 1;
    }
    else {
      counts.push({ what: curcounting, val: count });
      curcounting = state.images[i].status;
      count = 1;
    }
  }
  if(count != 0) {
    counts.push({ what: curcounting, val: count });
  }
  $('#progressdiv').html('');
  for(var i = 0; i < counts.length; ++i) {
    var progress = (100.0 * counts[i].val) / state.images.length;
    var color = (counts[i].what == 'seen' ? 'bg-success'
              : (counts[i].what == 'review' ? 'bg-danger' : 'bg-primary'));

    $('#progressdiv').append("<div class=\"progress-bar " + color + "\" role=\"progressbar\" "
      + "style=\"width: " + progress + "%\" aria-valuenow=\"" + progress
      + "\" aria-valuemin=\"0\" aria-valuemax=\"100\"></div>");
  }
  reloadImgStatus();
  $('#pagenumbertext').val(state.current_pic + 1);
}

function requestBreak() {
  fire_tip('You\'ve been labeling for about an hour. Consider taking a break.');
  setTimeout(requestBreak, REQUEST_BRAKE_TIME);
}

// go to annotation phase
function startAnnotation() {
  if($('#tipsenabled').prop('checked')) {
    setTimeout(requestBreak, REQUEST_BRAKE_TIME);
  }
  delete state.spec;
  $('#pagenumbertext').attr("max", state.images.length);

  var classch = $("#classdropdown").prev().children();
  classch.filter("* > input").prop("disabled", true).val('');
  var classchdivch = classch.filter("* > div").children();
  classchdivch.filter("* > input").prop("disabled", true).val('');
  classchdivch.prop('disabled', true);
  $('#initial-menu').hide(200, function() {
    updatePagination();
    $('#annot').show(200, function() {
      var w = window.innerWidth * 0.8;
      if(hasCsv) {
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

      $('#success-toast-body').text("Happy Annotating! :^)");
      bootstrap.Toast.getInstance(document.getElementById('success-toast')).show(100);
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
    $('#csvbutton').prop("disabled", true);
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
      $('#csvbutton').prop("disabled", false);
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
      $('#error-toast-body').text("Provided JSON is not in COCO format.");
      bootstrap.Toast.getInstance(document.getElementById('error-toast')).show(100);

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
    var img2imgid = [];
    for(var i = 0; i < state.spec.images.length; ++i) {
      imgid2img[state.spec.images[i].id] = state.spec.images[i].file_name;
      img2imgid[state.spec.images[i].file_name] = state.spec.images[i].id;
    }
    for(var j = 0; j < state.images.length; ++j) {
      var specimg = state.spec.images[img2imgid[state.images[j].file.name]];
      if(specimg && specimg.status) {
        state.images[j].status = specimg.status;
      }
    }
    for(var j = 0; j < state.images.length; ++j) {
      var img = state.images[j].file;
      var bboxes = [];
      for(var i = 0; i < state.spec.annotations.length; ++i) {
        var annot = state.spec.annotations[i];
        if(imgid2img[annot.image_id].includes(img.name)) {
          var imgw = state.spec.images[annot.image_id].width;
          var imgh = state.spec.images[annot.image_id].height;
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
          $('#error-toast-body').text("Provided JSON is not in MegaDetector format.");
          bootstrap.Toast.getInstance(document.getElementById('error-toast')).show(100);
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
      console.log("JSON does not contain:\n" + unmatched + "\n(you may still annotate them, this message is only there to help debugging if you expected all images to be in the JSON)");
      $('#error-toast-body').text("Some images were not present in the JSON. Check them out by [RightClick] -> Inspect and then read what is written on the console.");
      bootstrap.Toast.getInstance(document.getElementById('error-toast')).show(100);
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
  $('#csvbutton').prop("disabled", false);
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
        $('#error-toast-body').text("You did not select a JSON file.");
        bootstrap.Toast.getInstance(document.getElementById('error-toast')).show(100);
        $('#jsonbutton').val('');
        return ;
      }
      $('#bag').toggle();
      $('#jsoncheckmark').show(500, mayEnableAnnotButton);
      $('#success-toast-body').text("Your selected files are available.");
      bootstrap.Toast.getInstance(document.getElementById('success-toast')).show(100);

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
function basename(path) {
  return path.split(/[\\/]/).pop();
}
function storeCSV(csvobj) {
  // take care of the metainfo from the csv
  for(var i = 0; i < state.images.length; ++i) {
    var row = undefined;
    for(var j = 0; j < csvobj.filename.length; ++j) {
      if(csvobj.filename[j] == state.images[i].file.name) {
        row = j; break;
      }
    }
    if(row === undefined) continue;
    // now set the info
    state.images[i].csvobj = {
      species_common_name: csvobj.species_common_name[row],
      species_sci: csvobj.species_sci[row],
      sex: csvobj.sex[row],
      age: csvobj.age[row],
      count: csvobj.count[row],
      bounding_boxes: csvobj.bounding_boxes[row],
    };
  }
}
function loadcsv(files) {
  var reader = new FileReader();
  reader.onload = function(event) {
      var str = event.target.result;
      var grid = parseCsv(str, ';');
      if(!grid || !grid[0] || !grid[0].length) {
        return;
      }
      hasCsv = true;
      $('#canvasdiv').css('min-width', '80%').css('max-width', '80%');
      $('#csvspace').css('min-width', '20%');

      var csvobject = { filename: [], species_common_name: [], species_sci: [], sex: [], age: [], count: [],
                        bounding_boxes: [] };
      var csvhelp = { filename_idx : undefined, species_common_name_idx: undefined, bounding_boxes_idx : undefined,
                      species_sci_idx: undefined, sex_idx: undefined, age_idx: undefined, count_idx: undefined };
      // find the indices in the grid
      for(var i = 0; i < grid[0].length; ++i) {
        var str = grid[0][i].replace(/['"]+/g, '');
        if(str == "filename") {
          csvhelp.filename_idx = i;
        }
        else if(str == "species_common_name" || str == "species_common") {
          csvhelp.species_common_name_idx = i;
        }
        else if(str == "species_sci" || str == "species_scientific") {
          csvhelp.species_sci_idx = i;
        }
        else if(str == "sex") {
          csvhelp.sex_idx = i;
        }
        else if(str == "age") {
          csvhelp.age_idx = i;
        }
        else if(str == "count") {
          csvhelp.count_idx = i;
        }
        else if(str == "bounding_boxes") {
          csvhelp.bounding_boxes_idx = i;
        }
      }
      var transmogrify = function(array, index) {
        for(var row = 1; row < grid.length; ++row) {
          if(index == csvhelp.filename_idx) {
            array.push(basename(grid[row][index]));
          }
          else if(index == csvhelp.bounding_boxes_idx) {
            var reg = /(\d\.\d*)/g;
            var matches = [];
            var numbers = [];
            while((matches = reg.exec(grid[row][index])) != null) {
              numbers.push(parseFloat(matches[1]));
            }
            var bboxes = [];
            for(var i = 0; i < numbers.length; i += 4) {
              bboxes.push({left: numbers[i], top: numbers[i+1], width: numbers[i+2], height: numbers[i+3]});
            }
            array.push(bboxes);
          }
          else {
            array.push(grid[row][index]);
          }
        }
      };
      transmogrify(csvobject.filename, csvhelp.filename_idx);
      transmogrify(csvobject.species_common_name, csvhelp.species_common_name_idx);
      transmogrify(csvobject.species_sci, csvhelp.species_sci_idx);
      transmogrify(csvobject.sex, csvhelp.sex_idx);
      transmogrify(csvobject.age, csvhelp.age_idx);
      transmogrify(csvobject.count, csvhelp.count_idx);
      transmogrify(csvobject.bounding_boxes, csvhelp.bounding_boxes_idx);
      storeCSV(csvobject);
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
  var ignored = [];
  var count = 0;
  for(var i = 0; i < files.length; i++) {
    if(!isImage(files[i])) {
      ignored.push("\"" + files[i].name + "\"");
    }
    else {
      state.images[count] = state.images[count] ? state.images[count] : {};
      state.images[count].file = files[count];
      state.images[count].status = 'unseen';
      ++count;
    }
  }
  if(ignored.length > 0) {
    $('#error-toast-body').text("The following files do not appear to be images and are thus ignored: " + ignored.join(", "));
    bootstrap.Toast.getInstance(document.getElementById('error-toast')).show(100);
  }
  if(count > 0) {
    $('#filecheckmark').show(500, mayEnableAnnotButton);
    $('#success-toast-body').text("Your selected files are available.");
    bootstrap.Toast.getInstance(document.getElementById('success-toast')).show(100);
  }
  else {
    $('#filecheckmark').hide();
  }
}

// handle logic of little test box for classes
$('#classinput').on('input', function() {
  var text = $('#classinput').val();
  var match = text.split(';')
  $('#testselect').html('');
  $('#classdropdown').html('');
  label2rainbowstep = [];
  var i = 0;
  for(var a in match) {
    if(match[a] == "" || !(/\S/.test(match[a])))
      continue;
    $("<option value=\"" + match[a] + "\">" +
      match[a] + "</option>").appendTo($('#testselect'));
    $("<option value=\"" + match[a] + "\">" +
      match[a] + "</option>").appendTo($('#classdropdown'));

    label2rainbowstep[match[a]] = i++;
  }
  label2rainbowstep_len = i;
  $('#testselect').combobox('refresh');
  $('#classdropdown').combobox('refresh');
});
$('#classinput').trigger("input");

$('#testselect').combobox();
$('#classdropdown').combobox({
  template: function () {
    return '<div class="combobox-container"> <input type="hidden" /> <div class="input-group"> <input id="classdropdowninput" type="text" autocomplete="off" />'
    + '<button type="button" class="btn btn-danger dropdown-toggle dropdown-toggle-split" data-bs-toggle="dropdown" data-toggle="dropdown" aria-expandend="false"><span class="visually-hidden">Toggle Dropdownbox</span></button>'
  },
});
$('.combobox').on('change', function(){
  var option = $(this).find('option:selected');
  if($(this).attr('id') == 'classdropdown') {
    updateBBOXInfo({label:option.val()});
  }
  setTimeout(function() { $(':focus').blur() }, 0);
});

function setPagination(value) {
  var val = Math.min(state.images.length - 1, Math.max(0, value));
  $("#pagenumbertext").val(val+1);
  if(val != state.current_pic) {
    choosePic(val);
  }
}

function next_pic_number() {
  var next_pic = state.current_pic + 1;
  if(next_pic >= state.images.length) {
    next_pic = 0;
  }
  var full_round = false;
  var initial = next_pic;
  var st = state.images[next_pic].status;
  while((st == 'seen' && $('#filterseen').prop('checked'))
     || (st == 'review' && $('#filterreview').prop('checked'))) {
    next_pic += 1;
    if(next_pic >= state.images.length) {
      next_pic = 0;
    }
    st = state.images[next_pic].status;
    if(initial == next_pic)
      break;
  }
  return next_pic;
}
function prev_pic_number() {
  var next_pic = state.current_pic - 1;
  if(next_pic < 0) { 
    next_pic = state.images.length - 1;
  }
  var full_round = false;
  var initial = next_pic;
  var st = state.images[next_pic].status;
  while((st == 'seen' && $('#filterseen').prop('checked'))
     || (st == 'review' && $('#filterreview').prop('checked'))) {
    next_pic -= 1;
    if(next_pic < 0) { 
      next_pic = state.images.length - 1;
    }
    st = state.images[next_pic].status;
    if(initial == next_pic)
      break;
  }
  return next_pic;
}

$(document).on('keyup', function(e) {
  if($('#annot').css('display') == 'none')
    return;
  if(e.key == "Delete" || e.key == "Backspace" || e.key == "x") {
    var bbox = canvas.getActiveObject();
    if(bbox && bbox.conf) {
      deletebox(undefined, {target: bbox});
    }
  }
  else if(e.key == " " || e.key == "ArrowRight") {
    if(e.key == " ") {
      $(':focus').blur()
      state.images[state.current_pic].status = 'seen';
    }
    var nothing_undefined = true;
    for(var i = 0; i < state.boxes.length; ++i) {
      if(state.boxes[i].label == "undefined") {
        nothing_undefined = false;
        break;
      }
    }
    if(nothing_undefined) {
      var next_pic = next_pic_number();
      if(next_pic != state.current_pic) {
        choosePic(next_pic);
      }
      updatePagination();
    }
  }
  else if(e.key == "ArrowLeft") {
    var next_pic = prev_pic_number();
    if(next_pic != state.current_pic) {
      choosePic(next_pic);
    }
  }
});

function markImg(what) {
  state.images[state.current_pic].status = what;
  var next_pic = next_pic_number();
  if(next_pic != state.current_pic) {
    choosePic(next_pic);0.6
  }
  updatePagination();
}
function markImgBtn(what) {
  if(this.statistics) {
    if(what == 'seen') {
      if(this.statistics == TIP_THRESHHOLD) {
        fire_tip('Hit [Space] to mark current images as done (<i class="fa-solid fa-eye"></i>) and go to next one.');
      }
      this.statistics += 1;
    }
  }
  else {
    this.statistics = 1;
  }
  return markImg(what);
}

