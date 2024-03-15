import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";

function About() {
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
      <div className="container-fluid pt-5">
        <div className="container pb-3">
          <div className="row">
            <div className="col-lg-4 col-md-6 pb-1">
              <div
                className="d-flex bg-light shadow-sm border-top rounded mb-4"
                style={{ padding: "30px" }}
              >
                <i className="flaticon-050-fence h1 font-weight-normal text-primary mb-3"></i>
                <div className="pl-4">
                  <h4>Play Ground</h4>
                  <p className="m-0 text-secondary">
                    Our school playground is a fun and safe space for students
                    to play, explore, and develop their physical skills. With
                    swings, slides, and climbing equipment, there's something
                    for everyone to enjoy!
                  </p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6 pb-1">
              <div
                className="d-flex bg-light shadow-sm border-top rounded mb-4"
                style={{ padding: "30px" }}
              >
                <i className="flaticon-025-sandwich h1 font-weight-normal text-primary mb-3"></i>
                <div className="pl-4">
                  <h4>Healthy food</h4>
                  <p className="m-0 text-secondary">
                    Explore our delicious and nutritious school cafeteria menu,
                    featuring fresh fruits, vegetables, whole grains, and lean
                    protein options. Fuel your body and mind with healthy food
                    choices every day.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-lg-4 col-md-6 pb-1">
              <div
                className="d-flex bg-light shadow-sm border-top rounded mb-4"
                style={{ padding: "30px" }}
              >
                <i className="flaticon-030-crayons h1 font-weight-normal text-primary mb-3"></i>
                <div className="pl-4">
                  <h4>Arts and Crafts</h4>
                  <p className="m-0 text-secondary">
                    Discover your creativity through our arts and crafts
                    section! Join us to explore a variety of fun and exciting
                    projects, from painting to paper crafts, and unleash your
                    imagination.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6 pb-1">
              <div
                className="d-flex bg-light shadow-sm border-top rounded mb-4"
                style={{ padding: "30px" }}
              >
                <i className="flaticon-017-toy-car h1 font-weight-normal text-primary mb-3"></i>
                <div className="pl-4">
                  <h4>Safe Transportation</h4>
                  <p className="m-0 text-secondary">
                    Our top priority is the safety of our students during
                    transportation. Our school buses are regularly inspected and
                    operated by trained drivers to ensure a safe journey for
                    all.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6 pb-1">
              <div
                className="d-flex bg-light shadow-sm border-top rounded mb-4"
                style={{ padding: "30px" }}
              >
                <i className="flaticon-022-drum h1 font-weight-normal text-primary mb-3"></i>
                <div className="pl-4">
                  <h4>Music and Dance</h4>
                  <p className="m-0 text-secondary">
                    Discover your rhythm and move to the beat in our vibrant
                    music and dance classes. From ballet to hip-hop, there's
                    something for everyone to express themselves creatively.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6 pb-1">
              <div
                className="d-flex bg-light shadow-sm border-top rounded mb-4"
                style={{ padding: "30px" }}
              >
                <i className="flaticon-014-blackboard h1 font-weight-normal text-primary mb-3"></i>
                <div className="pl-4">
                  <h4>Computer Lab</h4>
                  <p className="m-0 text-secondary">
                    The computer lab offers access to up-to-date technology and
                    software for students. Lab sessions are supervised by
                    knowledgeable staff and follow strict safety protocols.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6 pb-1">
              <div
                className="d-flex bg-light shadow-sm border-top rounded mb-4"
                style={{ padding: "30px" }}
              >
                <i className="flaticon-047-backpack h1 font-weight-normal text-primary mb-3"></i>
                <div className="pl-4">
                  <h4>Comfortable and clean living spaces</h4>
                  <p className="m-0 text-secondary">
                    Our school provides comfortable and clean living spaces for
                    students. Our accommodations are well-maintained, spacious,
                    and equipped with essential amenities to ensure a pleasant
                    stay for our students.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6 pb-1">
              <div
                className="d-flex bg-light shadow-sm border-top rounded mb-4"
                style={{ padding: "30px" }}
              >
                <i className="flaticon-025-sandwich h1 font-weight-normal text-primary mb-3"></i>
                <div className="pl-4">
                  <h4>Safe and secure campus</h4>
                  <p className="m-0 text-secondary">
                    Our campus is committed to providing a safe and secure
                    environment for all students and staff. We have implemented
                    comprehensive safety protocols and regularly review and
                    update them to ensure the well-being of our community.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6 pb-1">
              <div
                className="d-flex bg-light shadow-sm border-top rounded mb-4"
                style={{ padding: "30px" }}
              >
                <i className="flaticon-047-backpack h1 font-weight-normal text-primary mb-3"></i>
                <div className="pl-4">
                  <h4>Experienced and qualified teachers</h4>
                  <p className="m-0 text-secondary">
                    Our experienced and qualified teachers are dedicated to
                    providing a supportive and enriching learning environment.
                    They bring years of expertise, passion and commitment to
                    every lesson, ensuring each student reaches their full
                    potential.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Facilities Start */}

      {/* Team Start */}
      <div className="container-fluid pt-5">
        <div className="container">
          <div className="text-center pb-2">
            <p className="section-title px-5">
              <span className="px-2">Our Teachers</span>
            </p>
            <h1 className="mb-4 text-primary">Meet Our Teachers</h1>
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
      {/* Team End */}

      <Footer />

      {/* Back to Top */}
      <a href="#" className="btn btn-primary p-3 back-to-top">
        <i className="fa fa-angle-double-up"></i>
      </a>
    </div>
  );
}

export default About;
