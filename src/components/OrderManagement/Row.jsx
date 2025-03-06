import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const Row = ({ children, ...props }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: props['data-row-key'] || props.id
  });

  const style = {
    ...props.style,
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging ? {
      position: 'relative',
      zIndex: 999,
      background: '#fafafa',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    } : {}),
    cursor: 'move',
  };

  return (
    <tr {...props} ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </tr>
  );
};

export default Row; 