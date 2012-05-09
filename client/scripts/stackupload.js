(function() {
  var PROCESS_SERVER, STATIC_SERVER, UPLOAD_SERVER, p0, p1, p2, p3, public_datasets,
    __slice = Array.prototype.slice;

  STATIC_SERVER = 'http://amibox04.scripps.edu:80';

  UPLOAD_SERVER = 'http://amibox04.scripps.edu:9000';

  PROCESS_SERVER = 'http://amibox04.scripps.edu:9050';

  self.path = {
    splitext: function(path) {
      var matches;
      matches = path.match(/^(.+)([.].+)$/);
      if (matches) {
        return matches.slice(1);
      } else {
        return null;
      }
    }
  };

  public_datasets = [
    p0 = {
      name: 'Select A Public Dataset',
      hedid: void 0,
      imgid: void 0
    }, p1 = {
      name: '30S Ribosomes',
      hedid: 'c6042e2d01bd945d468953610a9d1775',
      imgid: 'c12e8941932e72794011d068c024e8bb'
    }, p2 = {
      name: 'Listerin',
      hedid: 'e2baa1fb79a0a9d02a213ed8a432446a',
      imgid: 'e453f406f293ee105ee99c42f9fe6343'
    }, p3 = {
      name: 'Synthethic Dataset',
      hedid: '8b0846bf8e6ad7e554239a93f68abee6',
      imgid: '5fd0dfe8514d7237a90fe9f60ece6853'
    }
  ];

  require(['jquery-1.7.1', 'knockout-2.0.0', 'md5', 'useful', 'time', 'upload', 'progress'], function() {
    var ViewModel, colors, dec, hashFile, inc, maskOnStack, progress, time, uiUploadProgress, upload, uploadStack, useful, _, _i;
    _ = 5 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 4) : (_i = 0, []), useful = arguments[_i++], time = arguments[_i++], upload = arguments[_i++], progress = arguments[_i++];
    uploadStack = function(hedid, imgid, callb) {
      var params;
      params = JSON.stringify({
        hedid: hedid,
        imgid: imgid
      });
      return $.post("" + PROCESS_SERVER + "/stacks", params, function(data) {
        return callb(data.projectid, data.stackid);
      });
    };
    maskOnStack = function(projectid, stackid) {
      var url;
      url = "" + STATIC_SERVER + "/masking.html?projectid=" + projectid + "&stackid=" + stackid;
      return window.location = url;
    };
    hashFile = function(file) {
      var id1, id2, id3, _ref;
      id1 = file.name;
      id2 = file.size;
      id3 = ((_ref = file.lastModifiedDate) != null ? _ref.getTime() : void 0) || file.mozFullPath;
      return MD5.hash("" + id1 + "-" + id2 + "-" + id3);
    };
    ko.bindingHandlers.fileinput = {
      init: function(element, _value, _, vm) {
        return $(element).on('change', function(event) {
          return _value()(element.files);
        });
      }
    };
    colors = {
      yellow: [255, 190, 50, 1.0],
      red: [255, 150, 150, 1.0],
      green: [150, 200, 150, 1.0],
      gray: [100, 100, 100, 1.0],
      asCSS: function(_arg) {
        var a, b, g, r;
        r = _arg[0], g = _arg[1], b = _arg[2], a = _arg[3];
        return "rgba(" + r + "," + g + "," + b + "," + (a || 1.0) + ")";
      }
    };
    uiUploadProgress = function(up) {
      var ui;
      ui = {};
      ui.upload = up;
      ui.name = up.file.name;
      ui.button = {
        action: ko.computed(function() {
          switch (up.status()) {
            case 'uploading...':
              return function() {
                return up.stop();
              };
            case 'uploaded':
              return function() {
                return up.restart();
              };
            default:
              return function() {
                return up.resume();
              };
          }
        }),
        color: ko.computed(function() {
          switch (up.status()) {
            case 'uploading...':
              return colors.asCSS(colors.yellow);
            case 'uploaded':
              return colors.asCSS(colors.red);
            default:
              return colors.asCSS(colors.green);
          }
        }),
        text: ko.computed(function() {
          switch (up.status()) {
            case 'uploading...':
              return 'Stop';
            case 'uploaded':
              return 'Restart';
            default:
              return 'Resume';
          }
        })
      };
      ui.progress = progress.uiProgressBar({
        percent: up.progress.done.percent,
        rgba: ko.computed(function() {
          switch (up.status()) {
            case 'waiting...':
              return colors.yellow;
            case 'stopped':
              return colors.yellow;
            case 'uploading...':
              return colors.green;
            case 'uploaded':
              return colors.green;
            default:
              return colors.red;
          }
        }),
        message: ko.computed(function() {
          var rate;
          switch (up.status()) {
            case 'uploading...':
              time = up.progress.remaining.time.nice();
              rate = up.progress.rate.nice();
              return "" + time + " @ " + rate;
            default:
              return up.status();
          }
        }),
        animate: ko.computed(function() {
          switch (up.status()) {
            case 'waiting...':
              return false;
            case 'stopped':
              return false;
            case 'uploading...':
              return true;
            case 'uploaded':
              return false;
            case 'server did not like us...':
              return false;
            case 'upload connection lost...':
              return false;
          }
        }),
        stripes: ko.computed(function() {
          switch (up.status()) {
            case 'waiting...':
              return false;
            case 'stopped':
              return true;
            case 'uploading...':
              return true;
            case 'uploaded':
              return false;
            case 'server did not like us...':
              return true;
            case 'upload connection lost...':
              return true;
          }
        })
      });
      return ui;
    };
    inc = function(obs, val) {
      if (val == null) val = 1;
      return obs(obs() + val);
    };
    dec = function(obs, val) {
      if (val == null) val = 1;
      return obs(obs() - val);
    };
    ViewModel = {};
    ViewModel.status = ko.observable('no files selected');
    ViewModel.hedid = ko.observable(void 0);
    ViewModel.imgid = ko.observable(void 0);
    ViewModel.public_datasets = public_datasets;
    ViewModel.selectedDataset = ko.observable(void 0);
    ViewModel.selectedDataset.subscribe(function(value) {
      ViewModel.hedid(value.hedid);
      return ViewModel.imgid(value.imgid);
    });
    ViewModel.proceed = ko.computed(function() {
      var hedid, imgid;
      hedid = ViewModel.hedid();
      imgid = ViewModel.imgid();
      if (hedid && imgid) {
        return {
          enabled: true,
          action: function() {
            return uploadStack(hedid, imgid, maskOnStack);
          }
        };
      } else {
        return {
          enabled: false
        };
      }
    });
    ViewModel.uploads = ko.observableArray();
    ViewModel.uploads.todo = ko.observable(0);
    ViewModel.uploads.done = ko.observable(0);
    ViewModel.uploads.errors = ko.observable(0);
    ViewModel.uploads.stopped = ko.observable(0);
    ViewModel.progress = progress.uiProgressBar(progress.Progress({
      stripes: ko.computed(function() {
        var done, todo;
        todo = ViewModel.uploads.todo();
        done = ViewModel.uploads.done();
        if (todo > 0 && done < todo) return true;
        return false;
      }),
      animate: ko.computed(function() {
        var done, todo;
        todo = ViewModel.uploads.todo();
        done = ViewModel.uploads.done();
        if (todo > 0 && done < todo) return true;
        return false;
      }),
      rgba: ko.computed(function() {
        if (ViewModel.uploads.errors() > 0) {
          return colors.red;
        } else if (ViewModel.uploads.stopped() > 0) {
          return colors.yellow;
        } else if (ViewModel.uploads.todo() === 0) {
          return colors.gray;
        }
        return colors.green;
      }),
      message: ko.computed(function() {
        var bdone, btodo, done, rate, todo;
        todo = ViewModel.uploads.todo();
        if (todo > 0) {
          done = ViewModel.uploads.done();
          btodo = ViewModel.progress.total.nice();
          bdone = ViewModel.progress.done.nice();
          rate = ViewModel.progress.rate.nice();
          return "" + done + " of " + todo + " files, " + bdone + " of " + btodo + ", " + rate;
        } else {
          return '';
        }
      })
    }));
    ViewModel.addToUploads = function(newfiles) {
      var file, hash, uploader, _j, _len, _results;
      _results = [];
      for (_j = 0, _len = newfiles.length; _j < _len; _j++) {
        file = newfiles[_j];
        hash = hashFile(file);
        uploader = new upload.Uploader(file, "" + UPLOAD_SERVER + "/uploads/" + hash);
        _results.push((function(uploader) {
          var vmupload;
          vmupload = uiUploadProgress(uploader);
          ViewModel.uploads.push(vmupload);
          uploader.onupload = function(data) {
            return ViewModel.handleUpload(uploader.file, data);
          };
          return uploader.start();
        })(uploader));
      }
      return _results;
    };
    ViewModel.handleUpload = function(file, data) {
      var base, ext, _ref;
      _ref = path.splitext(file.name), base = _ref[0], ext = _ref[1];
      switch (ext) {
        case '.img':
          ViewModel.imgid(data.id);
          break;
        case '.hed':
          ViewModel.hedid(data.id);
      }
      return console.log(ViewModel.hedid(), ViewModel.imgid());
    };
    $(document).ready(function() {
      ko.applyBindings(ViewModel);
      if ($.browser.mozilla) {
        return $('button>input[type="file"]').parent().on('click', function(e) {
          return $('input[type="file"]', e.target).click();
        });
      }
    });
    return self.ViewModel = ViewModel;
  });

}).call(this);