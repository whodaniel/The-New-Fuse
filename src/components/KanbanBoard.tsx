import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface KanbanColumn {
    id: string;
    title: string;
    items: Array<{
        id: string;
        title: string;
        [key: string]: any;
    }>;
}

interface KanbanBoardProps {
    columns: KanbanColumn[];
    onDragEnd: (result: any) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ columns, onDragEnd }) => {
    return (
        <div className="kanban-board">
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="columns">
                    {columns.map(column => (
                        <div key={column.id} className="column">
                            <h3>{column.title}</h3>
                            <Droppable droppableId={column.id}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`droppable-area ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                                    >
                                        {column.items.map((item, index) => (
                                            <Draggable key={item.id} draggableId={item.id} index={index}>
                                                {(provided) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className="kanban-item"
                                                    >
                                                        {item.title}
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
};

export default KanbanBoard;