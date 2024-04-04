import sirv from "sirv";
import polka from "polka";
import { EventEmitter } from "node:events";

const departureEmitter = new EventEmitter();

const app = polka();

let config = {
  port: process.env.PORT || 3000,
  refreshrate: process.env.REALREFRESH || 30, //Number of seconds between refresh
  siteid: process.env.SITEID || 9204, //Tekniska högskolan siteid
};

let stats = {
  requests: 0,
  nrofclients: 0,
};

let sldata = null;

app
  .use("/public", sirv("public"))
  .use("/", sirv("views"))
  .use("/subscribe", (req, res) => {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    function slMetroHandler() {
      res.write("event: slmetro\n");
      res.write(`data: ${JSON.stringify(sldata.Metro)}\n\n`);
    }
    function slBusHandler() {
      res.write("event: slbus\n");
      res.write(`data: ${JSON.stringify(sldata.Bus)}\n\n`);
    }
    function slTramHandler() {
      res.write("event: sltram\n");
      res.write(`data: ${JSON.stringify(sldata.Tram)}\n\n`);
    }
    function statsHandler() {
      res.write("event: stats\n");
      res.write(`data: ${JSON.stringify(stats)}\n\n`);
    }

    stats.nrofclients++;
    if (sldata) {
      res.write("event: slmetro\n");
      res.write(`data: ${JSON.stringify(sldata.Metro)}\n\n`);
      res.write("event: slbus\n");
      res.write(`data: ${JSON.stringify(sldata.Bus)}\n\n`);
      res.write("event: sltram\n");
      res.write(`data: ${JSON.stringify(sldata.Tram)}\n\n`);
      res.write("event: stats\n");
      res.write(`data: ${JSON.stringify(stats)}\n\n`);
    }

    departureEmitter.on("slmetro", slMetroHandler);
    departureEmitter.on("slbus", slBusHandler);
    departureEmitter.on("sltram", slTramHandler);
    departureEmitter.on("stats", statsHandler);

    req.once("close", () => {
      departureEmitter.off("slmetro", slMetroHandler);
      departureEmitter.off("slbus", slBusHandler);
      departureEmitter.off("sltram", slTramHandler);
      departureEmitter.off("stats", statsHandler);
      res.end();
      stats.nrofclients--;
    });
  })
  .listen(config.port, () => {
    console.log(`listening on *:${config.port}`);
  });

async function updateDepartures() {
  stats.requests++;
  const response = await fetch(
    `https://transport.integration.sl.se/v1/sites/${config.siteid}/departures`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
  if (response.ok) {
    const data = await response.json();

    const busFour = [];
    const busOther = [];
    const metroNorth = [];
    const metroSouth = [];
    const tram = [];
    data.departures.forEach((departure) => {
      if (departure.line.transport_mode === "BUS") {
        if (departure.line.id === 4 || departure.line.id === 94) {
          busFour.push({
            id: departure.line.id,
            destination: departure.destination,
            display: departure.display,
          });
        } else if (busOther.length < 10) {
          busOther.push({
            id: departure.line.id,
            destination: departure.destination,
            display: departure.display,
          });
        }
      } else if (departure.line.transport_mode === "METRO") {
        if (departure.direction_code === 1 && metroNorth.length < 4) {
          metroNorth.push({
            id: departure.line.id,
            destination: departure.destination,
            display: departure.display,
          });
        } else if (metroSouth.length < 4) {
          metroSouth.push({
            id: departure.line.id,
            destination: departure.destination,
            display: departure.display,
          });
        }
      } else if (departure.line.transport_mode === "TRAM") {
        if (tram.length < 8) {
          tram.push({
            id: departure.line.id,
            destination: departure.destination,
            display: departure.display,
          });
        }
      }
    });
    sldata = {
      Bus: {
        four: busFour,
        other: busOther,
      },
      Metro: {
        north: metroNorth,
        south: metroSouth,
      },
      Tram: tram,
    };
    departureEmitter.emit("slbus");
    departureEmitter.emit("slmetro");
    departureEmitter.emit("sltram");
    departureEmitter.emit("stats");
  } else {
    console.error("Error fetching data", response);
  }
}

setInterval(updateDepartures, 1000 * config.refreshrate); //Refreshrate is in seconds.

await updateDepartures();
