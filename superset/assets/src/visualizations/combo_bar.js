import d3 from 'd3';
import { getColorFromScheme } from '../modules/colors';
import { customizeToolTip, d3TimeFormatPreset, d3FormatPreset, tryNumify } from '../modules/utils';

require('./combo_bar.css');

function combo_bar(slice, payload) {
  //console.log("slice", slice);
  //console.log("payload", payload);
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
      .tickFormat(d3FormatPreset(slice.formData.y_axis_format));

    const container = d3.select(slice.selector);
    var svg = container.append("svg")
      .attr("id", "svgComboBar")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom + 30)
      .append("g")
      .attr("transform", "translate(" + (margin.left + (yAxisLabel ? 20 : 0)) + "," + margin.top + ")");

    var yBegin;
    var innerColumns = {
      "column1": slice.formData.column_1.map((c) => { return c.label }),//payload.data.col1, //["SUM(PC-0-30)", "SUM(PC-30-60)"],
      "column2": slice.formData.column_2.map((c) => { return c.label })  //["SUM(CC-0-30)", "SUM(CC-30-60)"]
    }

    var groupby = slice.formData.groupby[0];
    var tooltip = container.append("div").attr("class", "toolTip");
    if (slice.formData.order_bars) {
      data.forEach((d) => {
        d.values.sort((a, b) => tryNumify(a.x) < tryNumify(b.x) ? -1 : 1);
      });
    }
    //var allCols = payload.data.col1.concat(payload.data.col2);

    //var data = [{ 'District': 'Sindhuli', 'CC-30': '1', 'PC-30': '2', 'CC(30-60)': '3', 'PC(30-60)': '4' }, { 'District': 'Kanchanpur', 'CC-30': '4', 'PC-30': '3', 'CC(30-60)': '2', 'PC(30-60)': '2' },];

    var columnHeaders = innerColumns.column1.concat(innerColumns.column2);//d3.keys(data[0]).filter(function (key) { return key !== "District"; });
    //color.domain(d3.keys(data[0]).filter(function (key) { return key !== "District"; }));
    //console.log('data', data);
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
            //console.log('2. yEnd', +d[name] + yBegin);
            return { name: name, column: ic, yBegin: yBegin, yEnd: +d[name] + yBegin, };
          }
        }
      });
      d.total = d3.max(d.columnDetails, function (d) {
        if (typeof d === 'undefined') {
          //console.log("d is undefined");
        }
        else {
          //console.log('d.yEnd', d.yEnd);
          return d.yEnd;
        }
      });
    });

    x0.domain(data.map(function (d) { return d[groupby]; }));
    x1.domain(d3.keys(innerColumns)).rangeRoundBands([0, x0.rangeBand()]);

    y.domain([0, d3.max(data, function (d) {
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
    //console.log('data', data);
    var project_stackedbar = svg.selectAll()
      .data(data)
      .enter().append("g")
      .attr("class", "g")
      .attr("transform", function (d) { return "translate(" + x0(d[groupby]) + ",0)"; });

    project_stackedbar.selectAll("rect")
      .data(function (d) { d.columnDetails.forEach(function (el) { el.group = d[groupby] }); return d.columnDetails; })
      .enter().append("rect")
      .attr("width", x1.rangeBand())
      .attr("x", function (d) {
        if (typeof d === 'undefined') {
          //console.log('d2 is undefined');
        }
        else {
          return x1(d.column);
        }
      })
      .attr("y", function (d) {
        if (typeof d === 'undefined') {
          //console.log('d3 is undefined');
        }
        else {
          return y(d.yEnd);
        }
      })
      .attr("height", function (d) {
        if (typeof d === 'undefined') {
          //console.log('d4 is undefined');
        }
        else {
          return y(d.yBegin) - y(d.yEnd);
        }
      })
      .style("fill", function (d) {
        if (typeof d === 'undefined') {
          //console.log('d5 is undefined');
        }
        else {
          //console.log('bar', d, d.name, getColorFromScheme(d.name, slice.formData.color_scheme));
          return getColorFromScheme(d.name, slice.formData.color_scheme);
        }
      })
      .on("mousemove", function (d) {
        tooltip
          .style("left", (d3.event.pageX - document.getElementById('svgComboBar').getBoundingClientRect().x + margin.left) + "px")
          .style("top", (d3.event.pageY - document.getElementById('svgComboBar').getBoundingClientRect().y) - margin.top + "px")
          .style("display", "inline-block")
          .html("<span class='label'>" + d.group + "<br>" + d.name + ":</span><br><span class='value'>" + (d.yEnd - d.yBegin) + "</span>");
      })
      .on("mouseout", function (d) {
        tooltip.style("display", "none");
      })

    //Bar Values
    if (slice.formData.show_bar_value) {
      project_stackedbar.selectAll()
        .data(function (d) { return d.columnDetails; })
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", function (d) {
          return x1(d.column) + x0.rangeBand() / 4;
        })
        .attr("y", function (d) {
          return y(d.yEnd) + 1;
        })
        .attr("dy", ".75em")
        .text(function (d) {
          return d.yEnd - d.yBegin;
        });
    }

    const legend_x = 0;//slice.formData.legend_pos_x;
    const legend_y = 0;//slice.formData.legend_pos_y;

    //Top Right - Inner
     var legendX = width - 24 + legend_x;
     var legendY = 9 + legend_y;


    var legendContainer = svg.append("g")
      .attr("class", "legendContainer")
      //.attr("x", width - 24)
      //.attr("y", 9)
      .attr("transform", "translate(" + legendX + ", " + legendY + ")");

    var legend = legendContainer.selectAll(".legend")
      .data(columnHeaders.slice().reverse())
      .enter().append("g")
      .attr("class", "legend")
      .attr("transform", function (d, i) { return "translate(0," + i * 20 + ")"; });

    legend.append("rect")
      .attr("x", 6)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", function (d) {
        if (typeof d === 'undefined') {
          //console.log('d5 is undefined');
        }
        else {
          //console.log('legend', d, getColorFromScheme(d, slice.formData.color_scheme));
          return getColorFromScheme(d, slice.formData.color_scheme);
        }
      });

    legend.append("text")
      .attr("x", 0)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .text(function (d) { return d; });

    // add axis labels if passed
    if (xAxisLabel) {
      svg.append('text')
        .attr('transform',
          'translate(' + ((width + margin.left) / 2) + ' ,' +
          (height + margin.top + 40) + ')')
        .style('text-anchor', 'middle')
        .text(xAxisLabel);
    }
    if (yAxisLabel) {
      svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', '-4em')
        .attr('x', 0 - (height / 2))
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
        .text(yAxisLabel);
    }
  };
  div.selectAll('*').remove();
  draw();
};

module.exports = combo_bar;
