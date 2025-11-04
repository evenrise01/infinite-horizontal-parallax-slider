import Image from "next/image";

export default function Home() {
  return (
    <>
      <nav>
        <div className="logo">
          <a href="#">Evenrise</a>
        </div>
        <div className="nav-links">
          <a href="#">Work</a>
          <a href="#">Studio</a>
          <a href="#">Contact</a>
        </div>
      </nav>

      <div className="slider">
        <div className="slide-track"></div>
      </div>

      <footer>
        <p>Experiment 0696</p>
        <p>Built by Evenrise</p>
      </footer>
    </>
  );
}
