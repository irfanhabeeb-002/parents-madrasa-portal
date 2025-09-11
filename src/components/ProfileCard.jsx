import React from 'react';

const ProfileCard = () => {
  return (
    <div className="max-w-xs w-full bg-white border border-gray-200 rounded-xl overflow-hidden shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),0_8px_10px_-6px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.08),0_15px_15px_-6px_rgba(0,0,0,0.06)] transition-all duration-300">
      <div className="px-4 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-700 to-blue-600">
        <p className="text-xs font-medium text-blue-200 uppercase tracking-wider">
          Signed in as
        </p>
        <div className="flex items-center mt-1">
          <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center mr-2">
            <svg fill="currentColor" viewBox="0 0 20 20" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg">
              <path clipRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" fillRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm font-medium text-white truncate hover:after:w-full relative after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-px after:bg-[#2b6cb0] after:transition-all after:duration-300">
            john.parker@example.com
          </p>
        </div>
      </div>
      
      <div className="py-1.5">
        <a href="#" className="group relative flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition-all duration-200">
          <div className="absolute left-0 top-0 h-full w-1 bg-blue-500 rounded-r opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:scale-y-100 scale-y-80" />
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors duration-200">
            <svg fill="currentColor" viewBox="0 0 20 20" className="h-5 w-5 text-blue-600 group-hover:text-[#2b6cb0]" xmlns="http://www.w3.org/2000/svg">
              <path clipRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" fillRule="evenodd" />
            </svg>
          </div>
          <span className="font-medium text-gray-700 group-hover:text-[#1a365d]">View Profile</span>
          <svg fill="currentColor" viewBox="0 0 20 20" className="h-3 w-3 text-gray-400 ml-auto group-hover:text-[#2b6cb0]" xmlns="http://www.w3.org/2000/svg">
            <path clipRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" fillRule="evenodd" />
          </svg>
        </a>

        <a href="#" className="group relative flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 transition-all duration-200">
          <div className="absolute left-0 top-0 h-full w-1 bg-green-500 rounded-r opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:scale-y-100 scale-y-80" />
          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center mr-3 group-hover:bg-green-200 transition-colors duration-200">
            <svg fill="currentColor" viewBox="0 0 20 20" className="h-5 w-5 text-green-600 group-hover:text-green-700" xmlns="http://www.w3.org/2000/svg">
              <path clipRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" fillRule="evenodd" />
            </svg>
          </div>
          <span className="font-medium text-gray-700 group-hover:text-green-700">My Achievements</span>
          <svg fill="currentColor" viewBox="0 0 20 20" className="h-3 w-3 text-gray-400 ml-auto group-hover:text-green-600" xmlns="http://www.w3.org/2000/svg">
            <path clipRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" fillRule="evenodd" />
          </svg>
        </a>

        <a href="#" className="group relative flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 transition-all duration-200">
          <div className="absolute left-0 top-0 h-full w-1 bg-purple-500 rounded-r opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:scale-y-100 scale-y-80" />
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center mr-3 group-hover:bg-purple-200 transition-colors duration-200">
            <svg fill="currentColor" viewBox="0 0 20 20" className="h-5 w-5 text-purple-600 group-hover:text-purple-700" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="font-medium text-gray-700 group-hover:text-purple-700">My Progress</span>
          <svg fill="currentColor" viewBox="0 0 20 20" className="h-3 w-3 text-gray-400 ml-auto group-hover:text-purple-600" xmlns="http://www.w3.org/2000/svg">
            <path clipRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" fillRule="evenodd" />
          </svg>
        </a>

        <a href="#" className="group relative flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 transition-all duration-200">
          <div className="absolute left-0 top-0 h-full w-1 bg-red-500 rounded-r opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:scale-y-100 scale-y-80" />
          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center mr-3 group-hover:bg-red-200 transition-colors duration-200">
            <svg fill="currentColor" viewBox="0 0 20 20" className="h-5 w-5 text-red-500 group-hover:text-red-600" xmlns="http://www.w3.org/2000/svg">
              <path clipRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" fillRule="evenodd" />
            </svg>
          </div>
          <span className="font-medium text-gray-700 group-hover:text-red-600">Logout</span>
          <svg fill="currentColor" viewBox="0 0 20 20" className="h-3 w-3 text-gray-400 ml-auto group-hover:text-red-500" xmlns="http://www.w3.org/2000/svg">
            <path clipRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" fillRule="evenodd" />
          </svg>
        </a>
      </div>
    </div>
  );
};

export default ProfileCard;