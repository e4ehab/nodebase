"use client";

import { useReactFlow, type Node, type NodeProps } from "@xyflow/react";
import { GlobeIcon } from "lucide-react";
import { memo, useState } from "react";
import { BaseExecutionNode } from "../base-execution-node";
import { HttpRequestFormValues, HttpRequestDialog } from "./dialog";

type HttpRequestNodeData = {
  variableName?: string;
  endpoint?: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: string;
};

type HttpRequestNodeType = Node<HttpRequestNodeData>;

export const HttpRequestNode = memo((props: NodeProps<HttpRequestNodeType>) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { setNodes } = useReactFlow(); // to preserve the values

  const nodeStatus = "initial"; // pass the current status of the node (initial, loading, success, error) to the HttpRequestNode and then to the BaseExecutionNode to show the appropriate status indicator

  const handleOpenSettings = () => setDialogOpen(true);

  const handleSubmit = (values: HttpRequestFormValues) => {
    setNodes((nodes) => nodes.map((node) => {
      if (node.id === props.id) {
        return {
          ...node,
          data: {
            ...node.data,
            // endpoint: values.endpoint, // imporoved by just spreading values since the form values have the same shape as the node data
            // method: values.method,
            // body: values.body,
            // variableName: values.variableName,
            ...values,
          }
        }
      }
      return node;
    }))
  };

  const nodeData = props.data;
  const description = nodeData?.endpoint
    ? `${nodeData.method || "GET"}: ${nodeData.endpoint}`
    : "Not configured";

  return (
    <>
      <HttpRequestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        defaultValues={nodeData}
        
        // defaultEndpoint={nodeData.endpoint} // improved by just sending defaultValues={nodeData} instead of the 3 separate props and then using those as default values in the form which will be reset when the dialog opens with new values
        // defaultMethod={nodeData.method}
        // defaultBody={nodeData.body}
      />
      <BaseExecutionNode
        {...props}
        id={props.id}
        icon={GlobeIcon}
        name="HTTP Request"
        status={nodeStatus}
        description={description}
        onSettings={handleOpenSettings}
        onDoubleClick={handleOpenSettings}
      />
    </>
  )
});

HttpRequestNode.displayName = "HttpRequestNode";