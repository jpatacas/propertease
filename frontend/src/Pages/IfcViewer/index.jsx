import React, { useRef, useEffect, useState } from "react";
import { IfcViewerAPI } from "web-ifc-viewer";
import * as THREE from "three";
import PropertiesMenu from "../../components/PropertiesMenu";
//import ToolbarBottom from "../../components/ToolbarBottom";
import "./IfcViewer.css";

const IfcViewer = ({ ifcProject }) => {
  const containerRef = useRef();
  const [selectedProperties, setSelectedProperties] = useState({});
  const [isPropertyMenuVisible, setPropertyMenuVisible] = useState(false);
  const [buildingId, setBuildingId] = useState(0); //store the expressId of a building
  //const [isTreeMenuVisible, setTreeMenuVisible] = useState(true);

  useEffect(() => {
    const ifcUrl = "../ifc-models/TESTED_Simple_project_01.ifc";

    //const ifcUrl = "../ifc-models/rac_basic_sample_project.ifc"

    const handleDoubleClick = async () => {
      const result = await viewer.IFC.selector.pickIfcItem(true);
      if (!result) return;

      const { modelID, id } = result;
      //id = expressId

      const props = await viewer.IFC.getProperties(modelID, id, true, false);

      //not working consistently first time an ifc element is clicked
      console.log(props);
      setSelectedProperties(props);
      if (!isPropertyMenuVisible) {
        togglePropertyMenu();
      }
    };

    const handleMouseMove = () => viewer.IFC.selector.prePickIfcItem();

    const handleKeyDown = (event) => {
      if (event.code === "KeyP") {
        viewer.clipper.createPlane();
      } else if (event.code === "KeyO") {
        viewer.clipper.deletePlane();
      }
    };

    const loadIfc = async (url) => {
      console.log("loading ifc..."); //turn into a state variable and update
      await viewer.IFC.setWasmPath("../../../");
      const model = await viewer.IFC.loadIfcUrl(url);

      // Setup camera controls, i.e. change initial view
      const controls = viewer.context.ifcCamera.cameraControls;
      controls.setPosition(7.6, 4.3, 24.8, false);
      controls.setTarget(-7.1, -0.3, 2.5, false);

      //renders shadow for model
      await viewer.shadowDropper.renderShadow(model.modelID);

      //post processing below causing the properties to not load on first click?
      //  viewer.context.renderer.postProduction.active = true;

      console.log("loaded ifc");

      ifcProject = await viewer.IFC.getSpatialStructure(model.modelID);
      //console.log(ifcProject.expressID);

      setBuildingId(ifcProject.expressID);

      //fix Tree menu using component
      //createTreeMenu(ifcProject);

      //floorplans

      await viewer.plans.computeAllPlanViews(model.modelID);

      const allPlans = viewer.plans.getAll(model.modelID);

      for (const plan of allPlans) {
        const currentPlan = viewer.plans.planLists[model.modelID][plan];
        console.log(currentPlan);
    
      }

    };

    const viewer = new IfcViewerAPI({
      container: containerRef.current,
      backgroundColor: new THREE.Color(0xffffff),
    });

    viewer.axes.setAxes();
    viewer.grid.setGrid();
    viewer.clipper.active = true;

    window.addEventListener("dblclick", handleDoubleClick);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keydown", handleKeyDown);

    loadIfc(ifcUrl);

    return () => {
      window.removeEventListener("dblclick", handleDoubleClick);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleKeyDown);
      viewer.dispose();
    };
  }, [buildingId]);

  const togglePropertyMenu = () => {
    setPropertyMenuVisible(!isPropertyMenuVisible);
  };

  return (
    <>
      <div className="button-wrapper">
        <button onClick={togglePropertyMenu}>Toggle Property Menu</button>
      </div>
      <div>{buildingId}</div>
      <div id="viewer-container" ref={containerRef} />
      {isPropertyMenuVisible && (
        <div className="ifc-property-menu bottom-right" id="ifc-property-menu">
          <div className="ifc-property-item">
            <div>Key</div>
            <div className="ifc-property-value">Value</div>
          </div>
          <PropertiesMenu
            buildingId={buildingId}
            properties={selectedProperties}
          />
        </div>
      )}
    </>
  );
};

export default IfcViewer;
