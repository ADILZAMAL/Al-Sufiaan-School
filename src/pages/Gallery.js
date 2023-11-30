import Header from "../Components/Header"
import Footer from "../Components/Footer"

function Gallery(){
    return (
<div>
        <Header />

    {/* <!-- Header Start --> */}
    <div class="container-fluid bg-primary mb-5">
        <div class="d-flex flex-column align-items-center justify-content-center" style={{minHeight: '400px'}}>
            <h3 class="display-3 font-weight-bold text-white">Gallery</h3>
            <div class="d-inline-flex text-white">
                <p class="m-0"><a class="text-white" href="">Home</a></p>
                <p class="m-0 px-2">/</p>
                <p class="m-0">Gallery</p>
            </div>
        </div>
    </div>
    {/* <!-- Header End --> */}


    {/* <!-- Gallery Start --> */}
    <div class="container-fluid pt-5 pb-3">
        <div class="container">
            <div class="text-center pb-2">
                <p class="section-title px-5"><span class="px-2">Our Gallery</span></p>
                <h1 class="mb-4">Our Kids School Gallery</h1>
            </div>
            <div class="row portfolio-container">
                    <div class="col-lg-4 col-md-6 mb-4 portfolio-item first">
                        <div class="position-relative overflow-hidden mb-2">
                            <img class="img-fluid w-100" src="img/gallery-1.jpg" alt=""/>
                            <div class="portfolio-btn bg-primary d-flex align-items-center justify-content-center">
                                <a href="img/gallery-1.jpg" data-lightbox="portfolio">
                                    <i class="fa fa-plus text-white" style={{fontSize:'60px'}}></i>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 col-md-6 mb-4 portfolio-item second">
                        <div class="position-relative overflow-hidden mb-2">
                            <img class="img-fluid w-100" src="img/gallery-2.jpg" alt=""/>
                            <div class="portfolio-btn bg-primary d-flex align-items-center justify-content-center">
                                <a href="img/gallery-2.jpg" data-lightbox="portfolio">
                                    <i class="fa fa-plus text-white" style={{fontSize:'60px'}}></i>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 col-md-6 mb-4 portfolio-item third">
                        <div class="position-relative overflow-hidden mb-2">
                            <img class="img-fluid w-100" src="img/gallery-3.jpg" alt=""/>
                            <div class="portfolio-btn bg-primary d-flex align-items-center justify-content-center">
                                <a href="img/gallery-3.jpg" data-lightbox="portfolio">
                                    <i class="fa fa-plus text-white" style={{fontSize:'60px'}}></i>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 col-md-6 mb-4 portfolio-item first">
                        <div class="position-relative overflow-hidden mb-2">
                            <img class="img-fluid w-100" src="img/gallery-4.jpg" alt=""/>
                            <div class="portfolio-btn bg-primary d-flex align-items-center justify-content-center">
                                <a href="img/gallery-4.jpg" data-lightbox="portfolio">
                                    <i class="fa fa-plus text-white" style={{fontSize:'60px'}}></i>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 col-md-6 mb-4 portfolio-item second">
                        <div class="position-relative overflow-hidden mb-2">
                            <img class="img-fluid w-100" src="img/gallery-5.jpg" alt=""/>
                            <div class="portfolio-btn bg-primary d-flex align-items-center justify-content-center">
                                <a href="img/gallery-5.jpg" data-lightbox="portfolio">
                                    <i class="fa fa-plus text-white" style={{fontSize:'60px'}}></i>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 col-md-6 mb-4 portfolio-item third">
                        <div class="position-relative overflow-hidden mb-2">
                            <img class="img-fluid w-100" src="img/gallery-6.jpg" alt=""/>
                            <div class="portfolio-btn bg-primary d-flex align-items-center justify-content-center">
                                <a href="img/gallery-6.jpg" data-lightbox="portfolio">
                                    <i class="fa fa-plus text-white" style={{fontSize:'60px'}}></i>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 col-md-6 mb-4 portfolio-item third">
                        <div class="position-relative overflow-hidden mb-2">
                            <img class="img-fluid w-100" src="img/gallery-7.jpg" alt=""/>
                            <div class="portfolio-btn bg-primary d-flex align-items-center justify-content-center">
                                <a href="img/gallery-6.jpg" data-lightbox="portfolio">
                                    <i class="fa fa-plus text-white" style={{fontSize:'60px'}}></i>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 col-md-6 mb-4 portfolio-item third">
                        <div class="position-relative overflow-hidden mb-2">
                            <img class="img-fluid w-100" src="img/gallery-8.jpg" alt=""/>
                            <div class="portfolio-btn bg-primary d-flex align-items-center justify-content-center">
                                <a href="img/gallery-6.jpg" data-lightbox="portfolio">
                                    <i class="fa fa-plus text-white" style={{fontSize:'60px'}}></i>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 col-md-6 mb-4 portfolio-item third">
                        <div class="position-relative overflow-hidden mb-2">
                            <img class="img-fluid w-100" src="img/gallery-9.jpg" alt=""/>
                            <div class="portfolio-btn bg-primary d-flex align-items-center justify-content-center">
                                <a href="img/gallery-6.jpg" data-lightbox="portfolio">
                                    <i class="fa fa-plus text-white" style={{fontSize:'60px'}}></i>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 col-md-6 mb-4 portfolio-item third">
                        <div class="position-relative overflow-hidden mb-2">
                            <img class="img-fluid w-100" src="img/gallery-10.jpg" alt=""/>
                            <div class="portfolio-btn bg-primary d-flex align-items-center justify-content-center">
                                <a href="img/gallery-6.jpg" data-lightbox="portfolio">
                                    <i class="fa fa-plus text-white" style={{fontSize:'60px'}}></i>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 col-md-6 mb-4 portfolio-item third">
                        <div class="position-relative overflow-hidden mb-2">
                            <img class="img-fluid w-100" src="img/gallery-11.jpg" alt=""/>
                            <div class="portfolio-btn bg-primary d-flex align-items-center justify-content-center">
                                <a href="img/gallery-6.jpg" data-lightbox="portfolio">
                                    <i class="fa fa-plus text-white" style={{fontSize:'60px'}}></i>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 col-md-6 mb-4 portfolio-item third">
                        <div class="position-relative overflow-hidden mb-2">
                            <img class="img-fluid w-100" src="img/gallery-12.jpg" alt=""/>
                            <div class="portfolio-btn bg-primary d-flex align-items-center justify-content-center">
                                <a href="img/gallery-6.jpg" data-lightbox="portfolio">
                                    <i class="fa fa-plus text-white" style={{fontSize:'60px'}}></i>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 col-md-6 mb-4 portfolio-item third">
                        <div class="position-relative overflow-hidden mb-2">
                            <img class="img-fluid w-100" src="img/gallery-13.jpg" alt=""/>
                            <div class="portfolio-btn bg-primary d-flex align-items-center justify-content-center">
                                <a href="img/gallery-6.jpg" data-lightbox="portfolio">
                                    <i class="fa fa-plus text-white" style={{fontSize:'60px'}}></i>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 col-md-6 mb-4 portfolio-item third">
                        <div class="position-relative overflow-hidden mb-2">
                            <img class="img-fluid w-100" src="img/gallery-14.jpg" alt=""/>
                            <div class="portfolio-btn bg-primary d-flex align-items-center justify-content-center">
                                <a href="img/gallery-6.jpg" data-lightbox="portfolio">
                                    <i class="fa fa-plus text-white" style={{fontSize:'60px'}}></i>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 col-md-6 mb-4 portfolio-item third">
                        <div class="position-relative overflow-hidden mb-2">
                            <img class="img-fluid w-100" src="img/gallery-15.jpg" alt=""/>
                            <div class="portfolio-btn bg-primary d-flex align-items-center justify-content-center">
                                <a href="img/gallery-6.jpg" data-lightbox="portfolio">
                                    <i class="fa fa-plus text-white" style={{fontSize:'60px'}}></i>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 col-md-6 mb-4 portfolio-item third">
                        <div class="position-relative overflow-hidden mb-2">
                            <img class="img-fluid w-100" src="img/gallery-16.jpg" alt=""/>
                            <div class="portfolio-btn bg-primary d-flex align-items-center justify-content-center">
                                <a href="img/gallery-6.jpg" data-lightbox="portfolio">
                                    <i class="fa fa-plus text-white" style={{fontSize:'60px'}}></i>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 col-md-6 mb-4 portfolio-item third">
                        <div class="position-relative overflow-hidden mb-2">
                            <img class="img-fluid w-100" src="img/gallery-17.jpg" alt=""/>
                            <div class="portfolio-btn bg-primary d-flex align-items-center justify-content-center">
                                <a href="img/gallery-6.jpg" data-lightbox="portfolio">
                                    <i class="fa fa-plus text-white" style={{fontSize:'60px'}}></i>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 col-md-6 mb-4 portfolio-item third">
                        <div class="position-relative overflow-hidden mb-2">
                            <img class="img-fluid w-100" src="img/gallery-18.jpg" alt=""/>
                            <div class="portfolio-btn bg-primary d-flex align-items-center justify-content-center">
                                <a href="img/gallery-6.jpg" data-lightbox="portfolio">
                                    <i class="fa fa-plus text-white" style={{fontSize:'60px'}}></i>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 col-md-6 mb-4 portfolio-item third">
                        <div class="position-relative overflow-hidden mb-2">
                            <img class="img-fluid w-100" src="img/gallery-19.jpg" alt=""/>
                            <div class="portfolio-btn bg-primary d-flex align-items-center justify-content-center">
                                <a href="img/gallery-6.jpg" data-lightbox="portfolio">
                                    <i class="fa fa-plus text-white" style={{fontSize:'60px'}}></i>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 col-md-6 mb-4 portfolio-item third">
                        <div class="position-relative overflow-hidden mb-2">
                            <img class="img-fluid w-100" src="img/gallery-20.jpg" alt=""/>
                            <div class="portfolio-btn bg-primary d-flex align-items-center justify-content-center">
                                <a href="img/gallery-6.jpg" data-lightbox="portfolio">
                                    <i class="fa fa-plus text-white" style={{fontSize:'60px'}}></i>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 col-md-6 mb-4 portfolio-item third">
                        <div class="position-relative overflow-hidden mb-2">
                            <img class="img-fluid w-100" src="img/gallery-21.jpg" alt=""/>
                            <div class="portfolio-btn bg-primary d-flex align-items-center justify-content-center">
                                <a href="img/gallery-6.jpg" data-lightbox="portfolio">
                                    <i class="fa fa-plus text-white" style={{fontSize:'60px'}}></i>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 col-md-6 mb-4 portfolio-item third">
                        <div class="position-relative overflow-hidden mb-2">
                            <img class="img-fluid w-100" src="img/gallery-22.jpg" alt=""/>
                            <div class="portfolio-btn bg-primary d-flex align-items-center justify-content-center">
                                <a href="img/gallery-6.jpg" data-lightbox="portfolio">
                                    <i class="fa fa-plus text-white" style={{fontSize:'60px'}}></i>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 col-md-6 mb-4 portfolio-item third">
                        <div class="position-relative overflow-hidden mb-2">
                            <img class="img-fluid w-100" src="img/gallery-23.jpg" alt=""/>
                            <div class="portfolio-btn bg-primary d-flex align-items-center justify-content-center">
                                <a href="img/gallery-6.jpg" data-lightbox="portfolio">
                                    <i class="fa fa-plus text-white" style={{fontSize:'60px'}}></i>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 col-md-6 mb-4 portfolio-item third">
                        <div class="position-relative overflow-hidden mb-2">
                            <img class="img-fluid w-100" src="img/gallery-24.jpg" alt=""/>
                            <div class="portfolio-btn bg-primary d-flex align-items-center justify-content-center">
                                <a href="img/gallery-6.jpg" data-lightbox="portfolio">
                                    <i class="fa fa-plus text-white" style={{fontSize:'60px'}}></i>
                                </a>
                            </div>
                        </div>
                    </div>
                <div class="col-lg-4 col-md-6 mb-4 portfolio-item third">
                    <div class="position-relative overflow-hidden mb-2">
                        <img class="img-fluid w-100" src="img/gallery-25.jpg" alt=""/>
                        <div class="portfolio-btn bg-primary d-flex align-items-center justify-content-center">
                            <a href="img/gallery-6.jpg" data-lightbox="portfolio">
                                <i class="fa fa-plus text-white" style={{fontSize:'60px'}}></i>
                            </a>
                        </div>
                    </div>
                </div>
                <div class="col-lg-4 col-md-6 mb-4 portfolio-item third">
                    <div class="position-relative overflow-hidden mb-2">
                        <img class="img-fluid w-100" src="img/gallery-26.jpg" alt=""/>
                        <div class="portfolio-btn bg-primary d-flex align-items-center justify-content-center">
                            <a href="img/gallery-6.jpg" data-lightbox="portfolio">
                                <i class="fa fa-plus text-white" style={{fontSize:'60px'}}></i>
                            </a>
                        </div>
                    </div>
                </div>
                <div class="col-lg-4 col-md-6 mb-4 portfolio-item third">
                    <div class="position-relative overflow-hidden mb-2">
                        <img class="img-fluid w-100" src="img/gallery-27.jpg" alt=""/>
                        <div class="portfolio-btn bg-primary d-flex align-items-center justify-content-center">
                            <a href="img/gallery-6.jpg" data-lightbox="portfolio">
                                <i class="fa fa-plus text-white" style={{fontSize:'60px'}}></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    {/* <!-- Gallery End --> */}

        <Footer />

    {/* <!-- Back to Top --> */}
    <a href="#" class="btn btn-primary p-3 back-to-top"><i class="fa fa-angle-double-up"></i></a>
</div>
    )
}

export default Gallery