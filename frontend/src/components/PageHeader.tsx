import React from "react"

interface PageHeaderProps {
  heading: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({heading}) => {
    return (
        <div className="container-fluid bg-primary mb-5">
        <div
          className="d-flex flex-column align-items-center justify-content-center"
          style={{ minHeight: "400px" }}
        >
          <h3 className="display-3 font-weight-bold text-white">{heading}</h3>
          <div className="d-inline-flex text-white">
            <p className="m-0">
              <a className="text-white" href="">
                Home
              </a>
            </p>
            <p className="m-0 px-2">/</p>
            <p className="m-0">{heading}</p>
          </div>
        </div>
      </div>
    )
}

export default PageHeader