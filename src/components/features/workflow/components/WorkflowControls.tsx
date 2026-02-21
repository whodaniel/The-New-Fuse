import React, { FC } from "react";
import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import {
  Play,
  Pause,
  StepForward,
  Bug,
  Upload,
  AlertCircle,
} from "lucide-react"; // Assuming you're using lucide-react for icons

interface WorkflowControlsProps {
  debugMode: boolean;
  isValid: boolean;
  onToggleDebug: () => void;
  onStep: () => void;
  onPause: () => void;
  onResume: () => void;
  onDeploy: () => void;
}

export const WorkflowControls: FC<WorkflowControlsProps> = ({
  debugMode,
  isValid,
  onToggleDebug,
  onStep,
  onPause,
  onResume,
  onDeploy,
}) => {
  return (
    <div className="flex items-center gap-2 p-4 border-t border-gray-200 bg-white">
      <div className="flex items-center gap-2">
        <Tooltip content={debugMode ? "Exit Debug Mode" : "Enter Debug Mode"}>
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleDebug}
            className={debugMode ? "bg-blue-50" : ""}
          >
            <Bug className="w-4 h-4 mr-1" />
            Debug
          </Button>
        </Tooltip>

        {debugMode && (
          <>
            <Tooltip content="Step Through">
              <Button variant="outline" size="sm" onClick={onStep}>
                <StepForward className="w-4 h-4" />
              </Button>
            </Tooltip>

            <Tooltip content="Pause Execution">
              <Button variant="outline" size="sm" onClick={onPause}>
                <Pause className="w-4 h-4" />
              </Button>
            </Tooltip>

            <Tooltip content="Resume Execution">
              <Button variant="outline" size="sm" onClick={onResume}>
                <Play className="w-4 h-4" />
              </Button>
            </Tooltip>
          </>
        )}
      </div>

      <div className="flex-1" />

      <Tooltip
        content={
          !isValid
            ? "Fix validation errors before deploying"
            : "Deploy Workflow"
        }
      >
        <span className="inline-block">
          {" "}
          {/* Wrapper to handle disabled state with Tooltip */}
          <Button
            variant="primary"
            size="sm"
            onClick={onDeploy}
            disabled={!isValid}
            className="flex items-center"
          >
            {!isValid && <AlertCircle className="w-4 h-4 mr-1 text-red-500" />}
            <Upload className="w-4 h-4 mr-1" />
            Deploy
          </Button>
        </span>
      </Tooltip>
    </div>
  );
};
