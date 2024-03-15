import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";
function Team() {
  return (
    <div>
      <Navbar />
      <PageHeader heading="Our Teachers" />
      {/* <!-- Team Start --> */}
      <div className="container-fluid pt-5">
        <div className="container">
          <div className="text-center pb-2">
            <p className="section-title px-5">
              <span className="px-2">Our Teachers</span>
            </p>
            <h1 className="mb-4">Meet Our Teachers</h1>
          </div>
          <div className="row">
            <div className="col-md-6 col-lg-3 text-center team mb-5">
              <div
                className="position-relative overflow-hidden mb-4"
                style={{ borderRadius: "100%" }}
              >
                <img className="img-fluid w-100" src="img/team-8.jpg" alt="" />
              </div>
              <h4 className="text-primary">Subham Kumar</h4>
              <i>Vice Principal</i>
            </div>
            <div className="col-md-6 col-lg-3 text-center team mb-5">
              <div
                className="position-relative overflow-hidden mb-4"
                style={{ borderRadius: "100%" }}
              >
                <img className="img-fluid w-100" src="img/team-5.jpg" alt="" />
              </div>
              <h4 className="text-primary">Navin Thakur</h4>
              <i>Social Science Teacher</i>
            </div>
            <div className="col-md-6 col-lg-3 text-center team mb-5">
              <div
                className="position-relative overflow-hidden mb-4"
                style={{ borderRadius: "100%" }}
              >
                <img className="img-fluid w-100" src="img/team-3.jpg" alt="" />
              </div>
              <h4 className="text-primary">Md Firoz Akhtar</h4>
              <i>Math Teacher</i>
            </div>
            <div className="col-md-6 col-lg-3 text-center team mb-5">
              <div
                className="position-relative overflow-hidden mb-4"
                style={{ borderRadius: "100%" }}
              >
                <img className="img-fluid w-100" src="img/team-2.jpg" alt="" />
              </div>
              <h4 className="text-primary">Sajiya parween</h4>
              <i>Pre Primary Teacher</i>
            </div>
          </div>
          <div className="row">
            <div className="col-md-6 col-lg-3 text-center team mb-5">
              <div
                className="position-relative overflow-hidden mb-4"
                style={{ borderRadius: "100%" }}
              >
                <img className="img-fluid w-100" src="img/team-1.jpg" alt="" />
              </div>
              <h4 className="text-primary">Laxmi Kumari</h4>
              <i>Pre Primary Teacher</i>
            </div>
            <div className="col-md-6 col-lg-3 text-center team mb-5">
              <div
                className="position-relative overflow-hidden mb-4"
                style={{ borderRadius: "100%" }}
              >
                <img className="img-fluid w-100" src="img/team-4.jpg" alt="" />
              </div>
              <h4 className="text-primary">Isha Swarnkar</h4>
              <i>Primary Teacher</i>
            </div>
            <div className="col-md-6 col-lg-3 text-center team mb-5">
              <div
                className="position-relative overflow-hidden mb-4"
                style={{ borderRadius: "100%" }}
              >
                <img className="img-fluid w-100" src="img/team-6.jpg" alt="" />
              </div>
              <h4 className="text-primary">Atika Parween</h4>
              <i>Pre Primary Teacher</i>
            </div>
            <div className="col-md-6 col-lg-3 text-center team mb-5">
              <div
                className="position-relative overflow-hidden mb-4"
                style={{ borderRadius: "100%" }}
              >
                <img className="img-fluid w-100" src="img/team-7.jpg" alt="" />
              </div>
              <h4 className="text-primary">Asma Khatun</h4>
              <i>Pre Primary Teacher</i>
            </div>
          </div>
          <div className="row">
            <div className="col-md-6 col-lg-3 text-center team mb-5">
              <div
                className="position-relative overflow-hidden mb-4"
                style={{ borderRadius: "100%" }}
              >
                <img className="img-fluid w-100" src="img/team-9.jpg" alt="" />
              </div>
              <h4 className="text-primary">Shamima Khatun</h4>
              <i>Primary Teacher</i>
            </div>
            <div className="col-md-6 col-lg-3 text-center team mb-5">
              <div
                className="position-relative overflow-hidden mb-4"
                style={{ borderRadius: "100%" }}
              >
                <img className="img-fluid w-100" src="img/team-10.jpg" alt="" />
              </div>
              <h4 className="text-primary">Govind Sah</h4>
              <i>Primary Teacher</i>
            </div>
            <div className="col-md-6 col-lg-3 text-center team mb-5">
              <div
                className="position-relative overflow-hidden mb-4"
                style={{ borderRadius: "100%" }}
              >
                <img className="img-fluid w-100" src="img/team-11.jpg" alt="" />
              </div>
              <h4 className="text-primary">Arya Divakar</h4>
              <i>Primary Teacher</i>
            </div>
            <div className="col-md-6 col-lg-3 text-center team mb-5">
              <div
                className="position-relative overflow-hidden mb-4"
                style={{ borderRadius: "100%" }}
              >
                <img className="img-fluid w-100" src="img/team-12.jpg" alt="" />
              </div>
              <h4 className="text-primary">Khurshida Parween</h4>
              <i>Admin</i>
            </div>
          </div>
        </div>
      </div>
      {/* <!-- Team End --> */}
      <Footer />

      {/* <!-- Back to Top --> */}
      <a href="#" className="btn btn-primary p-3 back-to-top">
        <i className="fa fa-angle-double-up"></i>
      </a>
    </div>
  );
}

export default Team;
