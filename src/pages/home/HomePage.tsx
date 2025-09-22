import "./HomePage.css";
import HomeCard from "./components/HomeCard";

function HomePage() {
  return (
    <div className="home">
      <h2 className="home-title">Home Page</h2>
      <p className="home-subtitle">Welcome to the homepage!</p>

      <div className="home-cards">
        <HomeCard title="Users" description="Manage application users" />
        <HomeCard title="Reports" description="View system reports" />
        <HomeCard title="Settings" description="Configure your preferences" />
      </div>
    </div>
  );
}

export default HomePage;
