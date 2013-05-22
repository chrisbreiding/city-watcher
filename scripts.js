// Generated by CoffeeScript 1.6.2
(function() {
  var allBuildTypes, branchBuildTemplate, branchListSource, buildType, createBuildList, daysToLookBack, hash, runFixtureMode, server, serverEndPoint, serverListSource, serverListTemplate, serversToMonitor, updateServerList, _i, _j, _len, _len1, _ref;

  hash = window.location.hash;

  if (hash) {
    serversToMonitor = JSON.parse(hash.slice(1));
    serverListSource = $('#serverList').html();
    serverListTemplate = Handlebars.compile(serverListSource);
    branchListSource = $('#branchBuildList').html();
    branchBuildTemplate = Handlebars.compile(branchListSource);
    daysToLookBack = moment().subtract('days', 3).format('YYYYMMDDTHHmmssZZ');
    allBuildTypes = {};
    for (_i = 0, _len = serversToMonitor.length; _i < _len; _i++) {
      server = serversToMonitor[_i];
      serverEndPoint = "" + server.protocol + "://" + server.address + "/app/rest/";
      _ref = server.buildTypes;
      for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
        buildType = _ref[_j];
        server.urlForSpecificBuildType = "" + serverEndPoint + "buildTypes/id:";
        allBuildTypes[buildType] = {
          urlForRunningBuilds: "" + serverEndPoint + "builds?locator=running:all,branch:branched:any,buildType:" + buildType + ",sinceDate:" + daysToLookBack,
          urlForSpecificBuild: "" + serverEndPoint + "builds/id:",
          name: "master-" + buildType
        };
      }
    }
  }

  createBuildList = function() {
    var buildConfigurations, html, serversProjection;

    serversProjection = (function() {
      var _k, _len2, _results;

      _results = [];
      for (_k = 0, _len2 = serversToMonitor.length; _k < _len2; _k++) {
        server = serversToMonitor[_k];
        buildConfigurations = (function() {
          var _l, _len3, _ref1, _results1;

          _ref1 = server.buildTypes;
          _results1 = [];
          for (_l = 0, _len3 = _ref1.length; _l < _len3; _l++) {
            buildType = _ref1[_l];
            $.getJSON(server.urlForSpecificBuildType + buildType, function(data) {
              var buildTypeToUpdate;

              $("#" + data.id + " h2").text(data.name);
              buildTypeToUpdate = allBuildTypes[data.id];
              return allBuildTypes[data.id] = {
                urlForRunningBuilds: buildTypeToUpdate.urlForRunningBuilds,
                urlForSpecificBuild: buildTypeToUpdate.urlForSpecificBuild,
                name: data.name
              };
            });
            _results1.push({
              id: buildType,
              name: buildType
            });
          }
          return _results1;
        })();
        _results.push({
          friendlyName: server.friendlyName,
          buildConfigurations: buildConfigurations
        });
      }
      return _results;
    })();
    html = serverListTemplate({
      servers: serversProjection
    });
    return document.body.innerHTML = html;
  };

  updateServerList = function() {
    var buildTypeId, _results;

    _results = [];
    for (buildTypeId in allBuildTypes) {
      buildType = allBuildTypes[buildTypeId];
      _results.push((function(buildTypeId, buildType) {
        return $.getJSON(buildType.urlForRunningBuilds, function(data) {
          var O_o, branch, branchName, build, buildDoesNotExist, buildInfo, buildKey, buildProjection, builds, displayName, id, liForBuildType, liForSpecificBuild, running, status, statuses, _k, _l, _len2, _len3, _len4, _len5, _m, _n, _ref1, _results1;

          builds = {};
          if (data.count > 0) {
            _ref1 = data.build;
            for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
              build = _ref1[_k];
              buildKey = build.branchName || buildTypeId;
              if ((builds[buildKey] == null) && build.status !== "UNKNOWN") {
                builds[buildKey] = {
                  buildType: buildType,
                  build: build
                };
              }
            }
            buildProjection = (function() {
              var _results1;

              _results1 = [];
              for (O_o in builds) {
                buildInfo = builds[O_o];
                running = buildInfo.build.running;
                branchName = (buildInfo.build.branchName == null) || buildInfo.build.branchName === "refs/heads/master" ? "master" : buildInfo.build.branchName;
                id = "" + buildTypeId + "-" + branchName;
                displayName = branchName === "master" ? buildType.name : branchName;
                if (running) {
                  (function(id) {
                    return $.getJSON(buildType.urlForSpecificBuild + buildInfo.build.id, function(data) {
                      $("#" + id + " p.status-text").text(data.statusText);
                      return $("#" + id + " p.stage-text").text(data["running-info"].currentStageText);
                    });
                  })(id);
                }
                _results1.push({
                  id: id,
                  buildTypeId: buildTypeId,
                  status: buildInfo.build.status.toLowerCase(),
                  name: displayName,
                  percentageComplete: buildInfo.build.percentageComplete || (running ? 0 : 100),
                  running: running ? "running" : "not-running"
                });
              }
              return _results1;
            })();
          } else {
            buildProjection = [
              {
                id: buildTypeId + "master",
                buildTypeId: buildTypeId,
                status: "no-recent-builds",
                name: "" + (buildType.name || buildTypeId) + " - No Recent Builds",
                percentageComplete: 100,
                running: "not-running"
              }
            ];
          }
          _results1 = [];
          for (_l = 0, _len3 = buildProjection.length; _l < _len3; _l++) {
            build = buildProjection[_l];
            buildDoesNotExist = $("#" + build.id).length < 1;
            if (buildDoesNotExist) {
              $("#" + buildTypeId + " ul").append(branchBuildTemplate({
                builds: buildProjection
              }));
            }
            liForBuildType = $("#" + build.buildTypeId);
            liForSpecificBuild = $("#" + build.id);
            liForSpecificBuild.find('h2').text(build.name);
            statuses = ['failure', 'success', 'no-recent-builds'];
            liForSpecificBuild.addClass("status-" + build.status);
            liForBuildType.addClass("status-" + build.status);
            for (_m = 0, _len4 = statuses.length; _m < _len4; _m++) {
              status = statuses[_m];
              if (status !== build.status) {
                liForSpecificBuild.removeClass("status-" + status);
              }
            }
            for (_n = 0, _len5 = statuses.length; _n < _len5; _n++) {
              status = statuses[_n];
              if (status !== build.status) {
                liForBuildType.removeClass("status-" + status);
              }
            }
            branch = liForSpecificBuild.find(".branch");
            if (build.running === "running") {
              li.removeClass('not-running').addClass('running');
              liForBuildType.removeClass('not-running').addClass('running');
              _results1.push(branch.width("" + (build.percentageComplete - 20) + "%"));
            } else {
              liForSpecificBuild.removeClass('running').addClass('not-running');
              liForBuildType.removeClass('running').addClass('not-running');
              _results1.push(branch.width("100%"));
            }
          }
          return _results1;
        });
      })(buildTypeId, buildType));
    }
    return _results;
  };

  runFixtureMode = function() {
    var runningDiv;

    $('#fixtures').show();
    runningDiv = $('.running .branch');
    return setInterval(function() {
      return runningDiv.each(function() {
        var $this, widthPercentage;

        $this = $(this);
        widthPercentage = parseInt($this.data('widthPercentage')) || 10;
        if (widthPercentage === 100) {
          widthPercentage = 0;
        } else {
          widthPercentage = Math.min(widthPercentage += Math.floor(Math.random() * 20), 100);
        }
        return $this.data('widthPercentage', widthPercentage).css({
          width: "" + widthPercentage + "%"
        });
      });
    }, 1500);
  };

  $(function() {
    if (hash) {
      createBuildList();
      updateServerList();
      return setInterval(updateServerList, 5000);
    } else {
      return runFixtureMode();
    }
  });

}).call(this);
