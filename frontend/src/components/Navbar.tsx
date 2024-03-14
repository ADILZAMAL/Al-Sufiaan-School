import { useState } from 'react';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white py-2 container">
      <div className="mx-auto">
        <div className="flex items-center justify-between h-16">
          <div>
            <a
              href="/"
              className="font-weight-bold flex items-center hover:no-underline"
            >
              <img
                src="./img/school-logo.svg"
                width="50"
                height="50"
                className="mx-2"
              />
              <span className="sm:text-3xl text-cyan-600">Al Sufiaan School</span>
            </a>
          </div>
          <div className="hidden md:block center">
            <div className="ml-10 flex items-baseline space-x-4">
              <a href="/" className="text-gray-800 no-underline px-3 py-2 hover:no-underline hover:text-cyan-600 text-sm font-semibold">Home</a>
              <a href="about" className="text-gray-800 no-underline px-3 py-2 hover:no-underline hover:text-cyan-600 text-sm font-semibold">About</a>
              <a href="team" className="text-gray-800 no-underline px-3 py-2 hover:no-underline hover:text-cyan-600 text-sm font-semibold">Teachers</a>
              <a href="gallery" className="text-gray-800 no-underline px-3 py-2 hover:no-underline hover:text-cyan-600 text-sm font-semibold">Gallery</a>
              <a href="contact" className="text-gray-800 no-underline px-3 py-2 hover:no-underline hover:text-cyan-600 text-sm font-semibold">Contact</a>
              <a href="fees" className="text-gray-800 no-underline px-3 py-2 hover:no-underline hover:text-cyan-600 text-sm font-semibold">School Fees</a>
            </div>
          </div>
          <div>
            <a href="#" className='hidden md:block center bg-cyan-600 text-white px-4 py-2 rounded-3xl hover:no-underline'>Admin Login</a>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:bg-gray-700 focus:text-white">
              <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"} />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div className={isOpen ? "block" : "hidden md:hidden"}>
        <div className="px-2 pt-2 pb-3 space-y-4 sm:px-3">
          <a href="/"       className="block text-gray-800 no-underline hover:no-underline hover:text-cyan-600 text-sm font-semibold">Home</a>
          <a href="about"   className="block text-gray-800 no-underline hover:no-underline hover:text-cyan-600 text-sm font-semibold">About</a>
          <a href="team"    className="block text-gray-800 no-underline hover:no-underline hover:text-cyan-600 text-sm font-semibold">Teachers</a>
          <a href="gallery" className="block text-gray-800 no-underline hover:no-underline hover:text-cyan-600 text-sm font-semibold">Gallery</a>
          <a href="contact" className="block text-gray-800 no-underline hover:no-underline hover:text-cyan-600 text-sm font-semibold">Contact</a>
          <a href="fees"    className="block text-gray-800 no-underline hover:no-underline hover:text-cyan-600 text-sm font-semibold">School Fees</a>
          <div className=''>
          <a href="#"       className='block text-gray-800 no-underline hover:no-underline hover:text-cyan-600 text-sm font-semibold'>Admin Login</a>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
