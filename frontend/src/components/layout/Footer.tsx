function Footer() {
    return (
        <footer className="bg-cyan-900 text-gray-200 pt-5 pb-2 grid gap-5">
            <div className="container grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="grid gap-3">
                    <a href="/" className="text-3xl text-cyan-600 font-bold hover:no-underline">
                        Al Sufiaan School
                    </a>
                    <p>Empowering students with the knowledge, skills, and values they need to succeed in a
                        complex and dynamic world. We are committed to academic excellence, personal growth,
                        and social responsibility, and to creating a safe and inclusive learning environment
                        where every student can thrive. Join us on a journey of discovery and transformation.
                    </p>
                </div>
                <div className="grid gap-3">
                    <h3 className="text-cyan-600 font-3xl text-2xl font-bold">Get In Touch</h3>
                    <div className="flex items-center">
                        <h4 className="fa fa-map-marker-alt text-cyan-600"></h4>
                        <div className="pl-3">
                            <h5 className="text-white">Address</h5>
                            <p>Udhwa, Sahibganj, Jharkhand - 816108</p>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <h4 className="fa fa-envelope text-cyan-600"></h4>
                        <div className="pl-3">
                            <h5 className="text-white">Email</h5>
                            <p>adilzamal@gmail.com</p>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <h4 className="fa fa-phone-alt text-cyan-600"></h4>
                        <div className="pl-3">
                            <h5 className="text-white">Phone</h5>
                            <p>+91 9065236666</p>
                        </div>
                    </div>
                </div>
                <div className="grid gap-3">
                    <h3 className="text-cyan-600 font-3xl text-2xl font-bold">Quick Links</h3>
                    <div className="flex flex-col">
                        <a className="text-white mb-2" href="/"><i className="fa fa-angle-right mr-2"></i>Home</a>
                        <a className="text-white mb-2" href="about"><i className="fa fa-angle-right mr-2"></i>About Us</a>
                        <a className="text-white mb-2" href="team"><i className="fa fa-angle-right mr-2"></i>Our Teachers</a>
                        <a className="text-white mb-2" href="gallery"><i className="fa fa-angle-right mr-2"></i>Gallery</a>
                        <a className="text-white mb-2" href="contact"><i className="fa fa-angle-right mr-2"></i>Contact Us</a>
                        <a className="text-white" href="fees"><i className="fa fa-angle-right mr-2"></i>School Fees</a>
                    </div>
                </div>
            </div>
            <div style={{ borderTop: '1px solid rgba(23, 162, 184, .2)' }}>
                <p className="text-center text-white">
                    &copy; <a className="text-cyan-600" href="/">Alsufiaanschool.com</a>. All Rights Reserved.
                </p>
            </div>
        </footer>
    )
}

export default Footer