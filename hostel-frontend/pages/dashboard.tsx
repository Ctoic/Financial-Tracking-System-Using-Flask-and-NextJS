import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface DashboardData {
  total_students: number;
  monthly_expenses: number[];
  monthly_income: number[];
  months: string[];
  expense_categories: { item_name: string; total: number }[];
  current_month_expenses: number;
  current_month_income: number;
  profit_loss: number;
  fully_paid: number;
  partially_paid: number;
  unpaid: number;
  total_salaries_current: number;
  total_salaries_previous: number;
}

const defaultDashboardData: DashboardData = {
  total_students: 0,
  monthly_expenses: [],
  monthly_income: [],
  months: [],
  expense_categories: [],
  current_month_expenses: 0,
  current_month_income: 0,
  profit_loss: 0,
  fully_paid: 0,
  partially_paid: 0,
  unpaid: 0,
  total_salaries_current: 0,
  total_salaries_previous: 0
};

export default function Dashboard() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData>(defaultDashboardData);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isAuthenticated) return;
      
      setIsLoading(true);
      try {
        const response = await axios.get('http://localhost:5051/api/dashboard', {
          withCredentials: true
        });
        setDashboardData(response.data);
        setError(null);
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        setError(error.response?.data?.error || 'Failed to fetch dashboard data');
        setDashboardData(defaultDashboardData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAuthenticated]);

  if (loading || isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-red-600 text-lg">{error}</div>
        </div>
      </Layout>
    );
  }

  // Prepare chart data inside the component
  const lineChartData = {
    labels: dashboardData?.months || [],
    datasets: [
      {
        label: 'Income',
        data: dashboardData?.monthly_income || [],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
      },
      {
        label: 'Expenses',
        data: dashboardData?.monthly_expenses || [],
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
      },
    ],
  };

  const expenseCategories = dashboardData?.expense_categories || [];
  const pieChartData = {
    labels: expenseCategories.map(cat => cat.item_name),
    datasets: [
      {
        data: expenseCategories.map(cat => cat.total),
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
      },
    ],
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Total Students</h3>
            <p className="text-3xl font-bold text-gray-900">{dashboardData.total_students}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Current Month Income</h3>
            <p className="text-3xl font-bold text-green-600">Rs{dashboardData.current_month_income}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Current Month Expenses</h3>
            <p className="text-3xl font-bold text-red-600">Rs{dashboardData.current_month_expenses}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Profit/Loss</h3>
            <p className={`text-3xl font-bold ${dashboardData.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Rs{dashboardData.profit_loss}
            </p>
          </div>
        </div>

        {/* Additional Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Current Month Salaries</h3>
            <p className="text-3xl font-bold text-blue-600">Rs{dashboardData.total_salaries_current}</p>
            <p className="text-sm text-gray-500 mt-1">
              Previous Month: Rs{dashboardData.total_salaries_previous}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Total Expenses (Including Salaries)</h3>
            <p className="text-3xl font-bold text-red-600">Rs{dashboardData.current_month_expenses}</p>
            <p className="text-sm text-gray-500 mt-1">
              Salaries: Rs{dashboardData.total_salaries_current} | Other: Rs{dashboardData.current_month_expenses - dashboardData.total_salaries_current}
            </p>
          </div>
        </div>

        {/* Current Month Salary Details */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Current Month Salary Details</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-blue-800 font-medium">Total Salaries Paid</h4>
                <p className="text-2xl font-bold text-blue-600">Rs{dashboardData.total_salaries_current}</p>
                <p className="text-sm text-blue-600 mt-1">
                  {dashboardData.total_salaries_current > 0 ? 'Current Month' : 'No salaries paid yet'}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="text-green-800 font-medium">Salary vs Expenses</h4>
                <p className="text-2xl font-bold text-green-600">
                  {dashboardData.current_month_expenses > 0 
                    ? Math.round((dashboardData.total_salaries_current / dashboardData.current_month_expenses) * 100)
                    : 0}%
                </p>
                <p className="text-sm text-green-600 mt-1">
                  of total expenses
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="text-purple-800 font-medium">Net Income After Salaries</h4>
                <p className={`text-2xl font-bold ${dashboardData.current_month_income - dashboardData.total_salaries_current >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Rs{dashboardData.current_month_income - dashboardData.total_salaries_current}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Income: Rs{dashboardData.current_month_income}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Income vs Expenses</h3>
            {dashboardData.months.length > 0 ? (
              <Line data={lineChartData} />
            ) : (
              <p className="text-gray-500 text-center">No data available</p>
            )}
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Expense Categories</h3>
            {expenseCategories.length > 0 ? (
              <Pie data={pieChartData} />
            ) : (
              <p className="text-gray-500 text-center">No data available</p>
            )}
          </div>
        </div>

        {/* Fee Collection Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Fee Collection Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="text-green-800 font-medium">Fully Paid</h4>
              <p className="text-2xl font-bold text-green-600">{dashboardData.fully_paid}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <h4 className="text-yellow-800 font-medium">Partially Paid</h4>
              <p className="text-2xl font-bold text-yellow-600">{dashboardData.partially_paid}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="text-red-800 font-medium">Unpaid</h4>
              <p className="text-2xl font-bold text-red-600">{dashboardData.unpaid}</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 