import "./loading.css";

export default function Loading() {
  return (
    <div className="global-loading-container">
      <div className="global-loading-background" />
      <div className="global-loading-content">
        <div className="loading-logo-wrapper">
          <span className="loading-triangle">▲</span>
        </div>
        <span className="loading-text">Loading...</span>
      </div>
    </div>
  );
}
