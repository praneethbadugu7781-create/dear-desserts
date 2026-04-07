import { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  ChefHat,
  Package,
  CheckCircle,
  User,
  Phone,
  MapPin,
  FileText,
  Download,
  X,
  RefreshCw,
} from 'lucide-react';
import { orderAPI, invoiceAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Orders = () => {
  const [orders, setOrders] = useState({
    new: [],
    preparing: [],
    ready: [],
    completed: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { socket } = useSocket();

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('newOrder', (order) => {
        setOrders((prev) => ({
          ...prev,
          new: [order, ...prev.new],
        }));
        playNotificationSound();
      });

      socket.on('orderUpdated', (order) => {
        fetchOrders();
      });

      return () => {
        socket.off('newOrder');
        socket.off('orderUpdated');
      };
    }
  }, [socket]);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play();
    } catch (e) {}
  };

  const fetchOrders = async () => {
    try {
      const response = await orderAPI.getKanban();
      setOrders(response.data.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceColumn = source.droppableId;
    const destColumn = destination.droppableId;
    const order = orders[sourceColumn].find((o) => o._id === draggableId);

    if (!order) return;

    // Optimistic update
    const newOrders = { ...orders };
    newOrders[sourceColumn] = newOrders[sourceColumn].filter((o) => o._id !== draggableId);
    newOrders[destColumn] = [...newOrders[destColumn]];
    newOrders[destColumn].splice(destination.index, 0, { ...order, status: destColumn });
    setOrders(newOrders);

    try {
      await orderAPI.updateStatus(draggableId, destColumn);
      toast.success(`Order moved to ${destColumn}`);
    } catch (error) {
      console.error('Failed to update order status:', error);
      toast.error('Failed to update order');
      fetchOrders(); // Revert on error
    }
  };

  const downloadInvoice = async (orderId) => {
    try {
      const response = await invoiceAPI.generate(orderId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${orderId}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('Invoice downloaded');
    } catch (error) {
      console.error('Failed to download invoice:', error);
      toast.error('Failed to download invoice');
    }
  };

  const columns = [
    { id: 'new', title: 'New Orders', icon: Package, color: 'bg-blue-500' },
    { id: 'preparing', title: 'Preparing', icon: ChefHat, color: 'bg-yellow-500' },
    { id: 'ready', title: 'Ready', icon: Clock, color: 'bg-green-500' },
    { id: 'completed', title: 'Completed', icon: CheckCircle, color: 'bg-purple-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-chocolate-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Order Management</h2>
        <button
          onClick={fetchOrders}
          className="flex items-center space-x-2 px-4 py-2 text-chocolate-600 hover:bg-chocolate-50 rounded-lg transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          <span>Refresh</span>
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((column) => (
            <div key={column.id} className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-4">
                <div className={`w-8 h-8 ${column.color} rounded-lg flex items-center justify-center`}>
                  <column.icon className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-gray-700">{column.title}</h3>
                <span className="ml-auto bg-gray-200 text-gray-600 text-sm px-2 py-0.5 rounded-full">
                  {orders[column.id]?.length || 0}
                </span>
              </div>

              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[400px] space-y-3 ${
                      snapshot.isDraggingOver ? 'bg-chocolate-50 rounded-lg' : ''
                    }`}
                  >
                    {orders[column.id]?.map((order, index) => (
                      <Draggable key={order._id} draggableId={order._id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white rounded-lg p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow ${
                              snapshot.isDragging ? 'shadow-lg rotate-2' : ''
                            }`}
                            onClick={() => setSelectedOrder(order)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-mono text-sm font-semibold text-chocolate-600">
                                #{order.orderNumber}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(order.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="font-medium text-gray-800 mb-1">
                              {order.customer?.name}
                            </p>
                            <p className="text-sm text-gray-500 mb-2">
                              {order.items?.length} item(s)
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-chocolate-600">
                                ₹{order.total}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                order.paymentMethod === 'cash'
                                  ? 'bg-green-100 text-green-700'
                                  : order.paymentMethod === 'card'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-purple-100 text-purple-700'
                              }`}>
                                {order.paymentMethod?.toUpperCase()}
                              </span>
                            </div>
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

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setSelectedOrder(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-20 bottom-20 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg bg-white rounded-2xl shadow-xl z-50 overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800">
                  Order #{selectedOrder.orderNumber}
                </h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                {/* Customer Info */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-800 mb-3">Customer Details</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <User className="w-4 h-4" />
                      <span>{selectedOrder.customer?.name}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <a href={`tel:${selectedOrder.customer?.phone}`} className="hover:text-chocolate-600">
                        {selectedOrder.customer?.phone}
                      </a>
                    </div>
                    <div className="flex items-start space-x-2 text-gray-600">
                      <MapPin className="w-4 h-4 mt-0.5" />
                      <span>{selectedOrder.customer?.address}</span>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-800 mb-3">Order Items</h4>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    {selectedOrder.items?.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-700">
                          {item.name} x {item.quantity}
                        </span>
                        <span className="font-medium">₹{item.subtotal}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2">
                      {selectedOrder.discount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Discount</span>
                          <span>-₹{selectedOrder.discount}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-chocolate-600">
                        <span>Total</span>
                        <span>₹{selectedOrder.total}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Info */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-800 mb-3">Order Info</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Status</span>
                      <p className="font-medium text-gray-800 capitalize">{selectedOrder.status}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Payment</span>
                      <p className="font-medium text-gray-800 capitalize">{selectedOrder.paymentMethod}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Date</span>
                      <p className="font-medium text-gray-800">
                        {new Date(selectedOrder.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Time</span>
                      <p className="font-medium text-gray-800">
                        {new Date(selectedOrder.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-800 mb-2">Notes</h4>
                    <p className="text-gray-600 bg-gray-50 rounded-lg p-3 text-sm">
                      {selectedOrder.notes}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => downloadInvoice(selectedOrder._id)}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-chocolate-500 text-white rounded-xl hover:bg-chocolate-600 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    <span>Download Invoice</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Orders;
