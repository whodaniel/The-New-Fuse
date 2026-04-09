import React, { useState, useRef } from 'react';
import { TimelineEvent } from '../types.js';

interface TimelineViewProps {
    events: TimelineEvent[];
    selectedEvent?: TimelineEvent | null;
    onEventSelect?: (event: TimelineEvent) => void;
    onCreateBranch?: (eventId: string, branchName: string) => void;
}

const TimelineView: React.FC<TimelineViewProps> = ({
    events,
    selectedEvent,
    onEventSelect,
    onCreateBranch
}) => {
    const [showBranchForm, setShowBranchForm] = useState(false);
    const [newBranchName, setNewBranchName] = useState('');
    const svgRef = useRef<SVGSVGElement>(null);

    const handleCreateBranch = (): any => {
        if (selectedEvent && onCreateBranch && newBranchName) {
            onCreateBranch(selectedEvent.id, newBranchName);
            setShowBranchForm(false);
            setNewBranchName('');
        }
    };

    return (
        <div className="relative w-full h-[600px]">
            <svg ref={svgRef} className="w-full h-full"/>

            <div className="absolute top-4 right-4 space-y-2">
                <button 
                    onClick={() => setShowBranchForm(true)} 
                    disabled={!selectedEvent} 
                    className="px-3 py-1 bg-blue-500 text-white rounded-md disabled:opacity-50"
                >
                    Create Branch
                </button>
            </div>

            {showBranchForm && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded-lg shadow-lg">
                    <h3 className="text-lg font-medium mb-4">Create New Branch</h3>
                    <input
                        type="text"
                        value={newBranchName}
                        onChange={(e) => setNewBranchName(e.target.value)}
                        placeholder="Branch name"
                        className="block w-full px-3 py-2 border rounded-md mb-4"
                    />
                    <div className="flex justify-end space-x-2">
                        <button
                            onClick={() => setShowBranchForm(false)}
                            className="px-3 py-1 border rounded-md"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateBranch}
                            className="px-3 py-1 bg-blue-500 text-white rounded-md"
                        >
                            Create
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimelineView;