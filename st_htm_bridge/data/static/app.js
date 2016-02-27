angular.module("app",["ui.bootstrap","templates","ui.router","home","sensors","pageNotFound"]),angular.module("app").constant("CONFIG",{STRING_COLUMNS:["component","timezone"],LIMIT_OPTIONS:[100,500,1e3,5e3,1e4,5e4],AGGREGATE_OPTIONS:[{label:"seconds",value:"s"},{label:"minutes",value:"m"},{label:"hours",value:"h"},{label:"days",value:"d"},{label:"weeks",value:"w"}],SINCE_OPTIONS:[{number:10,units:"minutes"},{number:1,units:"hour"},{number:3,units:"hours"},{number:6,units:"hours"},{number:12,units:"hours"},{number:1,units:"day"},{number:3,units:"days"},{number:1,units:"week"},{number:2,units:"weeks"},{number:1,units:"month"},{number:3,units:"months"}],CHART_FIELDS:{anomalyScore:{color:"rgb(201,12,6)"},anomalyLikelihood:{color:"rgb(204,122,5)"},value:{color:"rgb(4,138,191)"}},ANOMALY_THRESHOLD:.9,THRESHOLD_HIGHLIGHT_FIELDS:["anomalyScore","anomalyLikelihood"]}),angular.module("app").config(["$stateProvider","$urlRouterProvider",function(e,n){e.state("home",{url:"/",templateUrl:"routes/home/home.tpl.html",controller:"HomeController"}).state("pageNotFound",{url:"/pageNotFound",templateUrl:"routes/pageNotFound/pageNotFound.tpl.html",controller:"PageNotFoundController"}),n.when("","/"),n.otherwise("/pageNotFound")}]),angular.module("templates",[]),angular.module("app").controller("appCtrl",["$scope",function(e){}]),angular.module("pageNotFound",[]).controller("PageNotFoundController",["$scope",function(e){}]),angular.module("app").directive("breadcrumb",["$state",function(e){return{restrict:"E",replace:!0,templateUrl:"directives/breadcrumb.tpl.html",link:function(n,t,a){n.breadcrumbs=[],n.$on("$stateChangeSuccess",function(t,a,i){n.breadcrumbs.length=0,"sensors.list"===e.current.name?n.breadcrumbs.push({name:"Sensors",state:"sensors.list",active:!0}):"sensors.type.sensor"===e.current.name&&(n.breadcrumbs.push({name:"Sensors",state:"sensors.list",active:!1}),n.breadcrumbs.push({name:i.type+"/"+i.sensor,state:"sensors.type.sensor({ type: '"+i.type+"', sensor: '"+i.sensor+"' })",active:!0}))})}}}]),angular.module("app").directive("stbChart",["$http","stbUtils","CONFIG",function(e,n,t){return{restrict:"EA",scope:{sensorName:"@"},replace:!0,templateUrl:"directives/stbChart.tpl.html",link:function(n,a,i){var s,o={};n.view||(n.view={}),n.view.chart=null,n.view.limitOptions=t.LIMIT_OPTIONS,n.view.limit=t.LIMIT_OPTIONS[0],n.view.since=null,n.view.sinceOptions=t.SINCE_OPTIONS,n.view.fieldStates=[],n.view.loading=!1,n.view.data=null,n.view.aggregateNumber=null,n.view.aggregateUnit=null,n.view.aggregateUnits=t.AGGREGATE_OPTIONS,o.globalLimits=n.$on("setLimits",function(e,t){t.limit===n.view.limit&&t.since===n.view.since&&t.aggregate.number===n.view.aggregateNumber&&t.aggregate.unit===n.view.aggregateUnit||(n.view.limit=t.limit,n.view.since=t.since,n.view.aggregateNumber=t.aggregate.number,n.view.aggregateUnit=t.aggregate.unit,n.getData())});var l=function(e){var n=moment(),t=moment.duration(e.number,e.units);return n.subtract(t).unix()},r=function(e){var n=t.STRING_COLUMNS,a=[],i=e.series[0];angular.forEach(i.columns,function(e,t){-1!==n.indexOf(e)&&a.push(t)}),a=a.reverse(),angular.forEach(a,function(e){i.columns.splice(e,1)}),angular.forEach(i.values,function(e){angular.forEach(a,function(n){e.splice(n,1)})})},u=function(e){var n=new Date(e);if("Invalid Date"!==n.toString())return n;var t=String(e).split(" "),a=[],i=t[0].split("/"),s=t[0].split("-");if(1===i.length&&1===s.length||i.length>1&&s.length>1)return v("Could not parse the timestamp","warning",!0),null;if(s.length>2)a.push(s[0]),a.push(s[1]),a.push(s[2]);else{if(!(i.length>2))return v("There was something wrong with the date in the timestamp field.","warning",!0),null;a.push(i[2]),a.push(i[0]),a.push(i[1])}if(t[1]){var o=t[1].split(":");a=a.concat(o)}for(var l=0;l<a.length;l++)a[l]=parseInt(a[l]);return n=new Function.prototype.bind.apply(Date,[null].concat(a)),"Invalid Date"===n.toString()?(v("The timestamp appears to be invalid.","warning",!0),null):n},c=function(e){var n=0;for(s=0;s<e.series[0].columns.length;s++)if("time"===e.series[0].columns[s]||"timestamp"===e.series[0].columns[s]){n=s;break}for(s=0;s<e.series[0].values.length;s++)e.series[0].values[s][n]=u(e.series[0].values[s][n]);return e},g=function(e){n.view.fieldStates.length=0;var a=0;for(s=0;s<e.series[0].columns.length;s++)if("time"!==e.series[0].columns[s]){var i=t.CHART_FIELDS[e.series[0].columns[s]].color||"rgb(0,0,0)";n.view.fieldStates.push({name:e.series[0].columns[s],visible:!0,id:a,color:i}),a++}},d=function(e,a,i){function s(n,t,i){var s=t-n;e.fillStyle=i,e.fillRect(n,a.y,s,a.h)}for(var o=0;o<n.view.fieldStates.length;o++){var l,r,u,c,g,d,m,p;if(-1!==t.THRESHOLD_HIGHLIGHT_FIELDS.indexOf(n.view.fieldStates[o].name)&&n.view.fieldStates[o].visible){if(d=n.view.fieldStates[o],m=n.view.data.series[0].columns.indexOf(d.name),0>m)return;g=d.color.replace("rgb","rgba").replace(")",",0.5)"),l=null,r=null,c=null,u=null;for(var v=n.view.data.series[0].values,h=0;h<v.length;h++)if(v[h][m]>=t.ANOMALY_THRESHOLD&&null===l&&(l=i.toDomXCoord(v[h][0].getTime()),u=h),v[h][m]>=t.ANOMALY_THRESHOLD&&(c=h),null!==l&&(v[h][m]<t.ANOMALY_THRESHOLD||h>=v.length-1)){if(h===c)r=i.toDomXCoord(v[c][0].getTime());else{var b=i.toDomXCoord(v[h][0].getTime())-i.toDomXCoord(v[c][0].getTime()),f=v[c][m]-v[h][m],w=Math.atan(b/f),S=v[c][m]-t.ANOMALY_THRESHOLD,y=S*Math.tan(w);r=i.toDomXCoord(v[c][0].getTime())+y}if(p=u-1,p>=0){var T=l-i.toDomXCoord(v[p][0].getTime()),O=v[u][m]-v[p][m],N=Math.atan(T/O),L=v[u][m]-t.ANOMALY_THRESHOLD,I=L*Math.tan(N);l-=I}s(l,r,g),l=null,r=null,c=null,u=null}}}},m=function(e){for(s=0;s<e.length;s++)n.view.fieldStates[s].color=e[s]};n.toggleVisibility=function(e){n.view.chart.setVisibility(e.id,e.visible)},n.showVisibilityToggle=function(){var e=!1;return angular.forEach(n.view.fieldStates,function(n){"anomalyScore"!==n.name&&"anomalyLikelihood"!==n.name||(e=!0)}),e},n.checkAggregate=function(){n.view.aggregateUnit&&n.view.since||(n.view.aggregateNumber=null,n.view.aggregateUnit=null)};var p=function(e){r(e),c(e),n.view.data=e};n.getData=function(){n.view.loading=!0;var t="/_data/sensor/"+n.sensorName,a={params:{}};null!==n.view.limit&&(a.params.limit=n.view.limit),null!==n.view.since&&(a.params.since=l(n.view.since)),null!==n.view.aggregateNumber&&null!==n.view.aggregateUnit&&(a.params.aggregate=n.view.aggregateNumber.toString()+n.view.aggregateUnit),e.get(t,a).then(function(e){angular.isDefined(e.data.series)?(p(e.data),null!==n.view.chart?n.view.chart.updateOptions({file:e.data.series[0].values}):n.view.chart=h(e.data)):n.view.chart=null},v)};var v=function(e){n.view.loading=!1,console.log(e)},h=function(e){g(e);var i=a.find(".chart-container");return new Dygraph(i[0],e.series[0].values,{labels:e.series[0].columns,sigFigs:5,series:{value:{strokeWidth:2,strokePattern:[4,1],color:t.CHART_FIELDS.value.color},anomalyScore:{axis:"y2",color:t.CHART_FIELDS.anomalyScore.color},anomalyLikelihood:{axis:"y2",color:t.CHART_FIELDS.anomalyLikelihood.color}},axes:{y2:{valueRange:[0,1.1]}},legend:"follow",labelsSeparateLines:!0,drawCallback:function(e,t){t&&m(e.getColors()),n.view.loading=!1},underlayCallback:d})};n.getData(),n.$on("$destroy",function(){angular.forEach(o,function(e){e()})})}}}]),angular.module("app").factory("stbUtils",function(){var e={getUrlQueryString:function(){var e=window.location.href.indexOf("?"),n="";return e>1&&(n=window.location.href.slice(window.location.href.indexOf("?")+1)),n},getUrlVars:function(){for(var e,n=[],t=getUrlQueryString().split("&"),a=0;a<t.length;a++)e=t[a].split("="),n.push(e[0]),n[e[0]]=e[1];return n}};return e}),angular.module("home",["ui.router"]),angular.module("home").controller("HomeController",["$scope","$http",function(e,n){}]),angular.module("pageNotFound",[]).controller("PageNotFoundController",["$scope",function(e){}]),angular.module("sensors",["ui.router"]),angular.module("sensors").config(["$stateProvider","$urlRouterProvider",function(e,n){e.state("sensors",{url:"/sensors","abstract":!0,templateUrl:"routes/sensors/sensors.tpl.html"}).state("sensors.list",{url:"",templateUrl:"routes/sensors/sensors.list.tpl.html",controller:"SensorsListController"}).state("sensors.type",{url:"/:type",templateUrl:"routes/sensors/sensor.type.tpl.html",controller:"SensorTypeController"}).state("sensors.type.sensor",{url:"/:sensor",templateUrl:"routes/sensors/sensor.tpl.html",controller:"SensorController"})}]),angular.module("sensors").controller("SensorsListController",["$scope","$http","CONFIG",function(e,n,t){e.sensors=[],e.sensorPath=function(e){var n=e.split("/");return{type:n[0],sensor:n[1]}},n.get("/_data/sensors").then(function(n){e.sensors=n.data}),e.setLimits=function(){e.$broadcast("setLimits",{limit:e.view.limit,since:e.view.since,aggregate:e.view.aggregate})},e.checkAggregate=function(){e.view.aggregate.unit&&e.view.aggregate.number||(e.view.aggregate.number=null,e.view.aggregate.unit=null)},e.view={sinceOptions:t.SINCE_OPTIONS,limitOptions:t.LIMIT_OPTIONS,limit:t.LIMIT_OPTIONS[0],since:null,aggregateOptions:t.AGGREGATE_OPTIONS,aggregate:{number:null,unit:null}}}]),angular.module("sensors").controller("SensorTypeController",["$scope","$http","$stateParams",function(e,n,t){}]),angular.module("sensors").controller("SensorController",["$scope","$http","$stateParams",function(e,n,t){e.view={sensor:t.type+"/"+t.sensor}}]),angular.module("templates").run(["$templateCache",function(e){e.put("directives/breadcrumb.tpl.html",'<ol class="breadcrumb">\n  <li><a ui-sref="home">Home</a></li>\n  <li ng-repeat="breadcrumb in breadcrumbs" ng-class="{ \'active\' : breadcrumb.active }"><a ng-if="!breadcrumb.active" ui-sref="{{breadcrumb.state}}">{{breadcrumb.name}}</a><span ng-if="breadcrumb.active">{{breadcrumb.name}}</li>\n</ol>\n'),e.put("directives/stbChart.tpl.html",'<div class="chart">\n  <div class="chart-controls form-horizontal form-inline">\n    <div class="form-group">\n      <div class="col-md-12">\n        <div class="btn-group" ng-show="showVisibilityToggle()">\n          <label class="control-label">Visibility:</label>\n          <ul class="set-visiblity">\n            <li ng-repeat="field in view.fieldStates track by field.id" ng-if="field.name === \'anomalyScore\' || field.name === \'anomalyLikelihood\'"><input type="checkbox" ng-model="field.visible" ng-click="toggleVisibility(field)"> <label style="color: {{field.color}}">{{field.name}}</label></li>\n          </ul>\n        </div>\n        <div class="btn-group">\n          <label class="control-label">Row Limit:</label>\n          <select class="form-control" ng-options="limit for limit in view.limitOptions" ng-model="view.limit">\n            <option value="">None</option>\n          </select>\n        </div>\n        <div class="btn-group">\n          <label class="control-label">Time limit:</label>\n            <select class="form-control" ng-change="checkAggregate()" ng-options="(value.number + \' \' + value.units) for (name, value) in view.sinceOptions" ng-model="view.since">\n              <option value="">None</option>\n            </select>\n        </div>\n        <div class="btn-group">\n          <label class="control-label">Aggregate:</label>\n          <input class="form-control aggregate-number" ng-disabled="!view.since" ng-model="view.aggregateNumber">\n          <select class="form-control" ng-change="checkAggregate()" ng-disabled="!view.since" ng-options="unit.value as unit.label for unit in view.aggregateUnits" ng-model="view.aggregateUnit">\n            <option value="">None</option>\n          </select>\n        </div>\n        <div class="btn-group">\n          <button class="btn btn-primary" ng-click="getData()">Update</button>\n        </div>\n      </div>\n    </div>\n  </div>\n  <div class="loading" ng-show="view.loading"><span class="loading-spin"></span></div>\n  <div class="chart-container"></div>\n</div>\n'),e.put("routes/home/home.tpl.html",'<div class="jumbotron">\n    <h1>SmartThings HTM Bridge</h1>\n\n    <p>This is a <a href="https://github.com/rhyolight/smartthings.htm.bridge">work in progress</a>.</p>\n\n    <p>SmartApps can <code>POST</code> data to this URL to relay it into HTM.</p>\n\n    <p><a class="btn btn-primary btn-lg" ui-sref="sensors.list" role="button">See Charts</a></p>\n\n</div>\n\n<p>This web server relays SmartThings data from a SmartApp into an <a href="https://github.com/nupic-community/htm-over-http">HTM HTTP server</a>.</p>\n\n<!--<div class="model-list">-->\n  <!--<h3>The following models are active in HTM:</h3>-->\n  <!--<div class="loading" ng-show="view.loading"><span class="loading-spin"></span></div>-->\n  <!--<ul>-->\n      <!--<li ng-repeat="model in view.models">{{model}}</li>-->\n  <!--</ul>-->\n<!--</div>-->\n'),e.put("routes/pageNotFound/pageNotFound.tpl.html",'<div class="page-not-found container-fluid">\n  <div class="jumbotron">\n  <h3>We are sorry, but could not find the page you are looking for.</h3>\n  </div>\n</div>\n'),e.put("routes/sensors/sensor.tpl.html",'<div class="panel panel-info">\n  <div class="panel-heading">\n    <h3 class="panel-title">\n      {{view.sensor}}\n    </h3>\n  </div>\n  <stb-chart sensor-name="{{view.sensor}}"></stb-chart>\n</div>\n'),e.put("routes/sensors/sensor.type.tpl.html","<div ui-view></div>\n"),e.put("routes/sensors/sensors.list.tpl.html",'<div class="panel panel-warning sensors-panel">\n    <div class="panel-heading clearfix">\n      <div class="row dropdowns">\n        <div class="col-md-2">\n          <div class="btn-group">\n            <button class="btn btn-default dropdown-toggle" type="button" id="dropdownMenu1" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">\n              Jump to a chart <span class="caret"></span>\n            </button>\n            <ul class="dropdown-menu" aria-labelledby="dropdownMenu1">\n                <li ng-repeat="sensor in sensors"><a ui-sref="sensors.type.sensor(sensorPath(sensor))">{{sensor}}</a></li>\n            </ul>\n          </div>\n        </div>\n        <div class="col-md-10 form-inline limits">\n          <span class="set-limits">Set limits for all charts:</span>\n          <div class="btn-group">\n            <label for="limitOptions">Row limit:</label>\n            <select class="form-control" name="limitOptions" ng-options="limit for limit in view.limitOptions" ng-model="view.limit">\n              <option value="">None</option>\n            </select>\n          </div>\n          <div class="btn-group">\n            <label for="limitOptions">Time limit:</label>\n            <select class="form-control" ng-change="checkAggregate()" name="sinceOptions" ng-options="(value.number + \' \' + value.units) for (name, value) in view.sinceOptions" ng-model="view.since">\n              <option value="">None</option>\n            </select>\n          </div>\n          <div class="btn-group">\n            <label for="limitOptions">Aggregate:</label>\n            <input class="form-control aggregate-number" ng-disabled="!view.since" ng-model="view.aggregate.number">\n            <select class="form-control" ng-change="checkAggregate()" ng-disabled="!view.since" ng-options="unit.value as unit.label for unit in view.aggregateOptions" ng-model="view.aggregate.unit">\n              <option value="">None</option>\n            </select>\n          </div>\n          <div class="btn-group">\n            <button class="btn btn-primary" ng-click="setLimits()">Set Limits</button>\n          </div>\n        </div>\n      </div>\n    </div>\n    <div class="panel-body">\n        <h2 class="panel-title" id="top">About the Charts</h2>\n        <p>\n            Anomaly values are plotted on the secondary Y axis on the right. Door open/close values are either <code>0</code> or <code>1</code>. I don\'t understand the acceleration data yet. Data is coming from a <a href="https://github.com/rhyolight/smartthings-apps/blob/master/http-poster.groovy">SmartThings app</a>. It is being send via HTTP to <a href="https://github.com/numenta/nupic">NuPIC</a> running behind a <a href="https://github.com/nupic-community/hitc">REST API</a>. Sensor values and HTM results are saved to a time-series database called <a href="https://docs.influxdata.com/influxdb/v0.9/concepts/key_concepts/">InfluxDB</a>.\n        </p>\n       <!-- <p>\n            You can also use the URL query parameters to declare how many data points you want to show in the graph(s) below. Just add <code>?limit=X</code> to the URL, or use the dropdown in the panel header above.\n        </p> -->\n    </div>\n</div>\n<div class="panel panel-info" ng-repeat="sensor in sensors">\n  <div class="panel-heading">\n    <h3 class="panel-title">\n        <a ui-sref="sensors.type.sensor(sensorPath(sensor))">{{sensor}}</a>\n    </h3>\n  </div>\n  <stb-chart sensor-name="{{sensor}}"></stb-chart>\n</div>\n'),e.put("routes/sensors/sensors.tpl.html",'<div class="page-header">\n  <h1>Live SmartThings Sensor Values <small>and HTM anomaly scores</small></h1>\n</div>\n\n<breadcrumb></breadcrumb>\n<div ui-view></div>\n')}]);