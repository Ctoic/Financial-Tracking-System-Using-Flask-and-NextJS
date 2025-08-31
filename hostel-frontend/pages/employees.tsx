import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import axios from 'axios';

interface Employee {
  id: number;
  name: string;
  position: string;
  base_salary: number;
  hire_date: string;
  status: string;
  current_month_salary_paid: number;
  current_month_salary_status: string;
}

interface SalaryRecord {
  id: number;
  month_year: string;
  amount_paid: number;
  date_paid: string;
  payment_method: string;
  notes: string;
}

export default function Employees() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showAddSalary, setShowAddSalary] = useState(false);
  const [showSalaryHistory, setShowSalaryHistory] = useState(false);

  // Form states
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    position: '',
    base_salary: ''
  });

  const [newSalary, setNewSalary] = useState({
    month_year: '',
    amount_paid: '',
    payment_method: 'cash',
    notes: ''
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchEmployees();
    }
  }, [isAuthenticated]);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('http://localhost:5051/api/employees', {
        withCredentials: true
      });
      setEmployees(response.data.employees);
      setError(null);
    } catch (error: any) {
      console.error('Error fetching employees:', error);
      setError(error.response?.data?.message || 'Failed to fetch employees');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSalaryRecords = async (employeeId: number) => {
    try {
      const response = await axios.get(`http://localhost:5051/api/employees/${employeeId}/salaries`, {
        withCredentials: true
      });
      setSalaryRecords(response.data.salary_records);
    } catch (error: any) {
      console.error('Error fetching salary records:', error);
      setError(error.response?.data?.message || 'Failed to fetch salary records');
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5051/api/employees', newEmployee, {
        withCredentials: true
      });
      
      if (response.data.success) {
        setShowAddEmployee(false);
        setNewEmployee({ name: '', position: '', base_salary: '' });
        fetchEmployees();
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to add employee');
    }
  };

  const handleAddSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    try {
      const response = await axios.post(
        `http://localhost:5051/api/employees/${selectedEmployee.id}/salaries`,
        newSalary,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setShowAddSalary(false);
        setNewSalary({ month_year: '', amount_paid: '', payment_method: 'cash', notes: '' });
        fetchEmployees();
        if (showSalaryHistory) {
          fetchSalaryRecords(selectedEmployee.id);
        }
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to add salary payment');
    }
  };

  const handleDeleteEmployee = async (employeeId: number) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;

    try {
      const response = await axios.delete(`http://localhost:5051/api/employees/${employeeId}`, {
        withCredentials: true
      });
      
      if (response.data.success) {
        fetchEmployees();
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete employee');
    }
  };

  const handleDeleteSalary = async (salaryId: number) => {
    if (!confirm('Are you sure you want to delete this salary record?')) return;

    try {
      const response = await axios.delete(`http://localhost:5051/api/salaries/${salaryId}`, {
        withCredentials: true
      });
      
      if (response.data.success) {
        if (selectedEmployee) {
          fetchSalaryRecords(selectedEmployee.id);
        }
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete salary record');
    }
  };

  const getCurrentMonthYear = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
          <button
            onClick={() => setShowAddEmployee(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
          >
            Add Employee
          </button>
        </div>

        {/* Employees Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Employees</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Base Salary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hire Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Month Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.map((employee) => (
                  <tr key={employee.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{employee.position}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">Rs. {employee.base_salary.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{employee.hire_date}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        employee.current_month_salary_status === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {employee.current_month_salary_status === 'paid' ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setSelectedEmployee(employee);
                          setShowSalaryHistory(true);
                          fetchSalaryRecords(employee.id);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View Salaries
                      </button>
                      <button
                        onClick={() => {
                          setSelectedEmployee(employee);
                          setShowAddSalary(true);
                          setNewSalary({ ...newSalary, month_year: getCurrentMonthYear() });
                        }}
                        className="text-green-600 hover:text-green-900"
                      >
                        Pay Salary
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(employee.id)}
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
        </div>

        {/* Add Employee Modal */}
        {showAddEmployee && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Employee</h3>
                <form onSubmit={handleAddEmployee} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      required
                      value={newEmployee.name}
                      onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Position</label>
                    <input
                      type="text"
                      required
                      value={newEmployee.position}
                      onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Base Salary</label>
                    <input
                      type="number"
                      required
                      value={newEmployee.base_salary}
                      onChange={(e) => setNewEmployee({ ...newEmployee, base_salary: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
                    >
                      Add Employee
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddEmployee(false)}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Add Salary Modal */}
        {showAddSalary && selectedEmployee && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Pay Salary - {selectedEmployee.name}
                </h3>
                <form onSubmit={handleAddSalary} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Month-Year</label>
                    <input
                      type="month"
                      required
                      value={newSalary.month_year}
                      onChange={(e) => setNewSalary({ ...newSalary, month_year: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount Paid</label>
                    <input
                      type="number"
                      required
                      value={newSalary.amount_paid}
                      onChange={(e) => setNewSalary({ ...newSalary, amount_paid: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                    <select
                      value={newSalary.payment_method}
                      onChange={(e) => setNewSalary({ ...newSalary, payment_method: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="cash">Cash</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="check">Check</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                      value={newSalary.notes}
                      onChange={(e) => setNewSalary({ ...newSalary, notes: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      rows={3}
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
                    >
                      Record Payment
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddSalary(false)}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Salary History Modal */}
        {showSalaryHistory && selectedEmployee && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Salary History - {selectedEmployee.name}
                  </h3>
                  <button
                    onClick={() => setShowSalaryHistory(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Month-Year
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount Paid
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date Paid
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment Method
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Notes
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {salaryRecords.map((record) => (
                        <tr key={record.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.month_year}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            Rs. {record.amount_paid.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.date_paid}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.payment_method}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {record.notes || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleDeleteSalary(record.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {salaryRecords.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                            No salary records found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
