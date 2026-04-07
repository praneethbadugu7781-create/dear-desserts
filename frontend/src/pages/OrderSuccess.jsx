import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Copy, ArrowRight, Clock, MapPin, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

const OrderSuccess = () => {
  const { orderNumber } = useParams();

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(orderNumber);
    toast.success('Order number copied!');
  };

  return (
    <div className="min-h-screen bg-cream-50 pt-24 pb-12 flex items-center">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg mx-auto text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-16 h-16 text-green-500" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-3xl font-display font-bold text-chocolate-800 mb-4">
              Order Placed Successfully!
            </h1>
            <p className="text-chocolate-500 mb-8">
              Thank you for your order. We've received it and will start preparing it soon.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card p-6 mb-8"
          >
            <p className="text-chocolate-500 mb-2">Order Number</p>
            <div className="flex items-center justify-center space-x-3">
              <span className="text-2xl font-bold text-chocolate-700">{orderNumber}</span>
              <button
                onClick={copyOrderNumber}
                className="p-2 hover:bg-chocolate-100 rounded-lg transition-colors"
              >
                <Copy className="w-5 h-5 text-chocolate-500" />
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card p-6 mb-8"
          >
            <h3 className="font-semibold text-chocolate-700 mb-4">What's Next?</h3>
            <div className="space-y-4 text-left">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-chocolate-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-chocolate-600" />
                </div>
                <div>
                  <p className="font-medium text-chocolate-700">Preparation Time</p>
                  <p className="text-sm text-chocolate-500">Your order will be prepared in 15-30 minutes</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-chocolate-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-chocolate-600" />
                </div>
                <div>
                  <p className="font-medium text-chocolate-700">Delivery</p>
                  <p className="text-sm text-chocolate-500">Your order will be delivered to your doorstep</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-chocolate-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-chocolate-600" />
                </div>
                <div>
                  <p className="font-medium text-chocolate-700">Contact</p>
                  <p className="text-sm text-chocolate-500">We'll call you when your order is ready</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to={`/track/${orderNumber}`}
              className="btn-primary flex items-center justify-center space-x-2"
            >
              <span>Track Order</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/menu" className="btn-secondary">
              Order More
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default OrderSuccess;
