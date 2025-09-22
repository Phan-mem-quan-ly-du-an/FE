import { Outlet } from "react-router-dom";
import Header from "./header/Header";
import Sidebar from "./sidebar/Sidebar";
// import Footer from "./footer/Footer";
import "./Layout.css";

function Layout() {
  return (
    <div className="layout">
      <Header />
      <div className="layout-main">
        <Sidebar />
        <div className="layout-content">
          <Outlet />
        </div>
      </div>
      {/* <Footer /> */}
    </div>
  );
}

export default Layout;
