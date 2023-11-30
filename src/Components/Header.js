function Header() {
    return (
        <div class="container-fluid bg-light position-relative shadow">
            <nav class="navbar navbar-expand-lg bg-light navbar-light py-3 py-lg-0 px-0 px-lg-5">
                <a href="" class="navbar-brand font-weight-bold text-secondary" style={{ fontSize: '30px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <img src="./img/school-logo.svg" width="40" height="40" class="mx-2" />
                    <span class="text-primary">Al Sufiaan School</span>
                </a>
                <button type="button" class="navbar-toggler" data-toggle="collapse" data-target="#navbarCollapse">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse justify-content-between" id="navbarCollapse">
                    <div class="navbar-nav font-weight-bold mx-auto py-0">
                        <a href="/" class="nav-item nav-link">Home</a>
                        <a href="about" class="nav-item nav-link active">About</a>
                        <a href="team" class="nav-item nav-link">Teachers</a>
                        <a href="gallery" class="nav-item nav-link">Gallery</a>
                        <a href="contact" class="nav-item nav-link">Contact</a>
                    </div>
                    <a href="" class="btn btn-primary px-4">Admin Login</a>
                </div>
            </nav>
        </div>
    )
}

export default Header