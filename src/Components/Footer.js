function Footer() {
    return (
        <div class="container-fluid bg-secondary text-white mt-5 py-5 px-sm-3 px-md-5">
            <div class="row pt-5">
                <div class="col-lg-4 col-md-6 mb-5">
                    <a href="" class="navbar-brand font-weight-bold text-primary m-0 mb-4 p-0" style={{ fontSize: '40px', lineHeight: '40px' }}>
                        <span class="text-primary">Al Sufiaan School</span>
                    </a>
                    <p>Empowering students with the knowledge, skills, and values they need to succeed in a complex and dynamic world. We are committed to academic excellence, personal growth, and social responsibility, and to creating a safe and inclusive learning environment where every student can thrive. Join us on a journey of discovery and transformation.</p>
                </div>
                <div class="col-lg-4 col-md-6 mb-5">
                    <h3 class="text-primary mb-4">Get In Touch</h3>
                    <div class="d-flex">
                        <h4 class="fa fa-map-marker-alt text-primary"></h4>
                        <div class="pl-3">
                            <h5 class="text-white">Address</h5>
                            <p>Udhwa, Sahibganj, Jharkhand - 816108</p>
                        </div>
                    </div>
                    <div class="d-flex">
                        <h4 class="fa fa-envelope text-primary"></h4>
                        <div class="pl-3">
                            <h5 class="text-white">Email</h5>
                            <p>adilzamal@gmail.com</p>
                        </div>
                    </div>
                    <div class="d-flex">
                        <h4 class="fa fa-phone-alt text-primary"></h4>
                        <div class="pl-3">
                            <h5 class="text-white">Phone</h5>
                            <p>+91 9065236666</p>
                        </div>
                    </div>
                </div>
                <div class="col-lg-4 col-md-6 mb-5">
                    <h3 class="text-primary mb-4">Quick Links</h3>
                    <div class="d-flex flex-column justify-content-start">
                        <a class="text-white mb-2" href="#"><i class="fa fa-angle-right mr-2"></i>Home</a>
                        <a class="text-white mb-2" href="#"><i class="fa fa-angle-right mr-2"></i>About Us</a>
                        <a class="text-white mb-2" href="#"><i class="fa fa-angle-right mr-2"></i>Our Teachers</a>
                        <a class="text-white" href="#"><i class="fa fa-angle-right mr-2"></i>Contact Us</a>
                    </div>
                </div>
            </div>
            <div class="container-fluid pt-5" style={{ borderTop: '1px solid rgba(23, 162, 184, .2)' }}>
                <p class="m-0 text-center text-white">
                    &copy; <a class="text-primary font-weight-bold" href="#">Alsufiaanschool.com</a>. All Rights Reserved.
                </p>
            </div>
        </div>
    )
}

export default Footer