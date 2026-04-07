import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Phone, MapPin, CreditCard, Banknote, Smartphone, ArrowLeft, Loader2, Mail, FileText, Shield, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { orderAPI } from '../services/api';
import toast from 'react-hot-toast';

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, subtotal, discountAmount, total, discount, clearCart } = useCart();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    paymentMethod: 'cash',
    notes: '',
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Enter a valid 10-digit phone number';
    }
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Delivery address is required';
    } else if (formData.address.trim().length < 10) {
      newErrors.address = 'Please enter a complete address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      navigate('/menu');
      return;
    }

    setLoading(true);
    
    try {
      const orderData = {
        customer: {
          name: formData.name,
          phone: formData.phone,
          email: formData.email || undefined,
          address: formData.address,
        },
        items: cartItems.map((item) => ({
          menuItem: item._id,
          quantity: item.quantity,
        })),
        discountCode: discount?.code,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes || undefined,
      };

      const response = await orderAPI.create(orderData);
      const order = response.data.data;
      
      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/order-success/${order.orderNumber}`);
    } catch (error) {
      console.error('Order failed:', error);
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    { id: 'cash', name: 'Cash on Delivery', icon: Banknote, desc: 'Pay when you receive' },
    { id: 'card', name: 'Card Payment', icon: CreditCard, desc: 'Debit/Credit card' },
    { id: 'upi', name: 'UPI Payment', icon: Smartphone, desc: 'GPay, PhonePe, etc.' },
  ];

  if (cartItems.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-cream-50 pt-28 pb-16">
      <div className="container mx-auto px-4">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/cart')}
          className="flex items-center gap-2 text-chocolate-500 hover:text-chocolate-700 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Cart</span>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-3xl md:text-4xl font-display font-bold text-chocolate-800 mb-2">
            Checkout
          </h1>
          <p className="text-chocolate-500">Complete your order details below</p>
        </motion.div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-10">
            {/* Customer Details */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2 space-y-8"
            >
              {/* Contact Information */}
              <div className="card-luxury p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-gold-500/20 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-gold-600" />
                  </div>
                  <h2 className="text-xl font-display font-bold text-chocolate-800">
                    Contact Information
                  </h2>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="label flex items-center gap-2">
                      <User className="w-4 h-4 text-chocolate-400" />
                      <span>Full Name</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className={`input ${errors.name ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : ''}`}
                    />
                    {errors.name && (
                      <p className="text-rose-500 text-sm mt-2">{errors.name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="label flex items-center gap-2">
                      <Phone className="w-4 h-4 text-chocolate-400" />
                      <span>Phone Number</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="9876543210"
                      className={`input ${errors.phone ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : ''}`}
                    />
                    {errors.phone && (
                      <p className="text-rose-500 text-sm mt-2">{errors.phone}</p>
                    )}
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="label flex items-center gap-2">
                      <Mail className="w-4 h-4 text-chocolate-400" />
                      <span>Email</span>
                      <span className="text-chocolate-400 text-xs">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      className={`input ${errors.email ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : ''}`}
                    />
                    {errors.email && (
                      <p className="text-rose-500 text-sm mt-2">{errors.email}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="card-luxury p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-gold-500/20 rounded-xl flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-gold-600" />
                  </div>
                  <h2 className="text-xl font-display font-bold text-chocolate-800">
                    Delivery Address
                  </h2>
                </div>
                
                <div>
                  <label className="label flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-chocolate-400" />
                    <span>Full Address</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="House/Flat No., Street, Landmark, City, PIN Code"
                    rows={3}
                    className={`input resize-none ${errors.address ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : ''}`}
                  />
                  {errors.address && (
                    <p className="text-rose-500 text-sm mt-2">{errors.address}</p>
                  )}
                </div>
              </div>

              {/* Payment Method */}
              <div className="card-luxury p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-gold-500/20 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-gold-600" />
                  </div>
                  <h2 className="text-xl font-display font-bold text-chocolate-800">
                    Payment Method
                  </h2>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, paymentMethod: method.id }))}
                      className={`p-5 rounded-2xl border-2 text-left transition-all duration-300 ${
                        formData.paymentMethod === method.id
                          ? 'border-gold-500 bg-gold-50 shadow-gold'
                          : 'border-chocolate-100 hover:border-chocolate-200 bg-white'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl mb-3 flex items-center justify-center ${
                        formData.paymentMethod === method.id
                          ? 'bg-gold-500 text-white'
                          : 'bg-chocolate-100 text-chocolate-500'
                      }`}>
                        <method.icon className="w-6 h-6" />
                      </div>
                      <h3 className={`font-semibold mb-1 ${
                        formData.paymentMethod === method.id
                          ? 'text-chocolate-800'
                          : 'text-chocolate-600'
                      }`}>
                        {method.name}
                      </h3>
                      <p className="text-sm text-chocolate-400">{method.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Special Instructions */}
              <div className="card-luxury p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-gold-500/20 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-gold-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-bold text-chocolate-800">
                      Special Instructions
                    </h2>
                    <p className="text-sm text-chocolate-400">Optional</p>
                  </div>
                </div>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any special requests or delivery instructions..."
                  rows={2}
                  className="input resize-none"
                />
              </div>
            </motion.div>

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1"
            >
              <div className="card-dark p-6 sticky top-28">
                <h2 className="text-xl font-display font-bold text-cream-50 mb-6 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-gold-400" />
                  Order Summary
                </h2>

                <div className="space-y-4 max-h-60 overflow-y-auto mb-6 pr-2 scrollbar-hide">
                  {cartItems.map((item) => (
                    <div key={item._id} className="flex justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-xs text-cream-300">
                          {item.quantity}
                        </span>
                        <span className="text-cream-300">{item.name}</span>
                      </div>
                      <span className="font-medium text-cream-100">
                        ₹{item.price * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 border-t border-white/10 pt-6">
                  <div className="flex justify-between text-cream-300">
                    <span>Subtotal</span>
                    <span>₹{subtotal}</span>
                  </div>
                  
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount ({discount?.code})</span>
                      <span>-₹{discountAmount}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-cream-300">
                    <span>Delivery</span>
                    <span className="text-emerald-400 font-medium">Free</span>
                  </div>
                  
                  <div className="border-t border-white/10 pt-4">
                    <div className="flex justify-between text-2xl font-display font-bold">
                      <span className="text-cream-50">Total</span>
                      <span className="text-gold-400">₹{total}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-gold w-full mt-8 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Placing Order...</span>
                    </>
                  ) : (
                    <>
                      <span>Place Order</span>
                      <span className="text-chocolate-700">• ₹{total}</span>
                    </>
                  )}
                </button>

                {/* Trust Badges */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="flex items-center justify-center gap-2 text-cream-400 text-xs">
                    <Shield className="w-4 h-4" />
                    <span>Secure checkout • Fresh delivery guaranteed</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
