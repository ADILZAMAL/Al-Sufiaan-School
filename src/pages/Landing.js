import Header from "../Components/Header"
import Footer from "../Components/Footer"
function Landing(){
    return (
        <div>
        {/* Navbar Start */}
        <Header />
    
        {/* Navbar End */}
    
        {/* Header Start */}
        <div class="container-fluid bg-primary px-0 px-md-5 mb-5">
            <div class="row align-items-center px-3 mr-0">
                <div class="col-lg-6 text-center text-lg-left">
                    <h4 class="text-white mb-4 mt-5 mt-lg-0">Kids Learning Center</h4>
                    <h1 class="display-3 font-weight-bold text-white">New Approach to Kids Education</h1>
                    <p class="text-white mb-4">Empowering students with the knowledge, skills, and values
                         they need to succeed in a complex and dynamic world. We are committed to 
                         academic excellence, personal growth, and social responsibility, and to creating
                          a safe and inclusive learning environment where every student can thrive.
                           Join us on a journey of discovery and transformation.</p>
                    <a href="" class="btn btn-secondary mt-1 py-3 px-5">Learn More</a>
                </div>
                <div class="col-lg-6 text-center text-lg-right">
                    <img class="img-fluid mt-5" src="img/header.png" alt=""/>
                </div>
            </div>
        </div>
        {/* Header End */}
    
    
        {/* Facilities Start */}
        <div class="container-fluid pt-5">
            <div class="container pb-3">
                <div class="row">
                    <div class="col-lg-4 col-md-6 pb-1">
                        <div class="d-flex bg-light shadow-sm border-top rounded mb-4" style={{padding: '30px'}}>
                            <i class="flaticon-050-fence h1 font-weight-normal text-primary mb-3"></i>
                            <div class="pl-4">
                                <h4>Play Ground</h4>
                                <p class="m-0">Our school playground is a fun and safe space for students to play, explore, and develop their physical skills. With swings, slides, and climbing equipment, there's something for everyone to enjoy!</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 col-md-6 pb-1">
                        <div class="d-flex bg-light shadow-sm border-top rounded mb-4" style={{padding: '30px'}}>
                            <i class="flaticon-025-sandwich h1 font-weight-normal text-primary mb-3"></i>
                            <div class="pl-4">
                                <h4>Healthy food</h4>
                                <p class="m-0">Explore our delicious and nutritious school cafeteria menu, featuring fresh fruits, vegetables, whole grains, and lean protein options. Fuel your body and mind with healthy food choices every day.</p>
                            </div>
                        </div>
                    </div>
                   
                    <div class="col-lg-4 col-md-6 pb-1">
                        <div class="d-flex bg-light shadow-sm border-top rounded mb-4" style={{padding: '30px'}}>
                            <i class="flaticon-030-crayons h1 font-weight-normal text-primary mb-3"></i>
                            <div class="pl-4">
                                <h4>Arts and Crafts</h4>
                                <p class="m-0">Discover your creativity through our arts and crafts section! Join us to explore a variety of fun and exciting projects, from painting to paper crafts, and unleash your imagination.</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 col-md-6 pb-1">
                        <div class="d-flex bg-light shadow-sm border-top rounded mb-4" style={{padding: '30px'}}>
                            <i class="flaticon-017-toy-car h1 font-weight-normal text-primary mb-3"></i>
                            <div class="pl-4">
                                <h4>Safe Transportation</h4>
                                <p class="m-0">Our top priority is the safety of our students during transportation. Our school buses are regularly inspected and operated by trained drivers to ensure a safe journey for all.</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 col-md-6 pb-1">
                        <div class="d-flex bg-light shadow-sm border-top rounded mb-4" style={{padding: '30px'}}>
                            <i class="flaticon-022-drum h1 font-weight-normal text-primary mb-3"></i>
                            <div class="pl-4">
                                <h4>Music and Dance</h4>
                                <p class="m-0">Discover your rhythm and move to the beat in our vibrant music and dance classes. From ballet to hip-hop, there's something for everyone to express themselves creatively.</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 col-md-6 pb-1">
                        <div class="d-flex bg-light shadow-sm border-top rounded mb-4" style={{padding: '30px'}}>
                            <i class="flaticon-014-blackboard h1 font-weight-normal text-primary mb-3"></i>
                            <div class="pl-4">
                                <h4>Computer Lab</h4>
                                <p class="m-0">The computer lab offers access to up-to-date technology and software for students. Lab sessions are supervised by knowledgeable staff and follow strict safety protocols.</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 col-md-6 pb-1">
                        <div class="d-flex bg-light shadow-sm border-top rounded mb-4" style={{padding: '30px'}}>
                            <i class="flaticon-047-backpack h1 font-weight-normal text-primary mb-3"></i>
                            <div class="pl-4">
                                <h4>Comfortable and clean living spaces</h4>
                                <p class="m-0">Our school provides comfortable and clean living spaces for students. Our accommodations are well-maintained, spacious, and equipped with essential amenities to ensure a pleasant stay for our students.</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 col-md-6 pb-1">
                        <div class="d-flex bg-light shadow-sm border-top rounded mb-4" style={{padding: '30px'}}>
                            <i class="flaticon-025-sandwich h1 font-weight-normal text-primary mb-3"></i>
                            <div class="pl-4">
                                <h4>Safe and secure campus</h4>
                                <p class="m-0">Our campus is committed to providing a safe and secure environment for all students and staff. We have implemented comprehensive safety protocols and regularly review and update them to ensure the well-being of our community.</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 col-md-6 pb-1">
                        <div class="d-flex bg-light shadow-sm border-top rounded mb-4" style={{padding: '30px'}}>
                            <i class="flaticon-047-backpack h1 font-weight-normal text-primary mb-3"></i>
                            <div class="pl-4">
                                <h4>Experienced and qualified teachers</h4>
                                <p class="m-0">Our experienced and qualified teachers are dedicated to providing a supportive and enriching learning environment. They bring years of expertise, passion and commitment to every lesson, ensuring each student reaches their full potential.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        {/* Facilities Start */}
    
    
         {/* About Start */}
        <div class="container-fluid py-5">
            <div class="container">
                <div class="row align-items-center">
                    <div class="col-lg-5">
                        <img class="img-fluid rounded mb-5 mb-lg-0" src="img/about-1.jpg" alt=""/>
                    </div>
                    <div class="col-lg-7">
                        <p class="section-title pr-5"><span class="pr-2">Learn About Us</span></p>
                        <h1 class="mb-4">Best School For Your Kids</h1>
                        <p>At Al Sufiaan School, we are dedicated to providing a nurturing and stimulating environment where your child 
                            can thrive academically, socially, and emotionally. Here are some reasons why we believe we are the best 
                            choice for your children
                        </p>
                        <div class="row pt-2 pb-4">
                            <div class="col-6 col-md-4">
                                <img class="img-fluid rounded" src="img/about-2.jpg" alt=""/>
                            </div>
                            <div class="col-6 col-md-8">
                                <ul class="list-inline m-0">
                                    <li class="py-2 border-top border-bottom"><i class="fa fa-check text-primary mr-3"></i>Academic Excellence & Engaging Curriculum</li>
                                    <li class="py-2 border-bottom"><i class="fa fa-check text-primary mr-3"></i>Holistic Development & Modern Facilities</li>
                                    <li class="py-2 border-bottom"><i class="fa fa-check text-primary mr-3"></i>Safe and Supportive Environment</li>
                                </ul>
                            </div>
                        </div>
                        <a href="" class="btn btn-primary mt-2 py-2 px-4">Learn More</a>
                    </div>
                </div>
            </div>
        </div>
        {/* About End */}
    
    
        {/* Class Start */}
        <div class="container-fluid pt-5">
            <div class="container">
                <div class="text-center pb-2">
                    <p class="section-title px-5"><span class="px-2">Our Principles</span></p>
                    <h1 class="mb-4">Leading with Excellence, Empowering with Knowledge</h1>
                </div>
                <div class="row">
                    <div class="col-lg-4 mb-5">
                        <div class="card border-0 bg-light shadow-sm pb-2">
                            <img class="card-img-top mb-2" src="img/class-1.jpg" alt=""/>
                            <div class="card-body text-center">
                                <h4 class="card-title">Learning & Fun</h4>
                                <p class="card-text">At our school, we believe in the principles of "Learning and Fun." We strive to create an environment where education is a joyful and engaging experience for our students. Our innovative teaching methods, interactive lessons, and exciting activities foster a love for learning while ensuring academic growth. Join us on this exciting journey of exploration and knowledge!</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 mb-5">
                        <div class="card border-0 bg-light shadow-sm pb-2">
                            <img class="card-img-top mb-2" src="img/class-2.jpg" alt=""/>
                            <div class="card-body text-center">
                                <h4 class="card-title">Children Safety</h4>
                                <p class="card-text">The safety of our students is our top priority. We adhere to strict safety protocols to create a secure and nurturing environment. From well-trained staff to advanced security systems, we ensure a safe space where children can learn, grow, and thrive with peace of mind.</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 mb-5">
                        <div class="card border-0 bg-light shadow-sm pb-2">
                            <img class="card-img-top mb-2" src="img/class-3.jpg" alt=""/>
                            <div class="card-body text-center">
                                <h4 class="card-title">Cute Environment</h4>
                                <p class="card-text">We believe in creating a "Cute Environment" for our students. We take pride in providing a warm, welcoming, and visually appealing atmosphere that promotes a sense of comfort and happiness. Our vibrant classrooms, colorful decor, and friendly staff create a nurturing space where students can thrive and feel inspired to learn. Come and experience the cuteness at our school!</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      {/* Class End */}
    
    {/* Team Start */}
        <div class="container-fluid pt-5">
            <div class="container">
                <div class="text-center pb-2">
                    <p class="section-title px-5"><span class="px-2">Our Teachers</span></p>
                    <h1 class="mb-4">Meet Our Teachers</h1>
                </div>
                <div class="row">
                    <div class="col-md-6 col-lg-3 text-center team mb-5">
                        <div class="position-relative overflow-hidden mb-4" style={{borderRadius: '100%'}}>
                            <img class="img-fluid w-100" src="img/team-8.jpg" alt="" />
                        </div>
                        <h4>Subham Kumar</h4>
                        <i>Vice Principal</i>
                    </div>
                    <div class="col-md-6 col-lg-3 text-center team mb-5">
                        <div class="position-relative overflow-hidden mb-4" style={{borderRadius: '100%'}}>
                        <img class="img-fluid w-100" src="img/team-5.jpg" alt="" />
                        </div>
                        <h4>Navin Thakur</h4>
                        <i>Social Science Teacher</i>
                    </div>
                    <div class="col-md-6 col-lg-3 text-center team mb-5">
                        <div class="position-relative overflow-hidden mb-4" style={{borderRadius: '100%'}}>
                            <img class="img-fluid w-100" src="img/team-3.jpg" alt="" />
                        </div>
                        <h4>Md Firoz Akhtar</h4>
                        <i>Math Teacher</i>
                    </div>
                    <div class="col-md-6 col-lg-3 text-center team mb-5">
                        <div class="position-relative overflow-hidden mb-4" style={{borderRadius: '100%'}}>
                            <img class="img-fluid w-100" src="img/team-2.jpg" alt="" />
                        </div>
                        <h4>Sajiya parween</h4>
                        <i>Pre Primary Teacher</i>
                    </div>
    
                </div>
                <div class="row">
                    <div class="col-md-6 col-lg-3 text-center team mb-5">
                        <div class="position-relative overflow-hidden mb-4" style={{borderRadius: '100%'}}>
                            <img class="img-fluid w-100" src="img/team-1.jpg" alt="" />
                        </div>
                        <h4>Laxmi Kumari</h4>
                        <i>Pre Primary Teacher</i>
                    </div>   
                    <div class="col-md-6 col-lg-3 text-center team mb-5">
                        <div class="position-relative overflow-hidden mb-4" style={{borderRadius: '100%'}}>
                            <img class="img-fluid w-100" src="img/team-4.jpg" alt="" />
                        </div>
                        <h4>Isha Swarnkar</h4>
                        <i>Primary Teacher</i>
                    </div>
                    <div class="col-md-6 col-lg-3 text-center team mb-5">
                        <div class="position-relative overflow-hidden mb-4" style={{borderRadius: '100%'}}>
                            <img class="img-fluid w-100" src="img/team-6.jpg" alt="" />
                        </div>
                        <h4>Atika Parween</h4>
                        <i>Pre Primary Teacher</i>
                    </div>
                    <div class="col-md-6 col-lg-3 text-center team mb-5">
                        <div class="position-relative overflow-hidden mb-4" style={{borderRadius: '100%'}}>
                            <img class="img-fluid w-100" src="img/team-7.jpg" alt="" />
                        </div>
                        <h4>Asma Khatun</h4>
                        <i>Pre Primary Teacher</i>
                    </div>
                    
                </div>
                <div class="row">
                    <div class="col-md-6 col-lg-3 text-center team mb-5">
                        <div class="position-relative overflow-hidden mb-4" style={{borderRadius: '100%'}}>
                            <img class="img-fluid w-100" src="img/team-9.jpg" alt="" />
                        </div>
                        <h4>Shamima Khatun</h4>
                        <i>Primary Teacher</i>
                    </div>
                    <div class="col-md-6 col-lg-3 text-center team mb-5">
                        <div class="position-relative overflow-hidden mb-4" style={{borderRadius: '100%'}}>
                            <img class="img-fluid w-100" src="img/team-10.jpg" alt="" />
                        </div>
                        <h4>Govind Sah</h4>
                        <i>Primary Teacher</i>
                    </div>
                    <div class="col-md-6 col-lg-3 text-center team mb-5">
                        <div class="position-relative overflow-hidden mb-4" style={{borderRadius: '100%'}}>
                            <img class="img-fluid w-100" src="img/team-11.jpg" alt="" />
                        </div>
                        <h4>Arya Divakar</h4>
                        <i>Primary Teacher</i>
                    </div>
                    <div class="col-md-6 col-lg-3 text-center team mb-5">
                        <div class="position-relative overflow-hidden mb-4" style={{borderRadius: '100%'}}>
                            <img class="img-fluid w-100" src="img/team-12.jpg" alt="" />
                        </div>
                        <h4>Khurshida Parween</h4>
                        <i>Admin</i>
                    </div>
                </div>
            </div>
        </div>
        {/* Team End */}
        <Footer />
        {/* Back to Top */}
        <a href="#" class="btn btn-primary p-3 back-to-top"><i class="fa fa-angle-double-up"></i></a>
        </div>
    )
}

export default Landing