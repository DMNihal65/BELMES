import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export const SortableRow = ({ children, ...props }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props['data-row-key']
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
  };

  return (
    <tr {...props} ref={setNodeRef} style={style}>
      {React.Children.map(children, (child) => {
        if (child.key === 'sort') {
          return (
            <td {...child.props}>
              <div {...attributes} {...listeners} style={{ cursor: 'grab' }}>
                {child.props.children}
              </div>
            </td>
          );
        }
        return child;
      })}
    </tr>
  );
};

export default SortableRow;
