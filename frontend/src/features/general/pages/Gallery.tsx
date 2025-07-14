import Navbar from "../../../components/layout/Navbar";
import Footer from "../../../components/layout/Footer";
import PageHeader from "../../../components/common/PageHeader";
import GallleryCard from "../components/GalleryCard";

function Gallery() {
  const getImages = () => {
    const images = []
    for (let i = 1; i < 29; i++) {
      images.push(`/img/gallery-${i}.jpg`)
    }
    return images
  }
  console.log(getImages())
  return (
    <div>
      <Navbar />
      <PageHeader heading="Gallery" />
      <div className="container pt-5 pb-3">
        <div className="text-center pb-2 md:col-span-3">
          <p>
            <span className="text-sm">Our Gallery</span>
          </p>
          <h1 className="mb-4 text-3xl text-cyan-600 font-moto">Our Kids School Gallery</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {getImages().map(image => <GallleryCard imageUrl={image} />)}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Gallery;
