import express from "express";
// TODO: replace with SSE.
import { Server } from "socket.io";
import { createServer } from "node:http";

const app = express();
const server = createServer(app);
const io = new Server(server);

let config = {
  port: process.env.PORT || 3000,
  refreshrate: process.env.REALREFRESH || 30, //Number of seconds between refresh
  siteid: process.env.SITEID || 9204, //Tekniska högskolan siteid
};

app.use(
  express.static(`${import.meta.dirname}/views`, { extensions: ["html"] }),
);
app.use("/public", express.static(`${import.meta.dirname}/public`));

let stats = {
  requests: 0,
  nrofclients: 0,
};

let sldata = null;

io.on("connection", (socket) => {
  stats.nrofclients = io.engine.clientsCount;
  if (sldata) {
    socket.emit("slmetro", sldata.Metro);
    socket.emit("slbus", sldata.Bus);
    socket.emit("sltram", sldata.Tram);
    socket.emit("stats", stats);
  }
  socket.on("disconnect", () => (stats.nrofclients = io.engine.clientsCount));
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
    io.emit("slbus", sldata.Bus);
    io.emit("slmetro", sldata.Metro);
    io.emit("sltram", sldata.Tram);
    io.emit("stats", stats);
  } else {
    console.error("Error fetching data", response);
  }
}

setInterval(updateDepartures, 1000 * config.refreshrate); //Refreshrate is in seconds.

await updateDepartures();

server.listen(config.port, () => {
  console.log(`listening on *:${config.port}`);
});
