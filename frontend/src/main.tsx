import React from "react";
import ReactDOM from "react-dom/client";
import Home from "./pages/Home";
import "./styles/index.css";

document.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Home />
  </React.StrictMode>,
);
