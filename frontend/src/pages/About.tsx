import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";
import teachers from "../Data/Teacher";
import React from 'react'
import TeacherCard from "../components/TeacherCard";
import FacilitiesCard from "../components/FacilitiesCard";
import facilities from "../Data/facilities";

const About: React.FC = () => {
  return (
    <div>
      <Navbar />
      <PageHeader heading="About Us" />
      {/* About Start */}
      <div className="container-fluid py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-5">
              <img
                className="img-fluid rounded mb-5 mb-lg-0"
                src="img/about-1.jpg"
                alt=""
              />
            </div>
            <div className="col-lg-7">
              <p className="section-title pr-5">
                <span className="pr-2">Learn About Us</span>
              </p>
              <h1 className="mb-4 text-primary">Best School For Your Kids</h1>
              <p>
                At Al Sufiaan School, we are dedicated to providing a nurturing
                and stimulating environment where your child can thrive
                academically, socially, and emotionally. Here are some reasons
                why we believe we are the best choice for your children
              </p>
              <div className="row pt-2 pb-4">
                <div className="col-6 col-md-4">
                  <img className="img-fluid rounded" src="img/about-2.jpg" alt="" />
                </div>
                <div className="col-6 col-md-8">
                  <ul className="list-inline m-0">
                    <li className="py-2 border-top border-bottom">
                      <i className="fa fa-check text-primary mr-3"></i>Academic
                      Excellence & Engaging Curriculum
                    </li>
                    <li className="py-2 border-bottom">
                      <i className="fa fa-check text-primary mr-3"></i>Holistic
                      Development & Modern Facilities
                    </li>
                    <li className="py-2 border-bottom">
                      <i className="fa fa-check text-primary mr-3"></i>Safe and
                      Supportive Environment
                    </li>
                  </ul>
                </div>
              </div>
              <a href="" className="btn btn-primary mt-2 py-2 px-4">
                Learn More
              </a>
            </div>
          </div>
        </div>
      </div>
      {/* About End */}

      {/* Facilities Start */}
      <div className="container grid md:grid-cols-3 gap-6 pt-5">
            {facilities.map(facility => <FacilitiesCard title={facility.title} description={facility.description} iconName={facility.iconName} />)}
      </div>
      {/* Facilities Start */}
      <div className="container pt-5 grid md:grid-cols-4">
        {teachers.map(teacher => <TeacherCard name={teacher.name} designation={teacher.designation} imageUrl={teacher.imageUrl} />)}
      </div>

      <Footer />
    </div>
  );
}

export default About;
