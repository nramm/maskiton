(function() {

  define(['coffee/base'], function(base) {
    var XmippSOMJob, XmippSOMParams, imageURL, stackURL, xmippSomURL;
    XmippSOMParams = function(opts) {
      var params;
      if (opts == null) opts = {};
      params = {};
      params.name = 'XMIPP SOM Classification';
      params.templateid = 't_xmipp_som_params';
      params.xdim = base.observable(8);
      params.ydim = base.observable(2);
      params.layer = base.observable(opts.layer);
      params.server = base.observable(opts.server);
      params.stackid = base.observable(opts.stackid);
      params.start = function() {
        return startXMIPPSOMJob(params);
      };
      return params;
    };
    imageURL = function(server, imageid) {
      if (imageid) {
        return "http://" + server + "/images/" + imageid;
      } else {
        return "http://" + server + "/images";
      }
    };
    stackURL = function(server, stackid) {
      if (stackid) {
        return "http://" + server + "/stacks/" + stackid;
      } else {
        return "http://" + server + "/stacks/" + stackid;
      }
    };
    xmippSomURL = function(server, jobid) {
      if (jobid) {
        return "http://" + server + "/xmippsom/jobs/" + jobid;
      } else {
        return "http://" + server + "/xmippsom/jobs";
      }
    };
    return XmippSOMJob = function(params) {
      var abort, job, startPolling;
      abort = false;
      job = {};
      job.name = 'XMIPP SOM Classification';
      job.templateid = 't_xmipp_som_job';
      job.mask = params.layer().masked().toDataURL('image/png');
      job.stackid = params.stackid();
      job.xdim = params.xdim();
      job.ydim = params.ydim();
      job.server = params.server();
      job.imageurl = imageURL(job.server);
      job.jobsubmiturl = xmippSomURL(job.server);
      job.jobprogressurl = void 0;
      job.status = jsem.observable('starting...');
      job.progress = uiProgress(Progress());
      job.classurls = ko.observable([]);
      job.start = function() {
        abort = false;
        job.status('saving mask to server...');
        return $.ajax(imageURL(job.server, {
          type: 'POST',
          data: job.mask,
          success: function(result) {
            var jobparams;
            if (abort) return;
            job.status('starting job on server...');
            jobparams = JSON.stringify({
              maskid: result.imageid,
              stackid: job.stackid,
              xdim: job.xdim,
              ydim: job.ydim
            });
            return $.post(job.jobsubmiturl, jobparams, function(response) {
              return startPolling(response.processurl);
            });
          }
        }));
      };
      job.abort = function() {
        return abort = true;
      };
      startPolling = function(url) {
        var poll;
        poll = function() {
          if (abort) return;
          return $.get(url, null, function(response) {
            if (response.done !== job.progress.done()) {
              job.status(response.status);
              job.progress.done(response.done);
              job.progress.total(response.total);
              job.classurls(response.imageurls);
            }
            return setTimeout(poll, 1000);
          });
        };
        return poll();
      };
      return job;
    };
  });

}).call(this);
