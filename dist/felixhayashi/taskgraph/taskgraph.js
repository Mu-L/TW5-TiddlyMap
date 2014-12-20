/*\

title: $:/plugins/felixhayashi/taskgraph/taskgraph.js
type: application/javascript
module-type: widget

@preserve

\*/
(function(){"use strict";var e=require("$:/core/modules/widgets/widget.js").widget;var t=require("$:/plugins/felixhayashi/taskgraph/utils.js").utils;var i=require("$:/plugins/felixhayashi/vis/vis.js");var r=require("$:/plugins/felixhayashi/taskgraph/view_abstraction.js").ViewAbstraction;var o=function(e,i){this.initialise(e,i);this.adapter=$tw.taskgraph.adapter;this.opt=$tw.taskgraph.opt;this.callbacks=t.getEmptyMap();this.computeAttributes();this.addEventListeners([{type:"tm-create-view",handler:function(){this.handleCreateView(null)}},{type:"tm-rename-view",handler:this.handleRenameView},{type:"tm-delete-view",handler:this.handleDeleteView},{type:"tm-store-position",handler:this.handleStorePositions},{type:"tm-edit-node-filter",handler:this.handleEditNodeFilter}])};o.prototype=new e;o.prototype.registerParentDomNode=function(e){this.parentDomNode=e;if(!$tw.utils.hasClass(e,"taskgraph")){$tw.utils.addClass(e,"taskgraph");if(this.getAttribute("click-to-use")!=="false"){$tw.utils.addClass(e,"click-to-use")}if(this.getAttribute("class")){$tw.utils.addClass(e,this.getAttribute("class"))}}};o.prototype.registerCallback=function(e,t,i){this.logger("debug",'A callback was registered for changes of "'+e+'"');this.callbacks[e]={execute:t,isDeleteOnCall:typeof i=="Boolean"?i:true}};o.prototype.removeCallback=function(e){if(this.callbacks[e]){this.logger("debug",'A callback for "'+e+'" will be deleted');delete this.callbacks[e]}};o.prototype.checkForCallbacks=function(e){if(this.callbacks.length==0){this.logger("debug","No registered callbacks exist at the moment");return}for(var t in e){if(!this.callbacks[t])continue;if(this.wiki.getTiddler(t)){this.logger("debug",'A callback for "'+t+'" will be executed');this.callbacks[t].execute(t);if(!this.callbacks.isDeleteOnCall)continue}this.removeCallback(t)}};o.prototype.handleConnectionEvent=function(e,i){this.logger("info","Opening a dialog for creating an edge");var r=this.getView().getAllEdgesFilterExpr(true);var o={edgeFilterExpr:r,fromLabel:this.adapter.selectNodeById(e.from).label,toLabel:this.adapter.selectNodeById(e.to).label};this.openDialog(this.opt.ref.edgeTypeDialog,o,function(r,o){if(r){var s=t.getText(o);e.label=s&&s!==this.opt.misc.unknownEdgeLabel?s:this.opt.misc.unknownEdgeLabel;this.logger("debug","The edgetype is set to: "+e.label);this.adapter.insertEdge(e,this.getView());$tw.taskgraph.notify("edge added")}if(typeof i=="function"){i(r)}})};o.prototype.openDialog=function(e,i,r){e=t.getTiddler(e);var o=this.opt.path.dialogs+"/"+t.genUUID();var s={title:o,output:o+"/output",result:o+"/result",footer:this.wiki.getTiddler(this.opt.ref.dialogStandardFooter).fields.text};if(!i||!i.confirmButtonLabel){s.confirmButtonLabel="Okay"}if(!i||!i.cancelButtonLabel){s.cancelButtonLabel="Cancel"}var a=new $tw.Tiddler(e,i,s);this.logger("debug","A dialog will be opened based on the following tiddler:",a);this.wiki.addTiddler(a);this.registerCallback(s.result,function(e){var i=this.wiki.getTiddler(e);var o=i.fields.text;if(o){var a=this.wiki.getTiddler(s.output)}else{var a=null;$tw.taskgraph.notify("operation cancelled")}if(typeof r=="function"){r.call(this,o,a)}t.deleteTiddlers([s.title,s.output,s.result])}.bind(this),true);this.dispatchEvent({type:"tm-modal",param:a.fields.title,paramObject:a.fields})};o.prototype.openStandardConfirmDialog=function(e,t){var i={message:t,confirmButtonLabel:"Yes mom, I know what I'm doing!",cancelButtonLabel:"Uuups, hell no!"};this.openDialog(this.opt.ref.confirmationDialog,i,e)};o.prototype.logger=function(e,t){var i=Array.prototype.slice.call(arguments,1);i.unshift("@"+this.objectId.toUpperCase());i.unshift(e);$tw.taskgraph.logger.apply(this,i)};o.prototype.render=function(e,i){this.registerParentDomNode(e);this.objectId=this.getAttribute("object-id")?this.getAttribute("object-id"):t.genUUID();this.viewHolderRef=this.getViewHolderRef();this.view=this.getView();this.handleSpecialViews();this.editorMode=this.getAttribute("editor");if(this.editorMode==="advanced"){this.initAndRenderEditorBar(e)}this.initAndRenderGraph(e)};o.prototype.handleSpecialViews=function(){if(this.view.getLabel()==="quick_connect"){var e="$:/temp/felixhayashi/taskgraph/quick_connect_search";var t="[search{"+e+"}!is[system]limit[10]]"+"[field:title["+e+"]]";this.view.setNodeFilter(t)}};o.prototype.initAndRenderEditorBar=function(e){this.graphBarDomNode=document.createElement("div");$tw.utils.addClass(this.graphBarDomNode,"filterbar");e.appendChild(this.graphBarDomNode);this.rebuildChildWidgets();this.renderChildren(this.graphBarDomNode)};o.prototype.rebuildChildWidgets=function(){if(this.editorMode==="vis"){return}this.setVariable("var.viewLabel",this.getView().getLabel());this.setVariable("var.isViewBound",String(this.isViewBound()));this.setVariable("var.ref.view",this.getView().getRoot());this.setVariable("var.ref.viewHolder",this.getViewHolderRef());this.setVariable("var.ref.edgeFilter",this.getView().getPaths().edgeFilter);this.setVariable("var.edgeFilterExpr",this.view.getAllEdgesFilterExpr());var e={type:"tiddler",attributes:{tiddler:{type:"string",value:this.getView().getRoot()}},children:[{type:"transclude",attributes:{tiddler:{type:"string",value:this.opt.ref.graphBar}}}]};this.makeChildWidgets([e])};o.prototype.refresh=function(e){this.checkForCallbacks(e);var t=this.isViewSwitched(e);var i=this.getView().refresh(e);if(t){this.logger("warn","View switched");this.view=this.getView(true);this.rebuildGraph()}else if(i.length){this.logger("warn","View modified");this.rebuildGraph()}else{this.checkForGraphUpdates(e)}if(this.editorMode){this.refreshEditorBar(e,t,i)}};o.prototype.rebuildGraph=function(){this.logger("debug","Rebuilding graph");this.hasNetworkStabilized=false;this.graphData=this.getGraphData(true);this.network.setData(this.graphData,this.preventNextRepaint);this.preventNextRepaint=false};o.prototype.getGraphData=function(e){if(!e&&this.graphData)return this.graphData;var i=this.getView().getNodeFilter("expression");var r=this.adapter.selectNodesByFilter(i,{view:this.getView()});var o=this.adapter.selectEdgesByEndpoints(r,{view:this.getView(),endpointsInSet:">=1"});if(this.view.getLabel()==="quick_connect"){var s=this.adapter.selectNodesByReference([this.getVariable("currentTiddler")],{outputType:"array",addProperties:{x:0,y:0,borderWidth:1,color:{background:"#E6B293",border:"#FF6700"}}});r.update(s)}if(this.getView().isConfEnabled("display_neighbours")){var a=this.adapter.selectNeighbours(r,{edges:o,outputType:"array",view:this.getView(),addProperties:{group:"neighbours"}});t.inject(a,r)}var n={edges:o,nodes:r,nodesByRef:t.getLookupTable(r,"ref")};return n};o.prototype.isViewBound=function(){return t.startsWith(this.getViewHolderRef(),this.opt.path.localHolders)};o.prototype.isViewSwitched=function(e){if(this.isViewBound()){return false}else{return t.hasOwnProp(e,this.getViewHolderRef())}};o.prototype.refreshEditorBar=function(e,t,i){if(t||i.length){this.removeChildDomNodes();this.rebuildChildWidgets();this.renderChildren(this.graphBarDomNode);return true}else{return this.refreshChildren(e)}};o.prototype.checkForGraphUpdates=function(e){var i=this.getView().getNodeFilter("compiled");var r=t.getMatches(i,Object.keys(e));if(r.length){this.logger("info","modified nodes",r);this.rebuildGraph();return}else{for(var o in e){if(this.graphData.nodesByRef[o]){this.logger("info","obsolete node",r);this.rebuildGraph();return}}}var s=this.getView().getEdgeFilter("compiled");var a=t.getMatches(s,Object.keys(e));if(a.length){this.logger("info","changed edge stores",a);this.rebuildGraph();return}};o.prototype.initAndRenderGraph=function(e){this.logger("info","Initializing and rendering the graph");this.graphDomNode=document.createElement("div");$tw.utils.addClass(this.graphDomNode,"vis-graph");e.appendChild(this.graphDomNode);if(this.getAttribute("height")){this.graphDomNode.style["height"]=this.getAttribute("height")}else{window.addEventListener("resize",this.handleResizeEvent.bind(this),false);this.maxEnlarge(this.graphDomNode)}window.addEventListener("click",this.handleClickEvent.bind(this),false);this.graphOptions=this.getGraphOptions();var t={nodes:[],edges:[]};this.network=new i.Network(this.graphDomNode,t,this.graphOptions);if(!this.editorMode){this.registerCallback("$:/state/sidebar",this.repaintGraph.bind(this),false)}this.network.on("doubleClick",this.handleDoubleClickEvent.bind(this));this.network.on("stabilized",this.handleStabilizedEvent.bind(this));this.network.on("dragStart",function(e){if(e.nodeIds.length){this.setNodesMoveable([e.nodeIds[0]],true)}}.bind(this));this.network.on("dragEnd",function(e){if(e.nodeIds.length){var t=this.getView().isConfEnabled("physics_mode");this.setNodesMoveable([e.nodeIds[0]],t);this.handleStorePositions()}}.bind(this));this.rebuildGraph();var r=this.network.getCenterCoordinates();this.network.moveTo({position:r,scale:.8})};o.prototype.handleReconnectEdge=function(e){var t=this.graphData.edges.get(e.id);$tw.utils.extend(t,e);this.adapter.deleteEdgesFromStore([{id:t.id,label:t.label}],this.getView());this.adapter.insertEdge(t,this.getView())};o.prototype.getGraphOptions=function(){var e=this.wiki.getTiddlerData(this.opt.ref.visOptions);e.onDelete=function(e,t){this.handleRemoveElement(e)}.bind(this);e.onConnect=function(e,t){this.handleConnectionEvent(e)}.bind(this);e.onAdd=function(e,t){this.insertNode(e)}.bind(this);e.onEditEdge=function(e,t){this.handleReconnectEdge(e)}.bind(this);e.dataManipulation={enabled:this.editorMode?true:false,initiallyVisible:this.view.getLabel()!=="quick_connect"&&this.view.getLabel()!=="search_visualizer"};e.navigation={enabled:true};e.clickToUse=this.getAttribute("click-to-use")!=="false";return e};o.prototype.handleCreateView=function(){this.openDialog(this.opt.ref.viewNameDialog,null,function(e,i){if(e){var r=this.adapter.createView(t.getText(i));this.setView(r.getRoot())}})};o.prototype.handleRenameView=function(){if(this.getView().getLabel()==="default"){$tw.taskgraph.notify("Thou shalt not rename the default view!");return}this.openDialog(this.opt.ref.viewNameDialog,null,function(e,i){if(e){this.view.rename(t.getText(i));this.setView(this.view.getRoot())}})};o.prototype.handleDeleteView=function(){var e=this.getView().getLabel();if(e==="default"){$tw.taskgraph.notify("Thou shalt not kill the default view!");return}var i="[regexp:text[<\\$taskgraph.*?view=."+e+"..*?>]]";var r=t.getMatches(i);if(r.length){var o={count:r.length.toString(),filter:i};this.openDialog(this.opt.ref.notAllowedToDeleteViewDialog,o,null);return}var s="You are about to delete the view "+"''"+e+"'' (no tiddler currently references this view).";this.openStandardConfirmDialog(function(t){if(t){this.getView().destroy();this.setView(this.opt.path.views+"/default");$tw.taskgraph.notify('view "'+e+'" deleted ')}},s)};o.prototype.handleRemoveElement=function(e){if(e.edges.length&&!e.nodes.length){this.adapter.deleteEdgesFromStore(this.graphData.edges.get(e.edges),this.getView());$tw.taskgraph.notify("edge"+(e.edges.length>1?"s":"")+" removed")}if(e.nodes.length){var t={subtitle:"Please confirm your choice",text:"By deleting a node you are also deleting the "+"corresponding tiddler __and__ any edges connected "+"to that node. Really proceed?"};this.openDialog(null,t,function(t){if(!t)return;var i=this.graphData.nodes.get(e.nodes);var r=this.graphData.edges.get(e.edges);this.adapter.deleteNodesFromStore(i);this.adapter.deleteEdgesFromStore(r,this.getView());$tw.taskgraph.notify("node"+(e.nodes.length>1?"s":"")+" removed")})}};o.prototype.handleStorePositions=function(){this.adapter.storePositions(this.network.getPositions(),this.getView());$tw.taskgraph.notify("positions stored")};o.prototype.handleEditNodeFilter=function(){var e={prettyFilter:this.getView().getPrettyNodeFilterExpr()};this.openDialog(this.opt.ref.editNodeFilter,e,function(e,i){if(e){this.getView().setNodeFilter(t.getText(i))}})};o.prototype.handleStabilizedEvent=function(e){if(this.hasNetworkStabilized){return}else{this.hasNetworkStabilized=true}this.logger("log","Network stabilized after "+e.iterations+" iterations");this.network.storePositions();this.setNodesMoveable(this.graphData.nodes.getIds(),this.getView().isConfEnabled("physics_mode"))};o.prototype.setNodesMoveable=function(e,t){var i=[];for(var r=0;r<e.length;r++){i.push({id:e[r],allowedToMoveX:t,allowedToMoveY:t})}this.graphData.nodes.update(i)};o.prototype.insertNode=function(e){this.preventNextRepaint=true;this.adapter.insertNode(e,{view:this.getView(),editNodeOnCreate:false})};o.prototype.handleDoubleClickEvent=function(e){if(!e.nodes.length&&!e.edges.length){if(!this.editorMode)return;this.openDialog(this.opt.ref.nodeNameDialog,null,function(i,r){if(i){var o=e.pointer.canvas;o.label=t.getText(r);this.insertNode(o)}})}else{if(e.nodes.length){this.logger("debug","Doubleclicked on a node");var i=e.nodes[0];var r=this.graphData.nodes.get(i).ref}else if(e.edges.length){this.logger("debug","Doubleclicked on an Edge");var o=this.graphData.edges.get(e.edges[0]);var s=o.label?o.label:this.opt.misc.unknownEdgeLabel;var r=this.getView().getEdgeStoreLocation()+"/"+s}this.dispatchEvent({type:"tm-navigate",navigateTo:r})}};o.prototype.handleResizeEvent=function(e){if(!document.body.contains(this.parentDomNode)){window.removeEventListener("resize",this.handleResizeEvent);return}if(!this.network){return}this.maxEnlarge(this.graphDomNode);this.repaintGraph()};o.prototype.handleClickEvent=function(e){if(!document.body.contains(this.parentDomNode)){window.removeEventListener("click",this.handleClickEvent);return}if(this.network){var t=document.elementFromPoint(e.clientX,e.clientY);if(!this.parentDomNode.contains(t)){this.network.selectNodes([])}}};o.prototype.getViewHolderRef=function(){if(this.viewHolderRef){return this.viewHolderRef}this.logger("info","Retrieving or generating the view holder reference");var e=this.getAttribute("view");if(e){this.logger("log",'User wants to bind view "'+e+'" to graph');var i=this.opt.path.views+"/"+e;if(this.wiki.getTiddler(i)){var r=this.opt.path.localHolders+"/"+t.genUUID();this.logger("log",'Created an independent temporary view holder "'+r+'"');this.wiki.addTiddler(new $tw.Tiddler({title:r,text:i}));this.logger("log",'View "'+i+'" inserted into independend holder')}else{this.logger("log",'View "'+e+'" does not exist')}}if(typeof r==="undefined"){this.logger("log","Using default (global) view holder");var r=this.opt.ref.defaultGraphViewHolder}return r};o.prototype.setView=function(e,t){if(e){if(!t){t=this.viewHolderRef}this.logger("info",'Inserting view "'+e+'" into holder "'+t+'"');this.wiki.addTiddler(new $tw.Tiddler({title:t,text:e}))}this.view=this.getView(true)};o.prototype.getView=function(e){if(!e&&this.view){return this.view}var i=this.getViewHolderRef();var o=this.wiki.getTiddler(i).fields.text;this.logger("info",'Retrieved view "'+o+'" from holder "'+i+'"');if(t.tiddlerExists(o)){return new r(o)}else{this.logger("log",'Warning: View "'+o+"\" doesn't exist. Default is used instead.");return new r("default")}};o.prototype.repaintGraph=function(){this.logger("info","Repainting the whole graph");this.network.redraw();this.network.zoomExtent()};o.prototype.maxEnlarge=function(e){var i=window.innerHeight;var r=t.getDomNodePos(e).y;var o=10;var s=i-r-o;e.style["height"]=s+"px"};exports.taskgraph=o})();