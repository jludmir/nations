/////////////////////////////////////
// Step 1: Write accessor functions //
//////////////////////////////////////

// Accessor functions for the four dimensions of our data
// For each of these, assume that d looks like the following:
// {"name": string, "income": number, "lifeExpectancy": number,
//  "population": number, "region": string}
const x = d => {
    // Return nation's income
    return d.income;
}

const y = d => {
    // Return nation's lifeExpectancy
    return d.lifeExpectancy;
}

const radius = d => {
    // Return nation's population
    return d.population;
}

const color = d => {
    // Return nation's region
    return d.region;
}

const key = d => {
    // Return nation's name
    return d.name;
}

// TODO: set the colors of the circles (pick any seven)
const colorArray = ["red","blue","green","brown","teal","purple","pink"];

//////////////
// Provided //
//////////////

// Chart dimensions
const margin = {top: 19.5, right: 19.5, bottom: 19.5, left: 39.5};
const width = 960 - margin.right;
const height = 500 - margin.top - margin.bottom;

// Various scales
const xScale = d3.scaleLog().domain([300, 1e5]).range([0, width]),
    yScale = d3.scaleLinear().domain([10, 85]).range([height, 0]),
    radiusScale = d3.scaleSqrt().domain([0, 5e8]).range([0, 40]),
    colorScale = d3.scaleOrdinal([0, 1, 2, 3, 4, 5, 6]);

// The x & y axes
const xAxis = d3.axisBottom(xScale).ticks(12, d3.format(",d")),
    yAxis = d3.axisLeft(yScale);

// Create the SVG container and set the origin
const svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//////////////////////////////
// Step 2: Add x and y axes //
//////////////////////////////

// e.g. svg.append("g").attr(...).attr(...)... etc.
// you want to do this for both x and y axis!
svg.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(0," + (height) + ")")
    .call(xAxis);

svg.append("g")
    .attr("class", "axis")
    .call(yAxis);

//////////////////////////////////////
// Step 3: Add axis and year labels //
//////////////////////////////////////

// replace dictionaries with svg.append(...)
// so that you add these labels to your svg!
const xlabel = svg.append("text").attr("class","label").attr('x',width-220).attr('y',height-6).attr('fill', 'grey').attr("opacity",0.9).text("income per capita, inflation-adjusted (dollars)");
const ylabel = svg.append("text").attr("class","label").attr("transform", "rotate(-90)").attr("x", -110).attr("y", 16).attr('fill', 'grey').attr("opacity",0.9).text("life expectancy (years)");
const yearlabel = svg.append("text").attr("class", "year label").attr("text-anchor", "end").attr("x", width-30).attr("y", height-30).text(1800);
// // Load the data.
//d3.json("../data/nations.json").then(nations => {
d3.json("nations.json").then(nations => {

  /////////////////////////////////////////
  // Functions provided for your utility //
  /////////////////////////////////////////

  // A bisector since many nation's data is sparsely-defined.
  // We provide this to make it easier to linearly interpolate between years.
  const bisect = d3.bisector(d => { return d[0]; });

  // Interpolates the dataset for the given (fractional) year.
  const interpolateData = year => {
    return nations.map(d => {
      return {
        name: d.name,
        region: d.region,
        income: interpolateValues(d.income, year),
        population: interpolateValues(d.population, year),
        lifeExpectancy: interpolateValues(d.lifeExpectancy, year)
      };
    });
  }

  const interpolateValues = (values, year) => {
    const i = bisect.left(values, year, 0, values.length - 1),
        a = values[i];
    if (i > 0) {
      const b = values[i - 1],
          t = (year - a[0]) / (b[0] - a[0]);
      return a[1] * (1 - t) + b[1] * t;
    }
    return a[1];
  }

  // Positions the dots based on data.
  const position = dot => {
    dot .attr("cx", d => { return xScale(x(d)); })
        .attr("cy", d => { return yScale(y(d)); })
        .attr("r", d => { return radiusScale(radius(d)); });
  }

  // Defines a sort order so that the smallest dots are drawn on top.
  const order = (a, b) => {
    return radius(b) - radius(a);
  }


  ///////////////////////////////////////
  // IMPLEMENT THESE 2 FUNCS IN STEP 6 //
  ///////////////////////////////////////

  //After the transition finishes, you can mouseover to change the year.
  const enableInteraction = () => {
    // Create a year scale
    // HINT: Check out d3.scaleLinear
    var years = d3.scaleLinear().domain([box.x,box.x+box.width]).range([1800,2009]); //CHANGE RANGE????
    // Cancel the current transition, if any.
    // HINT: look into the transition function
    svg.transition().duration(0); //piazza

    // For the year overlay, add mouseover, mouseout, and mousemove events
    // that 1) toggle the active class on mouseover and out and 2)
    // change the displayed year on mousemove.

    overlay
        .on("mouseover", mouseover)
        .on("mouseout", mouseout)
        .on("mousemove", mousemove)
        .on("touchmove", mousemove);

    function mouseover() {
      yearlabel.classed("active",true);
    }

    function mouseout() {
      yearlabel.classed("active",false);
    }

    function mousemove() {
      // TODO: get the x position of the mouse and remove data associated with the
      // year currently displayed. Then reset the yearlabel and the dots. (consider
      // using the yearscale you created earlier in createInteraction)

      //Get mouse position/new year
      var mouse_x = d3.mouse(this)[0];
      var new_year = years(mouse_x);
      new_year = Math.round(new_year);

      //Remove dots, set year label
      svg.selectAll(".dot").remove();
      svg.selectAll(".vorpath").remove();

      yearlabel.text(new_year);

      svg.selectAll("path")
        .data(voronoi.polygons(interpolateData(new_year)))
        .enter().append("path")
        .attr("d", function(d, i) { return "M" + d.join("L") + "Z"; })
        .attr("class","vorpath")
        .style("fill", "none")
        .style("stroke", "#2074A0")
        .style("stroke-opacity", 0.5);

      //reset dots
      let dot = svg.append("g").selectAll("dot").data(interpolateData(new_year)).enter();
      dot.append("circle").attr("class", "dot").call(position).sort(order).attr("fill", function(d){return colorArray[colorScale(color(d))];})
      .append("title").text(key);
    }
  }

  // Tweens the entire chart by first tweening the year, and then the data.
  // For the interpolated data, the dots and label are redrawn.
  // TODO: Consider using scaleLinear to scale a year from 1800 to 2009
  // Then, remove and replot all of the years circles
  const tweenYear = () => {
    const year = d3.interpolateNumber(1800, 2009);
    return t => {
        new_year = Math.round(year(t));
        //Remove dots, set year label
        svg.selectAll(".dot").remove();
        svg.selectAll(".vorpath").remove();
        yearlabel.text(new_year);

        svg.selectAll("path")
          .data(voronoi.polygons(interpolateData(new_year)))
          .enter().append("path")
          .attr("d", function(d, i) { return "M" + d.join("L") + "Z"; })
          .attr("class","vorpath")
          .style("fill", "none")
          .style("stroke", "#2074A0")
          .style("stroke-opacity", 0.5);


        //reset dots
        let dot = svg.append("g").selectAll("dot").data(interpolateData(new_year)).enter();
        dot.append("circle").attr("class", "dot").call(position).sort(order).attr("fill", function(d){return colorArray[colorScale(color(d))];})
        .append("title").text(key);
      };
  }

  ////////////////////////////
  // END OF STEP 6 FUNCTIONS//
  ////////////////////////////


  ////////////////////////////
  // Step 4: PLOT SOME DOTS //
  ////////////////////////////

  // Add a dot per nation. Initialize the data at 1800, and set the colors.
  // TODO: Add onto this to initialize the dots. Consider using interpolateData
  let dot = svg.append("g").selectAll("dot").data(interpolateData(1800)).enter();

  // TODO: add each of the dots to the correct location with
  // dot.append(...)
  dot.append("circle").attr("class", "dot").call(position).sort(order).attr("fill", function(d){return colorArray[colorScale(color(d))];})
  // Add a title.
  // TODO: Add onto this with the text
  //altered slightly so only one dot.append used
  .append("title").text(key);

  /////////////////////
  // Step 7: VORONOI //
  /////////////////////

  // add the voronoi overlay
  // TODO: add onto this with x(), y(), extent()
  // see API reference section of https://github.com/d3/d3-voronoi
  const voronoi = d3.voronoi().x(function(d){return xScale(x(d))}).y(function(d){return yScale(y(d))}).extent([[0, 0], [width, height]]);


  svg.selectAll("path")
  	.data(voronoi.polygons(interpolateData(1800)))
  	.enter().append("path")
  	.attr("d", function(d, i) { return "M" + d.join("L") + "Z"; })
    .attr("class","vorpath")
    .style("fill", "none")
    .style("stroke", "#2074A0")
    .style("stroke-opacity", 0.5);

  ///////////////////////////////////
  // Step 5: Add fluff and overlay //
  ///////////////////////////////////

  yearlabel.text("1800");

  // TODO: Add an overlay for the year label.
  // HINT: use node().getBBox()
  const box = yearlabel.node().getBBox();

  // adds the overlay to the yearlabel --> when moused over, calls enable interaction
  // TODO: add more attrs
  const overlay = svg.append("rect").attr("class","overlay").attr("x", box.x).attr("y",box.y)
  .attr('width', box.width).attr('height', box.height).on("mouseover", enableInteraction) ;

  // DO NOT CHANGE BELOW
  // Start a transition that interpolates the data based on year.
  svg.transition()
      .duration(30000)
      .ease(d3.easeLinear)
      .tween("year", tweenYear)
      .on("end", enableInteraction);
});
