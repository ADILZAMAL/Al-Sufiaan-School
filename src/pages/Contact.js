import Header from "../Components/Header"
import Footer from "../Components/Footer"
function Contact() {
    return (
        <div>
            <Header />
            {/* <!-- Header Start --> */}
            <div class="container-fluid bg-primary mb-5">
                <div class="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '400px' }}>
                    <h3 class="display-3 font-weight-bold text-white">Contact Us</h3>
                    <div class="d-inline-flex text-white">
                        <p class="m-0"><a class="text-white" href="">Home</a></p>
                        <p class="m-0 px-2">/</p>
                        <p class="m-0">Contact Us</p>
                    </div>
                </div>
            </div>
            {/* <!-- Header End --> */}


            {/* <!-- Contact Start --> */}
            <div class="container-fluid pt-5">
                <div class="container">
                    <div class="text-center pb-2">
                        <p class="section-title px-5"><span class="px-2">Get In Touch</span></p>
                        <h1 class="mb-4">Contact Us For Any Query</h1>
                    </div>
                    <div class="row d-flex justify-content-center">
                        <div class="col-lg-5 mb-5">
                            {/* <p>Labore sea amet kasd diam justo amet ut vero justo. Ipsum ut et kasd duo sit, ipsum sea et erat est dolore, magna ipsum et magna elitr. Accusam accusam lorem magna, eos et sed eirmod dolor est eirmod eirmod amet.</p> */}
                            <div class="d-flex">
                                <i class="fa fa-map-marker-alt d-inline-flex align-items-center justify-content-center bg-primary text-secondary rounded-circle" style={{ width: '45px', height: '45px' }} />
                                <div class="pl-3">
                                    <h5>Address</h5>
                                    <p>Udhwa, Sahibganj, Jharkhand - 816108</p>
                                </div>
                            </div>
                            <div class="d-flex">
                                <i class="fa fa-envelope d-inline-flex align-items-center justify-content-center bg-primary text-secondary rounded-circle" style={{ width: '45px', height: '45px' }} />
                                <div class="pl-3">
                                    <h5>Email</h5>
                                    <p>adilzamal@gmail.com</p>
                                </div>
                            </div>
                            <div class="d-flex">
                                <i class="fa fa-phone-alt d-inline-flex align-items-center justify-content-center bg-primary text-secondary rounded-circle" style={{ width: '45px', height: '45px' }} />
                                <div class="pl-3">
                                    <h5>Phone</h5>
                                    <p>+91 9065236666</p>
                                </div>
                            </div>
                            <div class="d-flex">
                                <i class="far fa-clock d-inline-flex align-items-center justify-content-center bg-primary text-secondary rounded-circle" style={{ width: '45px', height: '45px' }} />
                                <div class="pl-3">
                                    <h5>Opening Hours</h5>
                                    <strong>Monday - Saturday:</strong>
                                    <p class="m-0">07:00 AM - 01:30 PM & 3PM - 08:00 PM </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* <!-- Contact End --> */}

            <Footer />
            {/* <!-- Back to Top --> */}
            <a href="#" class="btn btn-primary p-3 back-to-top"><i class="fa fa-angle-double-up"></i></a>
        </div>
    )
}

export default Contact