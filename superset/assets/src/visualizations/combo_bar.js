import d3 from 'd3';
import nv from 'nvd3';
import { getColorFromScheme } from '../modules/colors';

require('./combo_bar.css');

function combo_bar(slice, payload) {
  console.log("data", JSON.stringify(payload.data));
  const data = payload.data.records;
  const div = d3.select(slice.selector);
  //const numBins = Number(slice.formData.link_length) || 10;
  const normalized = slice.formData.normalized;
  const xAxisLabel = slice.formData.x_axis_label;
  const yAxisLabel = slice.formData.y_axis_label;
  const opacity = slice.formData.global_opacity;

  const draw = function () {
    // Set Margins
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const navBarHeight = 36;
    const navBarBuffer = 10;
    const width = slice.width() - margin.left - margin.right;
    const height = slice.height() - margin.top - margin.bottom - navBarHeight - navBarBuffer;


    var x0 = d3.scale.ordinal()
      .rangeRoundBands([0, width], 0.1);

    var x1 = d3.scale.ordinal();

    var y = d3.scale.linear()
      .range([height, 0]);

    var xAxis = d3.svg.axis()
      .scale(x0)
      .orient("bottom");

    var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .tickFormat(d3.format(".2s"));

    var color = d3.scale.ordinal()
      .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

    const container = d3.select(slice.selector);
    var svg = container.append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var yBegin;
    var innerColumns = {
      "column1": payload.data.col1, //["SUM(PC-0-30)", "SUM(PC-30-60)"],
      "column2": payload.data.col2  //["SUM(CC-0-30)", "SUM(CC-30-60)"]
    }

    //var data = [{ 'District': 'Sindhuli', 'CC-30': '1', 'PC-30': '2', 'CC(30-60)': '3', 'PC(30-60)': '4' }, { 'District': 'Kanchanpur', 'CC-30': '4', 'PC-30': '3', 'CC(30-60)': '2', 'PC(30-60)': '2' },];

    var columnHeaders = d3.keys(data[0]).filter(function (key) { return key !== "District"; });
    color.domain(d3.keys(data[0]).filter(function (key) { return key !== "District"; }));
    data.forEach(function (d) {
      var yColumn = new Array();
      d.columnDetails = columnHeaders.map(function (name) {
        for (var ic in innerColumns) {
          if (innerColumns[ic].indexOf(name) >= 0) {
            if (!yColumn[ic]) {
              yColumn[ic] = 0;
            }
            yBegin = yColumn[ic];
            yColumn[ic] += +d[name];
            return { name: name, column: ic, yBegin: yBegin, yEnd: +d[name] + yBegin, };
          }
        }
      });
      d.total = d3.max(d.columnDetails, function (d) {
        return d.yEnd;
      });
    });

    x0.domain(data.map(function(d) { return d.District; }));
    x1.domain(d3.keys(innerColumns)).rangeRoundBands([0, x0.rangeBand()]);
   
    y.domain([0, d3.max(data, function(d) { 
      return d.total; 
    })]);
   


    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".7em")
      .style("text-anchor", "end")
      .text("");

    var project_stackedbar = svg.selectAll(".project_stackedbar")
      .data(data)
      .enter().append("g")
      .attr("class", "g")
      .attr("transform", function (d) { return "translate(" + x0(d.District) + ",0)"; });

    project_stackedbar.selectAll("rect")
      .data(function (d) { return d.columnDetails; })
      .enter().append("rect")
      .attr("width", x1.rangeBand())
      .attr("x", function (d) {
        return x1(d.column);
      })
      .attr("y", function (d) {
        return y(d.yEnd);
      })
      .attr("height", function (d) {
        return y(d.yBegin) - y(d.yEnd);
      })
      .style("fill", function (d) { return color(d.name); });

    var legend = svg.selectAll(".legend")
      .data(columnHeaders.slice().reverse())
      .enter().append("g")
      .attr("class", "legend")
      .attr("transform", function (d, i) { return "translate(0," + i * 20 + ")"; });

    legend.append("rect")
      .attr("x", width - 18)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", color);

    legend.append("text")
      .attr("x", width - 24)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .text(function (d) { return d; });
  };

  div.selectAll('*').remove();
  draw();
}

module.exports = combo_bar;
