// import "./HomeCard.css";

interface HomeCardProps {
  title: string;
  description: string;
}

function HomeCard({ title, description }: HomeCardProps) {
  return (
    <div className="home-card">
      <h3 className="home-card-title">{title}</h3>
      <p className="home-card-desc">{description}</p>
    </div>
  );
}

export default HomeCard;
