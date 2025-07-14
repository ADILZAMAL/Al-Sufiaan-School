import React from "react";

interface GalleryCardProps {
    imageUrl: string;
}

const GallleryCard: React.FC<GalleryCardProps> = ({imageUrl}) => {
    return (
        <div className="mb-4">
              <div className="relative overflow-hidden mb-2">
                <img className="w-full" src={imageUrl} alt="" />
                <div className="opacity-0 hover:opacity-100 absolute inset-x-8 inset-y-8 bg-cyan-600 portfolio-btn flex items-center justify-center">
                  <a href={imageUrl} data-lightbox="portfolio">
                    <i
                      className="fa fa-plus text-white"
                      style={{ fontSize: "60px" }}
                    ></i>
                  </a>
                </div>
              </div>
            </div>
    )
}

export default GallleryCard