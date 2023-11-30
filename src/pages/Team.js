import Header from "../Components/Header"
import Footer from "../Components/Footer"
function Team() {
    return (
        <div>
            <Header />
            {/* <!-- Header Start --> */}
            <div class="container-fluid bg-primary mb-5">
                <div class="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '400px' }}>
                    <h3 class="display-3 font-weight-bold text-white">Our Teachers</h3>
                    <div class="d-inline-flex text-white">
                        <p class="m-0"><a class="text-white" href="">Home</a></p>
                        <p class="m-0 px-2">/</p>
                        <p class="m-0">Our Teachers</p>
                    </div>
                </div>
            </div>
            {/* <!-- Header End --> */}


            {/* <!-- Team Start --> */}
            <div class="container-fluid pt-5">
                <div class="container">
                    <div class="text-center pb-2">
                        <p class="section-title px-5"><span class="px-2">Our Teachers</span></p>
                        <h1 class="mb-4">Meet Our Teachers</h1>
                    </div>
                    <div class="row">
                        <div class="col-md-6 col-lg-3 text-center team mb-5">
                            <div class="position-relative overflow-hidden mb-4" style={{ borderRadius: '100%' }}>
                                <img class="img-fluid w-100" src="img/team-8.jpg" alt="" />
                            </div>
                            <h4>Subham Kumar</h4>
                            <i>Vice Principal</i>
                        </div>
                        <div class="col-md-6 col-lg-3 text-center team mb-5">
                            <div class="position-relative overflow-hidden mb-4" style={{ borderRadius: '100%' }}>
                                <img class="img-fluid w-100" src="img/team-5.jpg" alt="" />
                            </div>
                            <h4>Navin Thakur</h4>
                            <i>Social Science Teacher</i>
                        </div>
                        <div class="col-md-6 col-lg-3 text-center team mb-5">
                            <div class="position-relative overflow-hidden mb-4" style={{ borderRadius: '100%' }}>
                                <img class="img-fluid w-100" src="img/team-3.jpg" alt="" />
                            </div>
                            <h4>Md Firoz Akhtar</h4>
                            <i>Math Teacher</i>
                        </div>
                        <div class="col-md-6 col-lg-3 text-center team mb-5">
                            <div class="position-relative overflow-hidden mb-4" style={{ borderRadius: '100%' }}>
                                <img class="img-fluid w-100" src="img/team-2.jpg" alt="" />
                            </div>
                            <h4>Sajiya parween</h4>
                            <i>Pre Primary Teacher</i>
                        </div>

                    </div>
                    <div class="row">
                        <div class="col-md-6 col-lg-3 text-center team mb-5">
                            <div class="position-relative overflow-hidden mb-4" style={{ borderRadius: '100%' }}>
                                <img class="img-fluid w-100" src="img/team-1.jpg" alt="" />
                            </div>
                            <h4>Laxmi Kumari</h4>
                            <i>Pre Primary Teacher</i>
                        </div>
                        <div class="col-md-6 col-lg-3 text-center team mb-5">
                            <div class="position-relative overflow-hidden mb-4" style={{ borderRadius: '100%' }}>
                                <img class="img-fluid w-100" src="img/team-4.jpg" alt="" />
                            </div>
                            <h4>Isha Swarnkar</h4>
                            <i>Primary Teacher</i>
                        </div>
                        <div class="col-md-6 col-lg-3 text-center team mb-5">
                            <div class="position-relative overflow-hidden mb-4" style={{ borderRadius: '100%' }}>
                                <img class="img-fluid w-100" src="img/team-6.jpg" alt="" />
                            </div>
                            <h4>Atika Parween</h4>
                            <i>Pre Primary Teacher</i>
                        </div>
                        <div class="col-md-6 col-lg-3 text-center team mb-5">
                            <div class="position-relative overflow-hidden mb-4" style={{ borderRadius: '100%' }}>
                                <img class="img-fluid w-100" src="img/team-7.jpg" alt="" />
                            </div>
                            <h4>Asma Khatun</h4>
                            <i>Pre Primary Teacher</i>
                        </div>

                    </div>
                    <div class="row">
                        <div class="col-md-6 col-lg-3 text-center team mb-5">
                            <div class="position-relative overflow-hidden mb-4" style={{ borderRadius: '100%' }}>
                                <img class="img-fluid w-100" src="img/team-9.jpg" alt="" />
                            </div>
                            <h4>Shamima Khatun</h4>
                            <i>Primary Teacher</i>
                        </div>
                        <div class="col-md-6 col-lg-3 text-center team mb-5">
                            <div class="position-relative overflow-hidden mb-4" style={{ borderRadius: '100%' }}>
                                <img class="img-fluid w-100" src="img/team-10.jpg" alt="" />
                            </div>
                            <h4>Govind Sah</h4>
                            <i>Primary Teacher</i>
                        </div>
                        <div class="col-md-6 col-lg-3 text-center team mb-5">
                            <div class="position-relative overflow-hidden mb-4" style={{ borderRadius: '100%' }}>
                                <img class="img-fluid w-100" src="img/team-11.jpg" alt="" />
                            </div>
                            <h4>Arya Divakar</h4>
                            <i>Primary Teacher</i>
                        </div>
                        <div class="col-md-6 col-lg-3 text-center team mb-5">
                            <div class="position-relative overflow-hidden mb-4" style={{ borderRadius: '100%' }}>
                                <img class="img-fluid w-100" src="img/team-12.jpg" alt="" />
                            </div>
                            <h4>Khurshida Parween</h4>
                            <i>Admin</i>
                        </div>
                    </div>
                </div>
            </div>
            {/* <!-- Team End --> */}
            <Footer />

            {/* <!-- Back to Top --> */}
            <a href="#" class="btn btn-primary p-3 back-to-top"><i class="fa fa-angle-double-up"></i></a>
        </div>
    )
}

export default Team