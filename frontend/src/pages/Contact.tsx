import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";
function Contact() {
  return (
    <div>
      <Navbar />
      <PageHeader heading="Contact Us"/>

      {/* <!-- Contact Start --> */}
      <div className="container-fluid pt-5">
        <div className="container">
          <div className="text-center pb-2">
            <p className="section-title px-5">
              <span className="px-2">Get In Touch</span>
            </p>
            <h1 className="mb-4 text-primary">Contact Us For Any Query</h1>
          </div>
          <div className="row d-flex justify-content-center">
            <div className="col-lg-5 mb-5">
              {/* <p>Labore sea amet kasd diam justo amet ut vero justo. Ipsum ut et kasd duo sit, ipsum sea et erat est dolore, magna ipsum et magna elitr. Accusam accusam lorem magna, eos et sed eirmod dolor est eirmod eirmod amet.</p> */}
              <div className="d-flex">
                <i
                  className="fa fa-map-marker-alt d-inline-flex align-items-center justify-content-center bg-primary text-secondary rounded-circle"
                  style={{ width: "45px", height: "45px" }}
                />
                <div className="pl-3">
                  <h5 className="text-primary">Address</h5>
                  <p>Udhwa, Sahibganj, Jharkhand - 816108</p>
                </div>
              </div>
              <div className="d-flex">
                <i
                  className="fa fa-envelope d-inline-flex align-items-center justify-content-center bg-primary text-secondary rounded-circle"
                  style={{ width: "45px", height: "45px" }}
                />
                <div className="pl-3">
                  <h5 className="text-primary">Email</h5>
                  <p>adilzamal@gmail.com</p>
                </div>
              </div>
              <div className="d-flex">
                <i
                  className="fa fa-phone-alt d-inline-flex align-items-center justify-content-center bg-primary text-secondary rounded-circle"
                  style={{ width: "45px", height: "45px" }}
                />
                <div className="pl-3">
                  <h5 className="text-primary">Phone</h5>
                  <p>+91 9065236666</p>
                </div>
              </div>
              <div className="d-flex">
                <i
                  className="far fa-clock d-inline-flex align-items-center justify-content-center bg-primary text-secondary rounded-circle"
                  style={{ width: "45px", height: "45px" }}
                />
                <div className="pl-3">
                  <h5 className="text-primary">Opening Hours</h5>
                  <strong>Monday - Saturday:</strong>
                  <p className="m-0">07:00 AM - 01:30 PM & 3PM - 08:00 PM </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* <!-- Contact End --> */}

      <Footer />
      {/* <!-- Back to Top --> */}
      <a href="#" className="btn btn-primary p-3 back-to-top">
        <i className="fa fa-angle-double-up"></i>
      </a>
    </div>
  );
}

export default Contact;
