import "../../assets/css/Sidebar.css";
import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <aside className="sidebar">
      <ul>
        <li><Link to="/">Dashboard</Link></li>
        <li><Link to="/about">About</Link></li>
        <li><Link to="/settings">Settings</Link></li>
      </ul>
    </aside>
  );
}

export default Sidebar;
