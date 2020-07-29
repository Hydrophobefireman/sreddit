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

function awakeServer() {
  return requests.get("/ping").then(() => (
    <main data-app>
      <Router>
        <Path match="/" component={Landing} />
        <Path match="/r/:sub/:sort" component={Content} />
        <Path match="/r/:sub/" component={Content} />
      </Router>
    </main>
  ));
}

function App() {
  return (
    <AsyncComponent
      promise={awakeServer}
      fallback={() => "waiting for backend to wake up"}
    />
  );
}
render(<App />, document.getElementById("app-mount"));
