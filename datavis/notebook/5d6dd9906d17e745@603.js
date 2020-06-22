// https://observablehq.com/d/5d6dd9906d17e745@603
export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], function(md){return(
md`# URLs COVID Visualization`
)});
  main.variable(observer()).define(["md"], function(md){return(
md`### Tree View`
)});
  main.variable(observer()).define(["html"], function(html){return(
html`<div id='treeContainer'></div>`
)});
  main.variable(observer()).define(["md"], function(md){return(
md`### Data Scraping`
)});
  main.variable(observer("datasource")).define("datasource", function(){return(
"https://spreadsheets.google.com/feeds/cells/1GvbG2juMVWjjYSuptmCmyxOzciYFHvBs-5YR3rd3urM/14/public/values?alt=json"
)});
  main.variable(observer("treeModel")).define("treeModel", function(){return(
[{"name": "URLs", "parent": "null", "children": [] }]
)});
  main.variable(observer("auxModel")).define("auxModel", ["d3"], function(d3){return(
d3.map()
)});
  main.variable(observer("scrapModel")).define("scrapModel", ["$","datasource","treeModel","appendNode","auxModel","createTreeChart"], function($,datasource,treeModel,appendNode,auxModel,createTreeChart)
{
  $.get(datasource, function(data) {
    treeModel[0].children = [];
    data = data.feed;
    // Getting categories
    var categories = [];
    var categoryData = data.entry.filter(element => (element["gs$cell"]["col"] == 3 && element["gs$cell"]["row"] != 1));
    for(var i in categoryData){
      var value = categoryData[i]['gs$cell']['$t'];
      if(!categories.includes(value)){
        categories.push(value);
        appendNode('URLs', value, [])
      }
    }
    //console.log(categories);
    
    let rows = parseInt(data['gs$rowCount']['$t']);
    for(var i = 2; i <= rows; i++){
      let rowData = data.entry.filter(element => element['gs$cell']['row'] == i);
      
      let url = rowData[0]['gs$cell']['$t'];
      let utype = rowData[2]['gs$cell']['$t'];
      let occurrences = parseInt(rowData[1]['gs$cell']['$t']);
      if(occurrences > 1){
        auxModel.set(url, {'occurrences': occurrences, 'utype': rowData[3]['gs$cell']['$t']});
        appendNode(utype, url, []);
      }
      //console.log(utype);
    }
    createTreeChart();
  });
  return true;
}
);
  main.variable(observer()).define(["md"], function(md){return(
md`### Aux Functions`
)});
  main.variable(observer("scale")).define("scale", ["d3"], function(d3){return(
d3.scaleLinear().range([1,20]).domain([2,99])
)});
  main.variable(observer("treeContainerWidth")).define("treeContainerWidth", ["$"], function($){return(
Math.floor($($('#treeContainer').parent().get(0)).width())
)});
  main.variable(observer("createTreeChart")).define("createTreeChart", ["treeContainerWidth","treeModel","d3t","updateTree"], function(treeContainerWidth,treeModel,d3t,updateTree){return(
function createTreeChart(){
 
  var height = 1000;
  var root, width = treeContainerWidth;
  var margin = ({top: 20, right: 20, bottom: 20, left: 80});
  var mytreeData = treeModel;

  var tree = d3t.layout.tree().size([height, width]);
  var diagonal = d3t.svg.diagonal().projection(function(d) { return [d.y, d.x]; });

  d3t.select("#treeContainer").html("");
  var svg = d3t.select("#treeContainer").append("svg")
      .attr("width", width + margin.right + margin.left)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  root = mytreeData[0];
  root.x0 = height / 2;
  root.y0 = 0;
    
  updateTree(svg, tree, root, root, diagonal);
}
)});
  main.variable(observer("updateTree")).define("updateTree", ["auxModel","showTooltip","hideTooltip","scale"], function(auxModel,showTooltip,hideTooltip,scale){return(
function updateTree(svg, tree, root, source, diagonal) {
    var i = 0, duration = 1000;
    // Compute the new tree layout.
    var nodes = tree.nodes(root), links = tree.links(nodes);

    // Normalize for fixed-depth.
    nodes.forEach(function(d) { d.y = d.depth * 180; });

    // Update the nodes…
    var node = svg.selectAll("g.node").data(nodes, function(d) { return d.id || (d.id = ++i); });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("g")
	    .attr("class", d => ("node " + d.name.replace(' ', '').toLowerCase().trim()))
	    .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
	    .on("click", function click(d) {
        if (d.children) {
          d._children = d.children;
          d.children = null;
        } else {
          d.children = d._children;
          d._children = null;
        }
        updateTree(svg, tree, root, d, diagonal);
      });

    nodeEnter.append("circle")
	    .attr("r", 1e-6)
	    .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

    nodeEnter.append("text")
	    .attr("x", function(d) { return d.children || d._children ? -13 : 25; })
	    .attr("dy", ".35em")
	    .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
	    .text(function(d) { return d.name; })
	    .style("fill-opacity", 1e-6)
      .on("mouseover", function(d){
        let mModel = auxModel.get(d.name);
        if(mModel !== undefined){
          //console.log(d);
          showTooltip(d.name, mModel.utype, mModel.occurrences, d.x)
        }
      })
      .on("mouseout", function(d){
        hideTooltip();
      })
      .on("click", function click(d) {
        if(auxModel.get(d.name) !== undefined){
          window.open(d.name);
        }
        console.log(d);
      });
      //.call(wrapTreeNode, 150);

    // Transition nodes to their new position.
    var nodeUpdate = node.transition().duration(duration)
	    .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

    nodeUpdate.select("circle")
      .attr("r", function(d){
        let mModel = auxModel.get(d.name);
        if(mModel !== undefined){
          return scale(mModel.occurrences);
        }
        return 10;
      })
      .style("stroke-width", 2)
      .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

    nodeUpdate.select("text").style("fill-opacity", 1);

    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition().duration(duration)
	    .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
	    .remove();

    nodeExit.select("circle").attr("r", 1e-6);
    nodeExit.select("text").style("fill-opacity", 1e-6);

    // Update the links…
    var link = svg.selectAll("path.link").data(links, function(d) { return d.target.id; });

    // Enter any new links at the parent's previous position.
    link.enter().insert("path", "g")
	    .attr("class", "link")
	    .attr("d", function(d) {
		    var o = {x: source.x0, y: source.y0};
		    return diagonal({source: o, target: o});
	    });

    // Transition links to their new position.
    link.transition().duration(duration).attr("d", diagonal);

    // Transition exiting nodes to the parent's new position.
    link.exit().transition().duration(duration)
	    .attr("d", function(d) {
		    var o = {x: source.x, y: source.y};
		    return diagonal({source: o, target: o});
	    })
	  .remove();

    // Stash the old positions for transition.
    nodes.forEach(function(d) {
	    d.x0 = d.x;
	    d.y0 = d.y;
    });
  }
)});
  main.variable(observer("wrapTreeNode")).define("wrapTreeNode", ["d3"], function(d3){return(
function wrapTreeNode(text, twidth) {
    text.each(function() {
      
      var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word, line = [], 
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy"));
      
      while (word = words.pop()) {
        line.push(word);
        if(line.join(" ").length > 20 && line.join(" ") != 'diagnostic order schedule'){
          var tspan = text.text(null).append("tspan").attr("x", -15).attr("y", y).attr("dy", "-0.3em")
          tspan.text(line.join(" "));
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = text.append("tspan")
            .attr("x", -15).attr("y", y)
            .attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
        }
      }
    });
  }
)});
  main.variable(observer("searchTree")).define("searchTree", function(){return(
function searchTree(element, matchingName){
  if(element.name == matchingName){
    return element;
  } else if (element.children != null){
    var result = null;
    for(var i = 0; result == null && i < element.children.length; i++){
      result = searchTree(element.children[i], matchingName)
    }
    return result;
  }
  return null;
}
)});
  main.variable(observer("changeParent")).define("changeParent", ["treeModel","searchTree"], function(treeModel,searchTree){return(
    function changeParent(childNodeName, newParentName){
      let root = treeModel[0];
      let childNode = searchTree(root, childNodeName)
      if(childNode){
        let parent = searchTree(root, childNode.parent)
        let nChildren = []
        parent.children.forEach(function(child, i){
          if(child.name != childNodeName) nChildren.push(child)
        })
        parent.children = nChildren
        childNode.parent = newParentName
        let newParentNode = searchTree(root, newParentName)
        newParentNode.children.push(childNode)
      }
    }
  )});
  main.variable(observer("appendNode")).define("appendNode", ["treeModel","searchTree"], function(treeModel,searchTree){return(
    function appendNode(pNodeName, name, children){
      let root = treeModel[0];
      let fNode = searchTree(root, pNodeName)
      if(fNode){
        fNode.children.push({"name": name, "parent": fNode.name, "children": children})
      }
    }
  )});
  main.variable(observer("removeNode")).define("removeNode", ["treeModel","searchTree"], function(treeModel,searchTree){return(
    function removeNode(parentName, nodeName){
      let root = treeModel[0];
      let pNode = searchTree(root, parentName)
      if(pNode){
        let nChildren = []
        pNode.children.forEach(function(child, i){
          if(child.name != nodeName) nChildren.push(child)
        })
        pNode.children = nChildren
      }
    }
  )});
  main.variable(observer("changeName")).define("changeName", ["treeModel","searchTree"], function(treeModel,searchTree){return(
    function changeName(oldName, newName){
      let root = treeModel[0];
      let node = searchTree(root, oldName)
      if(node){
        node.name = newName
      }
    }
  )});
  main.variable(observer("tooltip")).define("tooltip", ["d3"], function(d3){
    d3.select("#tooltip").remove()
    let node = d3.select("body")
                  .append("div")
                    .attr("id", "tooltip")
                    .attr("class", "hidden")
    
    node.append("p").html("<strong id='url'></strong><br/>")
    node.append("p").html("URL type: <span id='uType'></span>")
    node.append("p").html("Ocurrences: <span id='ocurrences'></span>")
    return node
  });
  main.variable(observer("hideTooltip")).define("hideTooltip", ["d3"], function(d3){return(
    function hideTooltip(){
      d3.select("#tooltip").classed("hidden", true)
    }
  )});
  main.variable(observer("showTooltip")).define("showTooltip", ["d3"], function(d3){return(
    function showTooltip(url, utype, ocurrences, y){
      console.log('oi');
      let node = d3.select("#tooltip").style("right", "15%").style("top", (y + 110 + document.getElementById("urlsLabelID").offsetTop) + "px")
      
      node.select("#url").text(url)
      node.select("#uType").text(utype)
      node.select("#ocurrences").text(ocurrences)
      
      d3.select("#tooltip").classed("hidden", false)
    }
  )});
  main.variable(observer()).define(["md"], function(md){return(md`### Imports`)});
  main.variable(observer("stylesheet")).define("stylesheet", ["html"], function(html){return(
  html`
  <style>
    .node {
      cursor: pointer;
    }

    .node circle {
      fill: #fff;
      stroke: steelblue;
      stroke-width: 3px;
    }

    .node text {
      font: 12px sans-serif;
    }

    .link {
      fill: none;
      stroke: #ccc;
      stroke-width: 2px;
    }

    #tooltip {
      position: absolute;
      width: 250px;
      height: auto;
      padding: 10px;
      background-color: white;
      -webkit-border-radius: 10px;
      -moz-border-radius: 10px;
      border-radius: 10px;
      -webkit-box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.4);
      -moz-box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.4);
      box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.4);
      pointer-events: none;
    }
    
    #tooltip.hidden {
      display: none;
    }
    
    #tooltip p {
      margin: 0;
      font-family: sans-serif;
      font-size: 12px;
      line-height: 15px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
  </style>
  `
  )});
  main.variable(observer("d3")).define("d3", ["require"], function(require){return(
    require("d3")
  )});
  main.variable(observer("d3t")).define("d3t", ["require"], function(require){return(
    require("d3@3")
  )});
  main.variable(observer("$")).define("$", ["require"], function(require){return(
    require('jquery').then(jquery => {
      window.jquery = jquery;
      return require('popper@1.0.1/index.js').catch(() => jquery);
    })
  )});
  return main;
}
