"use client";

import { ErrorView, LoadingView } from "@/components/entity-components";
import { useSuspenseWorkflow } from "@/features/workflows/hooks/use-workflows";
// the following import used for @xyflow/react
import { useState, useCallback } from 'react';
import { ReactFlow, applyNodeChanges, applyEdgeChanges, addEdge, type Node, type Edge, type NodeChange, type EdgeChange, type Connection, Background, Controls, MiniMap, Panel } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nodeComponents } from "@/config/node-components";
import { AddNodeButton } from "./add-node-button";
/*--------------------------------------------------------------------------------------------------*/

export const EditorLoading = () => {
  return <LoadingView message="Loading editor..." />;
};

export const EditorError = () => {
  return <ErrorView message="Error loading editor" />;
};

/*
 ** this section will be commented after establishing workflow.nodes and workflow.edges instead of using hardcoded initialNodes and initialEdges, but I'm keeping it here for reference and testing purposes until we have the database integration working
 * right now after creating a new workflow, a new initial node is created in the database with type: NodeType.INITIAL, position: { x: 0, y: 0 }, name: NodeType.INITIAL, and we use workflow.nodes as the initial state for nodes in the editor, so we can see that initial node rendered in the editor after creating a new workflow

const initialNodes = [
  { id: 'n1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
  { id: 'n2', position: { x: 0, y: 100 }, data: { label: 'Node 2' } },
];

const initialEdges = [{ id: 'n1-n2', source: 'n1', target: 'n2' }];
*/

// pass the workflowId to the Editor component, which will use it to fetch the workflow data using useSuspenseWorkflow hook 
export const Editor = ({ workflowId }: { workflowId: string }) => {
  const { data: workflow } = useSuspenseWorkflow(workflowId);

  const [nodes, setNodes] = useState<Node[]>(workflow.nodes);
  const [edges, setEdges] = useState<Edge[]>(workflow.edges);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nodesSnapshot) =>
        applyNodeChanges(changes, nodesSnapshot),
      ),
    [],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((edgesSnapshot) =>
        applyEdgeChanges(changes, edgesSnapshot),
      ),
    [],
  );

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((edgesSnapshot) =>
        addEdge(params, edgesSnapshot),
      ),
    [],
  );

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeComponents} // this is where we register our custom node types, so when a node has type: NodeType.INITIAL, it will render the InitialNode component
        fitView
        proOptions={{ hideAttribution: true }} // to hide the "Made with React Flow" attribution, you can set the proOptions prop with hideAttribution: true.
      >
        <Background />{/* built-in background component */}
        <Controls />{/* built-in controls component with zoom in, zoom out, fit view, and interactive buttons */}
        <MiniMap />{/* built-in minimap component */}
        <Panel position="top-right"> {/* custom element -> panel */}
          <AddNodeButton />
        </Panel>
      </ReactFlow>
    </div>
  );
};