import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  TrendingUp,
  Clock,
  CheckCircle,
  DollarSign,
  Users,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { analyticsAPI } from '../../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revenuePeriod, setRevenuePeriod] = useState('week');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchRevenue();
  }, [revenuePeriod]);

  const fetchData = async () => {
    try {
      const [statsRes, topRes, catRes] = await Promise.all([
        analyticsAPI.getDashboard(),
        analyticsAPI.getTopItems({ limit: 5 }),
        analyticsAPI.getCategories(),
      ]);
      
      setStats(statsRes.data.data);
      setTopItems(topRes.data.data);
      setCategoryData(catRes.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenue = async () => {
    try {
      const response = await analyticsAPI.getRevenue(revenuePeriod);
      setRevenueData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch revenue data:', error);
    }
  };

  const statCards = [
    {
      title: "Today's Orders",
      value: stats?.today?.totalOrders || 0,
      icon: ShoppingBag,
      color: 'bg-blue-500',
      change: '+12%',
      up: true,
    },
    {
      title: "Today's Revenue",
      value: `₹${stats?.today?.revenue || 0}`,
      icon: DollarSign,
      color: 'bg-green-500',
      change: '+8%',
      up: true,
    },
    {
      title: 'Pending Orders',
      value: stats?.today?.pendingOrders || 0,
      icon: Clock,
      color: 'bg-yellow-500',
    },
    {
      title: 'Completed Today',
      value: stats?.today?.completedOrders || 0,
      icon: CheckCircle,
      color: 'bg-purple-500',
    },
  ];

  const revenueChartData = {
    labels: revenueData.map((d) => {
      const date = new Date(d._id);
      return revenuePeriod === 'year'
        ? date.toLocaleDateString('en-US', { month: 'short' })
        : date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Revenue',
        data: revenueData.map((d) => d.revenue),
        borderColor: '#8B4513',
        backgroundColor: 'rgba(139, 69, 19, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const ordersChartData = {
    labels: revenueData.map((d) => {
      const date = new Date(d._id);
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }),
    datasets: [
      {
        label: 'Orders',
        data: revenueData.map((d) => d.orders),
        backgroundColor: '#CD853F',
        borderRadius: 8,
      },
    ],
  };

  const categoryChartData = {
    labels: categoryData.map((c) => c._id?.charAt(0).toUpperCase() + c._id?.slice(1)),
    datasets: [
      {
        data: categoryData.map((c) => c.totalRevenue),
        backgroundColor: ['#8B4513', '#D2691E', '#CD853F', '#DEB887'],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        grid: {
          color: '#f0f0f0',
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-chocolate-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
              {card.change && (
                <span className={`flex items-center text-sm font-medium ${
                  card.up ? 'text-green-600' : 'text-red-600'
                }`}>
                  {card.up ? <ArrowUp className="w-4 h-4 mr-1" /> : <ArrowDown className="w-4 h-4 mr-1" />}
                  {card.change}
                </span>
              )}
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-gray-800">{card.value}</h3>
              <p className="text-gray-500 text-sm">{card.title}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Revenue Overview</h3>
            <div className="flex space-x-2">
              {['week', 'month', 'year'].map((period) => (
                <button
                  key={period}
                  onClick={() => setRevenuePeriod(period)}
                  className={`px-3 py-1 text-sm rounded-lg capitalize ${
                    revenuePeriod === period
                      ? 'bg-chocolate-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          <div className="h-72">
            <Line data={revenueChartData} options={chartOptions} />
          </div>
        </motion.div>

        {/* Category Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Sales by Category</h3>
          <div className="h-64">
            <Doughnut
              data={categoryChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          </div>
        </motion.div>
      </div>

      {/* Orders Chart & Top Items */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Orders Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Orders This Week</h3>
          <div className="h-64">
            <Bar data={ordersChartData} options={chartOptions} />
          </div>
        </motion.div>

        {/* Top Selling Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Top Selling Items</h3>
          <div className="space-y-4">
            {topItems.map((item, index) => (
              <div key={item._id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="w-8 h-8 bg-chocolate-100 rounded-full flex items-center justify-center text-sm font-bold text-chocolate-600">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-800">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.totalQuantity} sold</p>
                  </div>
                </div>
                <span className="font-semibold text-chocolate-600">
                  ₹{item.totalRevenue}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-r from-chocolate-500 to-chocolate-700 rounded-xl p-6 text-white"
        >
          <h3 className="text-lg font-semibold mb-2">This Week</h3>
          <p className="text-3xl font-bold">₹{stats?.thisWeek?.revenue || 0}</p>
          <p className="text-chocolate-200 mt-1">{stats?.thisWeek?.totalOrders || 0} orders</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-gradient-to-r from-caramel-500 to-caramel-600 rounded-xl p-6 text-white"
        >
          <h3 className="text-lg font-semibold mb-2">This Month</h3>
          <p className="text-3xl font-bold">₹{stats?.thisMonth?.revenue || 0}</p>
          <p className="text-orange-100 mt-1">{stats?.thisMonth?.totalOrders || 0} orders</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white"
        >
          <h3 className="text-lg font-semibold mb-2">All Time</h3>
          <p className="text-3xl font-bold">₹{stats?.allTime?.totalRevenue || 0}</p>
          <p className="text-green-100 mt-1">{stats?.allTime?.totalOrders || 0} orders</p>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
