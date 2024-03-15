import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";
import ContactDetails from "../components/ContactDetails";
function Contact() {
  return (
    <div>
      <Navbar />
      <PageHeader heading="Contact Us" />
      <ContactDetails />
      <Footer />
    </div>
  );
}

export default Contact;
