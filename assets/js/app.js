var sql = new cartodb.SQL({user: "fulcrum"});

$(document).ready(function() {
  zoomToLiberia();
  $("#introModal").modal("show");
});

// Hack to stop vimeo video when modal is closed
var vidUrl = $("iframe#intro-video").attr("src");
$("#introModal").on("hidden.bs.modal", function (e) {
  $("iframe#intro-video").attr("src","");
});

$("#introModal").on("show.bs.modal", function (e) {
  $("iframe#intro-video").attr("src", vidUrl);
});

$("[#clear-graphics").click(function() {
  $(".cartodb-infowindow").hide();
  highlight.setQuery("SELECT * FROM liberia_counties LIMIT 0");
  highlight.hide();
  return false;
});

$("[name='country']").click(function() {
  $(".in,.open").removeClass("in open");
  if (this.id === "liberia") {
    zoomToLiberia();
    $("#county-mortality").show();
    $("[name='location']").html("Liberia");
    return false;
  }
});

$("[name='view']").click(function() {
  $(".in,.open").removeClass("in open");
  if (this.id === "map-graph") {
    $("#view").html("Map & Graphs");
    $("#chart-container").show();
    $("#chart-container").removeClass("col-md-12").addClass("col-md-5");
    $("#chart-container").css("padding", "10px 25px 10px 5px");
    $("#map-container").show();
    $("#map-container").removeClass("col-md-12").addClass("col-md-7");
    $("#map-container").css("padding", "10px 5px 10px 25px");
    if (document.body.clientWidth <= 992) {
      $("#map-container").css("height", "50%");
      $("#map-container").css("padding", "10px 25px");
      $("#chart-container").css("padding", "10px 25px");
    }
    $(window).resize();
    map.invalidateSize();
    return false;
  } else if (this.id === "map-only") {
    $("#view").html("Map Only");
    $("#map-container").show();
    $("#chart-container").hide();
    $("#map-container").removeClass("col-md-7").addClass("col-md-12");
    $("#map-container").css("padding", "10px 25px");
    if (document.body.clientWidth <= 992) {
      $("#map-container").css("height", "100%");
    }
    map.invalidateSize();
    return false;
  } else if (this.id === "graph-only") {
    $("#view").html("Graphs Only");
    $("#chart-container").show();
    $("#map-container").hide();
    $("#chart-container").removeClass("col-md-5").addClass("col-md-12");
    $("#chart-container").css("padding", "10px 25px");
    $(window).resize();
    return false;
  }
});

// Basemap Layers
var mapquestOSM = L.tileLayer("http://{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png", {
  maxZoom: 19,
  subdomains: ["otile1", "otile2", "otile3", "otile4"],
  attribution: 'Tiles courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">. Map data (c) <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> contributors, CC-BY-SA.'
});

var mapquestOAM = L.tileLayer("http://{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg", {
  maxZoom: 18,
  subdomains: ["oatile1", "oatile2", "oatile3", "oatile4"],
  attribution: 'Tiles courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a>. Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency'
});

var mapquestHYB = L.layerGroup([L.tileLayer("http://{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg", {
  maxZoom: 18,
  subdomains: ["oatile1", "oatile2", "oatile3", "oatile4"]
}), L.tileLayer("http://{s}.mqcdn.com/tiles/1.0.0/hyb/{z}/{x}/{y}.png", {
  maxZoom: 19,
  subdomains: ["oatile1", "oatile2", "oatile3", "oatile4"],
  attribution: 'Labels courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">. Map data (c) <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> contributors, CC-BY-SA. Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency'
})]);

var map = L.map("map", {
  layers: [mapquestOSM]
}).fitWorld();
map.attributionControl.setPrefix("Powered by <a href='http://fulcrumapp.com/'>Fulcrum</a>");

function zoomToLiberia() {
  sql.getBounds("SELECT * FROM liberia_country").done(function(bounds) {
    map.fitBounds(bounds);
  });
}

// Larger screens get expanded layer control and visible sidebar
if (document.body.clientWidth <= 767) {
  var isCollapsed = true;
} else {
  var isCollapsed = false;
}

var baseLayers = {
  "Street Map": mapquestOSM,
  "Aerial Imagery": mapquestHYB
};

var groupedOverlays = {
};

var layerControl = L.control.groupedLayers(baseLayers, groupedOverlays, {
  collapsed: isCollapsed
}).addTo(map);

map.on("overlayadd", function(e) {
  recent.setZIndex(10);
  if (e.layer === progression) {
    $(".cartodb-timeslider").show();
    progression.play();
  }
});

map.on("overlayremove", function(e) {
  $(".cartodb-infowindow").hide();
  if (e.layer === progression) {
    progression.pause();
    $(".cartodb-timeslider").hide();
  }
  if (e.layer === counties) {
    highlight.hide();
  }
});

function drawHighlight(id){
  highlight.setQuery("SELECT * FROM liberia_counties WHERE cartodb_id = " + id);
  highlight.show();
}

cartodb.createLayer(map, {
  user_name: "fulcrum",
  type: "cartodb",
  cartodb_logo: false,
  sublayers: [{
    sql: "SELECT * FROM liberia_counties LIMIT 0",
    interactivity: "cartodb_id, the_geom, name_1",
    cartocss: "#liberia_counties {" +
        "polygon-fill: #00FFFF;" +
        "polygon-opacity: 0;" +
        "line-color: #00FFFF;" +
        "line-width: 4;" +
        "line-opacity: 1;" +
      "}"
  }]
}).on("done", function (layer) {
  highlight = layer;
  highlight.addTo(map).setZIndex(25).hide();
});

// Mortality Progression
cartodb.createLayer(map, "http://fulcrum.cartodb.com/api/v2/viz/ae5843cc-4d92-11e4-984f-0e018d66dc29/viz.json", {
  legends: false,
  cartodb_logo: false
})
.on("done", function(layer) {
  progression = layer;
  progression.stop();
  $(".slider-wrapper").css("width", "100%");
  $(".cartodb-timeslider").hide();
  progression.setZIndex(10);
});

// Recent Deaths
cartodb.createLayer(map, "http://fulcrum.cartodb.com/api/v2/viz/ace03b06-4dcb-11e4-b1df-0e4fddd5de28/viz.json", {
  legends: false,
  cartodb_logo: false
})
.on("done", function(layer) {
  recent = layer;
  map.addLayer(recent);
  layerControl.addOverlay(recent, "Recent Deaths<br><img src='assets/img/recent_legend.png' width='175px;'>", "Ebola Mortality");
});

// All Deaths By Category
cartodb.createLayer(map, "http://fulcrum.cartodb.com/api/v2/viz/4a6f40d6-53b4-11e4-8df5-0e4fddd5de28/viz.json", {
  legends: false,
  cartodb_logo: false
})
.on("done", function(layer) {
  category = layer;
  layerControl.addOverlay(category, "Deaths By Category<br><img src='assets/img/categories_legend.png' max-width='175px;'>", "Ebola Mortality");
});

// Mortality By County
cartodb.createLayer(map, "http://fulcrum.cartodb.com/api/v2/viz/04d5019e-48e9-11e4-94d4-0e9d821ea90d/viz.json", {
  legends: false,
  cartodb_logo: false
})
.on("done", function(layer) {
  counties = layer;
  counties.setInteractivity("cartodb_id, county");
  layerControl.addOverlay(counties, "Deaths By County<br><img src='assets/img/counties_legend.png' width='175px;'>", "Ebola Mortality");
  layerControl.addOverlay(progression, "Mortality Progression", "Ebola Mortality");
  counties.on("featureClick", function (e, pos, latlng, data) {
    //console.log(data);
    drawHighlight(data.cartodb_id);
  });
});

// Total Deaths By County
var countyMortality = [];
$.getJSON("https://fulcrum.cartodb.com/api/v2/sql?q=SELECT liberia_counties.name_1 AS county, count(static_ebola_deaths.the_geom) AS deaths FROM liberia_counties LEFT JOIN static_ebola_deaths ON st_contains(liberia_counties.the_geom,static_ebola_deaths.the_geom) GROUP BY liberia_counties.cartodb_id ORDER BY liberia_counties.name_1 ASC", function (data) {
  $.each(data.rows, function(index, value) {
    countyMortality.push([value.county, value.deaths]);
  });
});

function zoomToCounty(name) {
  sql.getBounds("SELECT * FROM liberia_counties WHERE name_1 ='"+name+"'").done(function(bounds) {
    map.fitBounds(bounds);
  });
  highlight.setQuery("SELECT * FROM liberia_counties WHERE name_1 ='"+name+"'");
  highlight.show();
}

function drawCountyChart() {
  $("#county-mortality-chart").highcharts({
    chart: {
      type: "bar"
    },
    credits: {
      enabled: false
    },
    title: {
      text: ""
    },
    subtitle: {
      text: "Source: <a href='http://fulcrumapp.com'>Liberian authorities</a>"
    },
    xAxis: {
      type: "category",
      labels: {
        style: {
          fontSize: "13px",
          fontFamily: "Verdana, sans-serif"
        }
      }
    },
    yAxis: {
      min: 0,
      title: {
        text: "Deaths"
      }
    },
    legend: {
      enabled: false
    },
    tooltip: {
      //pointFormat: '{point.y} Deaths'
      formatter:function(){
        return this.y + " Deaths";
      }
    },
    series: [{
      name: "Mortality",
      data: countyMortality
    }],
    plotOptions: {
      series: {
        cursor: "pointer",
        point: {
          events: {
            click: function () {
              zoomToCounty(this.name);
            }
          }
        }
      }
    }
  });
}

// Total Cumulative Deaths
var cumulativeMortality = [];
$.getJSON("https://fulcrum.cartodb.com/api/v2/sql?q=SELECT to_char(date(date),'YYYY-MM') AS year_month, SUM(COUNT(*)) OVER (ORDER BY to_char(date(date),'YYYY-MM')) AS deaths FROM static_ebola_deaths GROUP BY to_char(date(date),'YYYY-MM')", function (data) {
  $.each(data.rows, function(index, value) {
    cumulativeMortality.push([value.year_month, value.deaths]);
  });
});

function drawCumulativeChart() {
  $("#cumulative-mortality-chart").highcharts({
    chart: {
      type: "line"
    },
    credits: {
      enabled: false
    },
    title: {
      text: ""
    },
    subtitle: {
      text: "Source: <a href='http://fulcrumapp.com'>Liberian authorities</a>"
    },
    xAxis: {
      type: "category",
      labels: {
        rotation: -45,
        style: {
          fontSize: "13px",
          fontFamily: "Verdana, sans-serif"
        }
      }
    },
    yAxis: {
      min: 0,
      title: {
        text: "Deaths"
      }
    },
    legend: {
      enabled: false
    },
    tooltip: {
      formatter:function(){
        return this.y + " Deaths";
      }
    },
    series: [{
      name: "Mortality",
      data: cumulativeMortality
    }]
  });
}

// Total Deaths By Category
var months = [];
var distinctMonths = "https://fulcrum.cartodb.com/api/v2/sql?q=SELECT DISTINCT(to_char(date(date),'YYYY-MM')) as year_month FROM static_ebola_deaths ORDER BY year_month ASC";
$.getJSON(distinctMonths, function (data) {
  $.each(data.rows, function(index, value) {
    months.push(value.year_month);
  });
});

var publicDeaths = [];
$.getJSON("https://fulcrum.cartodb.com/api/v2/sql?q=SELECT to_char(date(date),'YYYY-MM') as year_month, SUM(COUNT(*)) OVER (ORDER BY to_char(date(date),'YYYY-MM')) AS deaths, category FROM static_ebola_deaths WHERE category = 'General Public' GROUP BY year_month, category ORDER BY year_month ASC", function (data) {
  $.each(data.rows, function(index, value) {
    publicDeaths.push(value.deaths);
  });
});

var workerDeaths = [];
$.getJSON("https://fulcrum.cartodb.com/api/v2/sql?q=SELECT to_char(date(date),'YYYY-MM') as year_month, SUM(COUNT(*)) OVER (ORDER BY to_char(date(date),'YYYY-MM')) AS deaths, category FROM static_ebola_deaths WHERE category = 'Healthcare Worker' GROUP BY year_month, category ORDER BY year_month ASC", function (data) {
  $.each(data.rows, function(index, value) {
    workerDeaths.push(value.deaths);
  });
});

function drawCategoryChart() {
  $("#category-mortality-chart").highcharts({
    credits: {
      enabled: false
    },
    title: {
      text: ""
    },
    subtitle: {
      text: "Source: <a href='http://fulcrumapp.com'>Liberian authorities</a>"
    },
    xAxis: {
      categories: months,
      labels: {
        rotation: -45,
        style: {
          fontSize: "13px",
          fontFamily: "Verdana, sans-serif"
        }
      }
    },
    yAxis: {
      title: {
        text: "Deaths"
      }
    },
    tooltip: {
      formatter:function(){
        return "<b>" + this.key + "</b><br>" + this.y + " " + this.series.name + " Deaths";
      }
    },
    series: [{
      name: "General Public",
      data: publicDeaths
    }, {
      name: "Healthcare Worker",
      data: workerDeaths
    }]
  });
}

$(document).one("ajaxStop", function () {
  drawCountyChart();
  drawCumulativeChart();
  drawCategoryChart();
});
