import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  const styles = {
    body: {
      margin: 0,
      padding: 0,
      backgroundColor: "#000",
      color: "#ff0000",
      fontFamily: "Arial, sans-serif",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      textAlign: "center",
    },
    container: {
      maxWidth: "600px",
    },
    h1: {
      fontSize: "80px",
      color: "#ff0000",
      marginBottom: "10px",
    },
    p: {
      fontSize: "18px",
      marginBottom: "20px",
    },
    link: {
      color: "#ff0000",
      textDecoration: "none",
      border: "1px solid #ff0000",
      padding: "10px 20px",
      transition: "0.3s",
      display: "inline-block",
    },
  };

  return (
    <div style={styles.body}>
      <div style={styles.container}>
        <h1 style={styles.h1}>404</h1>
        <p style={styles.p}>
          Oops! The page you're looking for doesn't exist.
        </p>

        <Link
          to="/"
          style={styles.link}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#ff0000";
            e.target.style.color = "#000";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "transparent";
            e.target.style.color = "#ff0000";
          }}
        >
          Go Back Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;