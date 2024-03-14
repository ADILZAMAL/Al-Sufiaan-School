import Topbar from "./Topbar";
import Sidebar from "./Sidebar";
const Dashboard = ({ children }) => {
  return (
      <div className="app">
        <Sidebar />
        <main className="content">
          <Topbar />
          {children}
        </main>
      </div>
  );
};

export default Dashboard;
