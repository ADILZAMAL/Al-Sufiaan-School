import React from "react"

interface PageHeaderProps {
  heading: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ heading }) => {
  return (
    <div className="bg-cyan-600 border">
      <div
        className="flex flex-col items-center justify-center min-h-96"
      >
        <h3 className="text-6xl font-bold text-white">{heading}</h3>   
        <div className="flex text-white mt-3">
          <p className="m-0">
            <a className="hover:no-underline" href="/">
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