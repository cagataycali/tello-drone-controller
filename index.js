#!/usr/bin/env node
const Tello = require("tello-drone");
const express = require('express');
const app = express();
const port = 9000;

const drone = new Tello();

let droneConnected = false;

// Drone event listeners
drone.on("connection", () => {
  console.log("Connected to drone");
  droneConnected = true;
});

drone.on("state", state => {
  console.log("Received State >", state);
});

drone.on("send", (err, length) => {
  if (err) console.log(err);
  console.log(`Sent command is ${length} long`);
});

drone.on("message", message => {
  console.log("Received Message >", message);
});

// Define the route outside of the drone connection event
app.get('/:command', async (req, res) => {
  if (!droneConnected) {
    console.log("Drone not connected");
    res.status(500).json({ message: "Drone not connected" });
    return;
  }
  const command = req.params.command;
  const params = req.query; // Get query string parameters
  console.log(`Received command: ${command}`);

  // Convert query parameters to command options
  let commandOptions = {};
  for (let key in params) {
    if (params.hasOwnProperty(key)) {
      commandOptions[key] = isNaN(params[key]) ? params[key] : Number(params[key]);
    }
  }

  try {
    // Check if command requires options
    if (Object.keys(commandOptions).length > 0) {
      // Send command with options
      await drone.send(command, commandOptions);
    } else {
      // Send command without options
      await drone.send(command);
    }
    res.json({ command: command, status: 'success', options: commandOptions });
  } catch (error) {
    console.error(`Error sending command to drone: ${error}`);
    res.status(500).json({ command: command, status: 'error', message: error.toString(), options: commandOptions });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
