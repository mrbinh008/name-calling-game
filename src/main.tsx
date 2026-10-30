import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles/fonts.css";
import "./styles/original-game.css";
import "./styles/app.css";
import "./styles/library.css";
import "./styles/picker-games.css";
import "./styles/mango-poke.css";
const root = document.getElementById("root");
if (!root) throw new Error("Application root is missing");
createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
