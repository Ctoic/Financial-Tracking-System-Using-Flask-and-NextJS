import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Expense {
  id: number;
  item_name: string;
  price: number;
  date: string;
  user_id: number;
}

interface ExpenseData {
  expenses_current: Expense[];
  expenses_previous: Expense[];
  total_expenses_current: number;
  total_expenses_previous: number;
  total_income_current: number;
  total_income_previous: number;
  remaining_balance_current: number;
  remaining_balance_previous: number;
  current_month: number;
  current_year: number;
  prev_month: number;
  prev_year: number;
}

export default function Expenses() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [expenseData, setExpenseData] = useState<ExpenseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [formData, setFormData] = useState({
    item_name: '',
    price: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Generate arrays for month and year options
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2000, i, 1).toLocaleString('default', { month: 'long' })
  }));

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => ({
    value: currentYear - i,
    label: (currentYear - i).toString()
  }));

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCsrfToken();
      fetchExpenses();
    }
  }, [isAuthenticated, selectedMonth, selectedYear]);

  const fetchCsrfToken = async () => {
    try {
      const response = await axios.get('http://localhost:5051/api/csrf-token', {
        withCredentials: true
      });
      setCsrfToken(response.data.csrf_token);
    } catch (error) {
      console.error('Error fetching CSRF token:', error);
    }
  };

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`http://localhost:5051/api/expenses?month=${selectedMonth}&year=${selectedYear}`, {
        withCredentials: true,
        headers: {
          'Accept': 'application/json'
        }
      });
      setExpenseData(response.data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error('Failed to fetch expenses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5051/export_pdf/${selectedYear}/${selectedMonth}`,
        {
          withCredentials: true,
          responseType: 'blob'
        }
      );
      
      // Create a blob from the PDF data
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link and trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.download = `expense_report_${selectedYear}_${selectedMonth}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      toast.success('Report downloaded successfully');
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Format the data before sending
      const formattedData = {
        item_name: formData.item_name.trim(),
        price: parseFloat(formData.price),
        date: formData.date
      };

      console.log('Submitting formatted data:', formattedData);

      // First, get a fresh CSRF token
      const tokenResponse = await axios.get('http://localhost:5051/api/csrf-token', {
        withCredentials: true
      });
      const freshToken = tokenResponse.data.csrf_token;

      const response = await axios.post('http://localhost:5051/api/expenses', formattedData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-Token': freshToken
        }
      });
      
      if (response.data.success) {
        toast.success(response.data.message);
        setIsModalOpen(false);
        fetchExpenses();
        resetForm();
      } else {
        toast.error(response.data.message || 'Failed to add expense');
      }
    } catch (error: any) {
      console.error('Error adding expense:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
      }
      toast.error(error.response?.data?.message || 'Failed to add expense');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        // Get a fresh CSRF token
        const tokenResponse = await axios.get('http://localhost:5051/api/csrf-token', {
          withCredentials: true
        });
        const freshToken = tokenResponse.data.csrf_token;

        const response = await axios.delete(`http://localhost:5051/api/expenses?id=${id}`, {
          withCredentials: true,
          headers: {
            'Accept': 'application/json',
            'X-CSRF-Token': freshToken
          }
        });
        
        if (response.data.success) {
          toast.success(response.data.message);
          fetchExpenses();
        } else {
          toast.error(response.data.message || 'Failed to delete expense');
        }
      } catch (error: any) {
        console.error('Error deleting expense:', error);
        toast.error(error.response?.data?.message || 'Failed to delete expense');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      item_name: '',
      price: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  if (authLoading || isLoading || !expenseData) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  const chartData = {
    labels: ['Previous Month', 'Current Month'],
    datasets: [
      {
        label: 'Expenses',
        data: [expenseData.total_expenses_previous, expenseData.total_expenses_current],
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
      },
      {
        label: 'Income',
        data: [expenseData.total_income_previous, expenseData.total_income_current],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
      },
    ],
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Expenses</h1>
          <div className="flex items-center space-x-4">
            {/* Date Filters */}
            <div className="flex items-center space-x-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                {months.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                {years.map(year => (
                  <option key={year.value} value={year.value}>
                    {year.label}
                  </option>
                ))}
              </select>
            </div>
            {/* Download Report Button */}
            <button
              onClick={handleDownloadReport}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Download Report
            </button>
            {/* Add Expense Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Add New Expense
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Current Month Expenses</h3>
            <p className="text-3xl font-bold text-red-600">Rs:{expenseData.total_expenses_current}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Current Month Income</h3>
            <p className="text-3xl font-bold text-green-600">Rs:{expenseData.total_income_current}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Remaining Balance</h3>
            <p className={`text-3xl font-bold ${expenseData.remaining_balance_current >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Rs:{expenseData.remaining_balance_current}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Previous Month Expenses</h3>
            <p className="text-3xl font-bold text-red-600">Rs:{expenseData.total_expenses_previous}</p>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Income vs Expenses</h3>
          <Line data={chartData} />
        </div>

        {/* Expenses Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenseData.expenses_current?.map((expense) => (
                <tr key={expense.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{expense.item_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">Rs:{expense.price}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(expense.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Expense Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
            <div className="bg-dark-500 rounded-lg p-8 max-w-md w-full">
              <h2 className="text-xl font-semibold mb-4">Add New Expense</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Item Name</label>
                  <input
                    type="text"
                    value={formData.item_name}
                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    Add Expense
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 