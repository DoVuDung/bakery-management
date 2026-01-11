import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

const OrderKanban = ({ orders, onUpdateStatus }) => {
  const { t } = useTranslation();
  const [kanbanColumns, setKanbanColumns] = useState({
    NEW: { id: 'NEW', title: t('order_status.new'), orders: [] },
    PROCESSING: { id: 'PROCESSING', title: t('order_status.processing'), orders: [] },
    COOKING: { id: 'COOKING', title: t('order_status.cooking'), orders: [] },
    COMPLETED: { id: 'COMPLETED', title: t('order_status.completed'), orders: [] },
    DELIVERED: { id: 'DELIVERED', title: t('order_status.delivered'), orders: [] }
  });

  // Initialize columns with orders
  useEffect(() => {
    const newColumns = { ...kanbanColumns };
    
    // Reset orders in each column
    Object.keys(newColumns).forEach(key => {
      newColumns[key].orders = [];
    });
    
    // Distribute orders to appropriate columns
    orders.forEach(order => {
      if (newColumns[order.status]) {
        newColumns[order.status].orders.push(order);
      }
    });
    
    setKanbanColumns(newColumns);
  }, [orders]);

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const start = kanbanColumns[source.droppableId];
    const finish = kanbanColumns[destination.droppableId];

    if (start === finish) {
      const newOrderIds = Array.from(start.orders);
      const [removed] = newOrderIds.splice(source.index, 1);
      newOrderIds.splice(destination.index, 0, removed);

      const newColumn = {
        ...start,
        orders: newOrderIds,
      };

      setKanbanColumns({
        ...kanbanColumns,
        [newColumn.id]: newColumn,
      });
      return;
    }

    // Moving from one list to another
    const startOrderIds = Array.from(start.orders);
    const [removed] = startOrderIds.splice(source.index, 1);
    const newStart = {
      ...start,
      orders: startOrderIds,
    };

    const finishOrderIds = Array.from(finish.orders);
    finishOrderIds.splice(destination.index, 0, removed);
    const newFinish = {
      ...finish,
      orders: finishOrderIds,
    };

    // Update order status in the backend
    onUpdateStatus(removed.id, destination.droppableId);

    setKanbanColumns({
      ...kanbanColumns,
      [newStart.id]: newStart,
      [newFinish.id]: newFinish,
    });
  };

  return (
    <div className="order-kanban">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {Object.values(kanbanColumns).map(column => (
            <div key={column.id} className="flex flex-col w-80">
              <Card className="mb-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold">
                    {column.title}
                    <Badge variant="secondary" className="ml-2">
                      {column.orders.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
              </Card>
              
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`min-h-[500px] p-2 rounded-md ${
                      snapshot.isDraggingOver ? 'bg-gray-100' : 'bg-gray-50'
                    }`}
                  >
                    {column.orders.map((order, index) => (
                      <Draggable
                        key={order.id}
                        draggableId={order.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`mb-3 ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                          >
                            <Card className="border hover:shadow-sm transition-shadow">
                              <CardContent className="p-3">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-medium">#{order.orderId}</h4>
                                    <p className="text-sm text-gray-600">{order.shippingRecipient}</p>
                                    <p className="text-sm font-semibold">{order.totalAmount.toLocaleString('vi-VN')} ₫</p>
                                  </div>
                                  <Badge variant={
                                    order.status === 'NEW' ? 'default' :
                                    order.status === 'PROCESSING' ? 'secondary' :
                                    order.status === 'COOKING' ? 'outline' :
                                    order.status === 'COMPLETED' ? 'success' :
                                    'destructive'
                                  }>
                                    {t(`order_status.${order.status.toLowerCase()}`)}
                                  </Badge>
                                </div>
                                
                                <div className="mt-2 text-xs text-gray-500">
                                  <p>{order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : ''}</p>
                                  <p className="truncate">{order.customerNotes || 'Không có ghi chú'}</p>
                                </div>
                                
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="mt-2 w-full text-xs"
                                >
                                  Xem chi tiết
                                </Button>
                              </CardContent>
                            </Card>
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

export default OrderKanban;