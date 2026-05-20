import "./EditorStyles.css";
import { EditorApp } from "./EditorApp.js";

const app = new EditorApp({
  root: document.querySelector("#editorApp"),
  canvas: document.querySelector("#editorCanvas")
});

app.init();
