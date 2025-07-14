import React from "react";
import Navbar from "../../../components/layout/Navbar";
import Footer from "../../../components/layout/Footer";
import PageHeader from "../../../components/common/PageHeader";
import TeacherCard from "../components/TeacherCard"
import teachers from "../api/teacher";
const Team: React.FC = () => {
  return (
    <div>
      <Navbar />
      <PageHeader heading="Our Teachers" />
      <div className="container">
        <div className="text-center pb-2 ">
          <p className="">
            <span className=" text-sm">Our Teachers</span>
          </p>
          <h1 className="mb-4 text-3xl text-cyan-600">Meet Our Teachers</h1>
        </div>
        <div className="grid sm:grid-cols-4 gap-6">
          {teachers.map(teacher => <TeacherCard name={teacher.name} designation={teacher.designation} imageUrl={teacher.imageUrl} />)}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Team;
