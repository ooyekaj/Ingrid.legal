declare module 'cytoscape-cose-bilkent' {
  import { Ext } from 'cytoscape';
  
  interface CoseBilkentLayoutOptions {
    name: 'cose-bilkent';
    animate?: boolean;
    animationDuration?: number;
    refresh?: number;
    fit?: boolean;
    padding?: number;
    randomize?: boolean;
    nodeRepulsion?: number;
    idealEdgeLength?: number;
    edgeElasticity?: number;
    nestingFactor?: number;
    gravity?: number;
    numIter?: number;
    tile?: boolean;
    tilingPaddingVertical?: number;
    tilingPaddingHorizontal?: number;
    gravityRangeCompound?: number;
    gravityCompound?: number;
    gravityRange?: number;
    initialEnergyOnIncremental?: number;
  }

  const coseBilkent: Ext;
  export = coseBilkent;
} 