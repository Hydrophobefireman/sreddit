import {
  render,
  AsyncComponent,
  Router,
  Path,
} from "@hydrophobefireman/ui-lib";
import { requests } from "./util";
import Landing from "./components/Landing/Landing";
import Content from "./components/Content/Content";
import "./App.css";

requests.get("/ping");

function App() {
  return (
    <main data-app>
      <Router>
        <Path match="/" component={Landing} />
        <Path match="/r/:sub/:sort" component={Content} />
        <Path match="/r/:sub/" component={Content} />
      </Router>
    </main>
  );
}
render(<App />, document.getElementById("app-mount"));
