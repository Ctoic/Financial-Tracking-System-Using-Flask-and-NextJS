import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Student {
  id: number;
  name: string;
  fee: number;
  fee_status: string;
  remaining_fee: number;
  room_number: number;
}

interface FeeRecord {
  id: number;
  student_id: number;
  amount: number;
  date_paid: string;
  student: Student;
}

interface FeeData {
  fee_records_current: FeeRecord[];
  fee_records_previous: FeeRecord[];
  total_fees_current: number;
  total_fees_previous: number;
  total_students_current: number;
  total_students_previous: number;
  current_month: number;
  current_year: number;
  prev_month: number;
  prev_year: number;
  monthly_totals: { month: string; total: number }[];
}

export default function FeeCollection() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [feeData, setFeeData] = useState<FeeData | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [formData, setFormData] = useState({
    student_id: '',
    amount: '',
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
      fetchFeeData();
      fetchStudents();
    }
  }, [isAuthenticated, selectedMonth, selectedYear]);

  const fetchFeeData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`http://localhost:5051/api/fees?month=${selectedMonth}&year=${selectedYear}`, {
        withCredentials: true,
        headers: {
          'Accept': 'application/json'
        }
      });
      setFeeData(response.data);
    } catch (error) {
      console.error('Error fetching fee data:', error);
      toast.error('Failed to fetch fee data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await axios.get('http://localhost:5051/students', {
        withCredentials: true
      });
      setStudents(response.data.students || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch students');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formattedData = {
        student_id: parseInt(formData.student_id),
        amount: parseFloat(formData.amount),
        date: formData.date
      };

      const response = await axios.post('http://localhost:5051/collect-fee', formattedData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (response.data.success) {
        toast.success(response.data.message);
        setIsModalOpen(false);
        fetchFeeData();
        fetchStudents();
        resetForm();
      } else {
        toast.error(response.data.message || 'Failed to record fee payment');
      }
    } catch (error: any) {
      console.error('Error recording fee payment:', error);
      toast.error(error.response?.data?.message || 'Failed to record fee payment');
    }
  };

  const resetForm = () => {
    setFormData({
      student_id: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  if (authLoading || isLoading || !feeData) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  const lineChartData = {
    labels: ['Previous Month', 'Current Month'],
    datasets: [
      {
        label: 'Fee Collections',
        data: [feeData.total_fees_previous || 0, feeData.total_fees_current || 0],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        tension: 0.1,
      },
    ],
  };

  const barChartData = {
    labels: (feeData.monthly_totals || []).map(item => item.month),
    datasets: [
      {
        label: 'Monthly Fee Collections',
        data: (feeData.monthly_totals || []).map(item => item.total),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  };

  const unpaidStudents = students.filter((student) => student.fee_status !== 'paid');
  const partiallyPaidStudents = students.filter((student) => student.fee_status === 'partial');
  const fullyPaidStudents = students.filter((student) => student.fee_status === 'paid');

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Fee Collection</h1>
          <div className="flex items-center space-x-4">
            {/* Date Filters */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="appearance-none bg-white border-2 border-gray-200 rounded-lg px-4 py-2.5 pr-10 text-gray-700 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 hover:border-gray-300 cursor-pointer min-w-[140px]"
                >
                  {months.map(month => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="appearance-none bg-white border-2 border-gray-200 rounded-lg px-4 py-2.5 pr-10 text-gray-700 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 hover:border-gray-300 cursor-pointer min-w-[100px]"
                >
                  {years.map(year => (
                    <option key={year.value} value={year.value}>
                      {year.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Add Fee Collection Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2.5 rounded-lg hover:from-green-700 hover:to-green-800 transform hover:scale-105 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
            >
              Collect Fee
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Current Month Collections</h3>
            <p className="text-3xl font-bold text-green-600">Rs.{feeData.total_fees_current}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Previous Month Collections</h3>
            <p className="text-3xl font-bold text-blue-600">Rs.{feeData.total_fees_previous}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Unpaid Students</h3>
            <p className="text-3xl font-bold text-red-600">{unpaidStudents.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Fully Paid Students</h3>
            <p className="text-3xl font-bold text-green-600">{fullyPaidStudents.length}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Comparison</h3>
            <Line data={lineChartData} />
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Yearly Fee Collections</h3>
            <Bar data={barChartData} />
          </div>
        </div>

        {/* Fee Records Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Current Month Fee Records</h3>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Room
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Paid
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(feeData.fee_records_current || [])?.map((record) => (
                <tr key={record.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{record.student.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">Room {record.student.room_number}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-green-600">Rs.{record.amount}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(record.date_paid).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        record.student.fee_status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : record.student.fee_status === 'partial'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {record.student.fee_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Fee Collection Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-300 ease-out scale-100 opacity-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Collect Fee Payment</h2>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-2 hover:bg-gray-100 rounded-full"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Student</label>
                  <select
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    required
                  >
                    <option value="">Select a student</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name} - Room {student.room_number} (Remaining: Rs.{student.remaining_fee})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500 font-medium">Rs.</span>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    required
                  />
                </div>
                
                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transform hover:scale-105 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                  >
                    Collect Fee
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
