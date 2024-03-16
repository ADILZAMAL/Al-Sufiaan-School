import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";
import teachers from "../Data/teacher";
import React from 'react'
import TeacherCard from "../components/TeacherCard";
import FacilitiesCard from "../components/FacilitiesCard";
import facilities from "../Data/facilities";

const About: React.FC = () => {
  return (
    <div>
      <Navbar />
      <PageHeader heading="About Us" />
      <div className="container py-20 max-w-7xl grid grid-cols-1 sm:grid-cols-3 items-center md:gap-7">
        <div className="">
          <img
            className="rounded"
            src="img/about-1.jpg"
            alt=""
          />
        </div>
        <div className="col-span-2">
          <p className="">
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
      <div className="container grid md:grid-cols-3 gap-6 pt-5">
        {facilities.map(facility => <FacilitiesCard title={facility.title} description={facility.description} iconName={facility.iconName} />)}
      </div>
      <div className="container pt-5 grid md:grid-cols-4">
        {teachers.map(teacher => <TeacherCard name={teacher.name} designation={teacher.designation} imageUrl={teacher.imageUrl} />)}
      </div>

      <Footer />
    </div>
  );
}

export default About;
