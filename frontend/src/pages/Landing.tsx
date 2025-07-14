import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import teachers from "../Data/teacher";
import TeacherCard from "../components/TeacherCard";
import FacilitiesCard from "../components/FacilitiesCard";
import facilities from "../Data/facilities";
import principles from "../Data/principles";
import PrincipleCard from "../components/PrincipleCard";



function Landing() {
  return (
    <div>
      <Navbar />
      <div className="bg-cyan-600 px-0 px-md-5 mb-5">
        <div className="grid md:grid-cols-2 align-items-center px-3 mr-0">
          <div className="text-center basis-1/2 text-lg-left">
            <h4 className="text-white mb-4 mt-5 lg:mt-0">Kids Learning Center</h4>
            <h1 className="text-3xl md:text-5xl lg:text-7xl font-bold text-white mb-2">
              New Approach to Kids Education
            </h1>
            <p className="text-white mb-4">
              Empowering students with the knowledge, skills, and values they
              need to succeed in a complex and dynamic world. We are committed
              to academic excellence, personal growth, and social
              responsibility, and to creating a safe and inclusive learning
              environment where every student can thrive. Join us on a journey
              of discovery and transformation.
            </p>
            <a href="about" className="bg-cyan-900 rounded-3xl text-white mt-1 py-3 px-5 hover:no-underline">
              Learn More
            </a>
          </div>
          <div className="text-center basis-1/2 text-lg-right">
            <img className="img-fluid mt-5" src="img/header.png" alt="" />
          </div>
        </div>
      </div>

      <div className="container grid md:grid-cols-3 md:gap-6 pt-5">
        {facilities.map((facility, index) => <FacilitiesCard key={index} title={facility.title} description={facility.description} iconName={facility.iconName} />)}
      </div>

      <div className="container py-20 grid grid-cols-1 sm:grid-cols-3 items-center md:gap-7">
        <div className="">
          <img
            className="rounded"
            src="img/about-1.jpg"
            alt=""
          />
        </div>
        <div className="col-span-2">
          <p className="py-2 md:py-0">
            <span className="pr-2">Learn About Us</span>
          </p>
          <h1 className="mb-4 text-cyan-600 font-moto text-3xl">Best School For Your Kids</h1>
          <p>
            At Al Sufiaan School, we are dedicated to providing a nurturing
            and stimulating environment where your child can thrive
            academically, socially, and emotionally. Here are some reasons
            why we believe we are the best choice for your children
          </p>
          <div className="flex pt-3 pb-6">
            <div className="basis-1/2 md:basis-1/4 pr-4">
              <img className="rounded" src="img/about-2.jpg" alt="" />
            </div>
            <div className="basis-1/2 md:basis-3/4">
              <ul className="list-inline m-0">
                <li className="py-2 border-b">
                  <i className="fa fa-check text-cyan-600 mr-3"></i>Academic
                  Excellence & Engaging Curriculum
                </li>
                <li className="py-2 border-b">
                  <i className="fa fa-check text-cyan-600 mr-3"></i>Holistic
                  Development & Modern Facilities
                </li>
                <li className="py-2 border-b">
                  <i className="fa fa-check text-cyan-600 mr-3"></i>Safe and
                  Supportive Environment
                </li>
              </ul>
            </div>
          </div>
          <a href="/" className="bg-cyan-600 text-white py-3 px-4 rounded-3xl no-underline hover:no-underline text-sm font-semibold">
            Learn More
          </a>
        </div>
      </div>

      <div className="container grid grid-cols-1 sm:grid-cols-3 md:gap-6">
        <div className="text-center pb-2 md:col-span-3">
          <p>
            <span className=" text-sm">OUR PRINCIPLES</span>
          </p>
          <h1 className="mb-4 text-3xl text-cyan-600 font-moto">Leading with Excellence, Empowering with Knowledge</h1>
        </div>
        {principles.map((principle, index) => <PrincipleCard key={index} title={principle.title} description={principle.description} imageUrl={principle.imageUrl} />)}
      </div>
      <div className="container grid grid-cols-1 sm:grid-cols-4 md:gap-6 mt-20">
        <div className="text-center pb-2 md:col-span-4">
          <p>
            <span className=" text-sm">OUR TEACHERS</span>
          </p>
          <h1 className="mb-4 text-3xl text-cyan-600 font-moto">Meet Our Teachers</h1>
        </div>
        {teachers.map((teacher, index) => <TeacherCard key={index} name={teacher.name} designation={teacher.designation} imageUrl={teacher.imageUrl} />)}
      </div>

      <Footer />
    </div>
  );
}

export default Landing;
