import Navbar from "../../../components/layout/Navbar";
import Footer from "../../../components/layout/Footer";
import PageHeader from "../../../components/common/PageHeader";
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
