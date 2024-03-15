import React from 'react';

const ContactDetails: React.FC = () => {
    return (
        <div className="container py-5">
        <div className="text-center pb-2 ">
          <p className="">
            <span className=" text-sm">Get In Touch</span>
          </p>
          <h1 className="mb-4 text-3xl text-cyan-600">Contact Us For Any Query</h1>
        </div>
        <div className="flex justify-center">
          <div className="grid gap-5 mb-5">
            <div className="flex">
              <i
                className="fa fa-map-marker-alt flex items-center justify-center bg-cyan-600 text-cyan-900 rounded-full w-11 h-11 "
              />
              <div className="pl-3">
                <h5 className="text-xl leading-5 text-cyan-600">Address</h5>
                <p>Udhwa, Sahibganj, Jharkhand - 816108</p>
              </div>
            </div>
            <div className="flex">
              <i
                className="fa fa-envelope flex items-center justify-center bg-cyan-600 text-cyan-900 rounded-full w-11 h-11"
              />
              <div className="pl-3">
                <h5 className="text-xl leading-5 text-cyan-600">Email</h5>
                <p>adilzamal@gmail.com</p>
              </div>
            </div>
            <div className="flex">
              <i
                className="fa fa-phone-alt flex items-center justify-center bg-cyan-600 text-cyan-900 rounded-full w-11 h-11"
              />
              <div className="pl-3">
                <h5 className="text-xl leading-5 text-cyan-600">Phone</h5>
                <p>+91 9065236666</p>
              </div>
            </div>
            <div className="flex">
              <i
                className="far fa-clock flex items-center justify-center bg-cyan-600 text-cyan-900 rounded-full w-11 h-11"
              />
              <div className="pl-3">
                <h5 className="text-xl leading-5 text-cyan-600">Opening Hours</h5>
                <strong>Monday - Saturday:</strong>
                <p className="m-0">07:00 AM - 01:30 PM & 3PM - 08:00 PM </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
}

export default ContactDetails