import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Student {
  id: number;
  name: string;
  fee: number;
  room_id: number;
  status: string;
  picture?: string;
  fee_status: string;
}

export default function Students() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    fee: '',
    room_id: '',
  });
  const [rooms, setRooms] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStudents();
      fetchRooms();
    }
  }, [isAuthenticated]);

  const fetchStudents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get<{students?: Student[], error?: string}>('http://localhost:5051/api/students', {
        withCredentials: true
      });
      console.log('Students API Response:', response.data);
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      
      const studentsData = response.data.students || [];
      console.log('Processed students data:', studentsData);
      
      if (!Array.isArray(studentsData)) {
        console.error('Students data is not an array:', studentsData);
        setError('Invalid data format received from server');
        setStudents([]);
        return;
      }
      
      setStudents(studentsData);
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to fetch students');
      toast.error('Failed to fetch students');
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await axios.get<{rooms?: any[], error?: string}>('http://localhost:5051/api/rooms', {
        withCredentials: true
      });
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      
      const roomsData = response.data.rooms || [];
      setRooms(roomsData);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      // Don't show error toast for rooms as it's not critical
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (selectedStudent) {
        // Update existing student
        const updateData = {
          name: formData.name,
          fee: parseFloat(formData.fee),
          room_id: parseInt(formData.room_id)
        };
        
        await axios.put(`http://localhost:5051/api/students/${selectedStudent.id}`, updateData, {
          withCredentials: true
        });
        toast.success('Student updated successfully');
      } else {
        // Add new student
        const newStudentData = {
          name: formData.name,
          fee: parseFloat(formData.fee),
          room_id: parseInt(formData.room_id)
        };
        
        await axios.post('http://localhost:5051/api/students', newStudentData, {
          withCredentials: true
        });
        toast.success('Student enrolled successfully');
      }
      setIsModalOpen(false);
      fetchStudents();
      resetForm();
    } catch (error: any) {
      console.error('Error saving student:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to save student';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this student? This will also delete all associated fee records.')) {
      try {
        await axios.delete(`http://localhost:5051/api/students/${id}`, {
          withCredentials: true
        });
        toast.success('Student deleted successfully');
        fetchStudents();
      } catch (error: any) {
        console.error('Error deleting student:', error);
        let errorMessage = 'Failed to delete student';
        
        if (error.response?.status === 500) {
          errorMessage = 'Failed to delete student due to database constraints. Please try again or contact support.';
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        }
        
        toast.error(errorMessage);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      fee: '',
      room_id: '',
    });
    setSelectedStudent(null);
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
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Students</h1>
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Add New Student
          </button>
        </div>

        {/* Students Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
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
                  Fee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fee Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {!students ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Loading students...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No students found
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          {student.picture ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={`http://localhost:5051/static/uploads/${student.picture}`}
                              alt={student.name || 'Student'}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold text-sm ${student.picture ? 'hidden' : ''}`}>
                            {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{student.name || 'Unnamed Student'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">Room {student.room_id || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">Rs.{student.fee || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          student.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {student.status || 'unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          student.fee_status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : student.fee_status === 'partial'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {student.fee_status || 'unpaid'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedStudent(student);
                          setFormData({
                            name: student.name || '',
                            fee: (student.fee || 0).toString(),
                            room_id: (student.room_id || '').toString(),
                          });
                          setIsModalOpen(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

                {/* Add/Edit Student Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-2xl border border-blue-200 p-8 max-w-lg w-full transform transition-all duration-300 scale-100">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {selectedStudent ? 'Edit Student' : 'Add New Student'}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors duration-200"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Student Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-white text-gray-800 placeholder-gray-400"
                    placeholder="Enter student's full name"
                    required
                  />
                </div>

                {/* Fee Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Monthly Fee (Rs.)
                  </label>
                  <input
                    type="number"
                    value={formData.fee}
                    onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-white text-gray-800 placeholder-gray-400"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                {/* Room Number Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Room Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="18"
                    value={formData.room_id}
                    onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-white text-gray-800 placeholder-gray-400"
                    placeholder="1-18"
                    required
                  />
                  
                  {/* Room Information */}
                  <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="text-sm font-medium text-blue-800">Room Capacity Guide</span>
                    </div>
                    <p className="text-sm text-blue-700 mb-2">
                      <span className="font-semibold">Rooms 1-14:</span> 3 students max
                    </p>
                    <p className="text-sm text-blue-700">
                      <span className="font-semibold">Rooms 15-18:</span> 4 students max
                    </p>
                  </div>

                  {/* Room Status Display */}
                  {formData.room_id && (
                    <div className="mt-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                      {(() => {
                        const room = rooms.find(r => r.room_number === parseInt(formData.room_id));
                        if (room) {
                          const isFull = room.current_occupancy >= room.capacity;
                          const occupancyPercentage = (room.current_occupancy / room.capacity) * 100;
                          
                          return (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-green-800">
                                  Room {room.room_number} Status
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  isFull 
                                    ? 'bg-red-100 text-red-800 border border-red-200' 
                                    : 'bg-green-100 text-green-800 border border-green-200'
                                }`}>
                                  {isFull ? 'FULL' : 'AVAILABLE'}
                                </span>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-green-700">Current Occupancy:</span>
                                  <span className="font-semibold text-green-800">{room.current_occupancy}/{room.capacity}</span>
                                </div>
                                
                                {/* Progress Bar */}
                                <div className="w-full bg-green-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                      isFull ? 'bg-red-500' : 'bg-green-500'
                                    }`}
                                    style={{ width: `${Math.min(occupancyPercentage, 100)}%` }}
                                  ></div>
                                </div>
                                
                                <p className="text-xs text-green-600">
                                  {isFull 
                                    ? 'This room is at full capacity' 
                                    : `${room.capacity - room.current_occupancy} spot(s) available`
                                  }
                                </p>
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div className="text-center text-green-700">
                            <svg className="w-8 h-8 mx-auto mb-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm font-medium">Room {formData.room_id} is available</p>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all duration-200 hover:shadow-md active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg active:scale-95 transform"
                  >
                    <div className="flex items-center space-x-2">
                      {selectedStudent ? (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>Update Student</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span>Add Student</span>
                        </>
                      )}
                    </div>
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