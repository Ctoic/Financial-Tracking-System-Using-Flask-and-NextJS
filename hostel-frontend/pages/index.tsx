import { useRouter } from 'next/router';
import { Inter } from "next/font/google";
import Image from "next/image";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function Home() {
  const router = useRouter();

  return (
    <div className={`${inter.className} min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800`}>
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            Hostel Management System
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Streamline your hostel operations with our comprehensive management solution
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="text-blue-600 dark:text-blue-400 text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Student Management</h3>
            <p className="text-gray-600 dark:text-gray-300">Efficiently manage student records, room allocations, and fee payments</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="text-blue-600 dark:text-blue-400 text-4xl mb-4">🏠</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Room Management</h3>
            <p className="text-gray-600 dark:text-gray-300">Track room occupancy, maintenance, and room assignments</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="text-blue-600 dark:text-blue-400 text-4xl mb-4">💰</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Financial Tracking</h3>
            <p className="text-gray-600 dark:text-gray-300">Monitor expenses, fee collections, and generate financial reports</p>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-colors duration-200"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}
