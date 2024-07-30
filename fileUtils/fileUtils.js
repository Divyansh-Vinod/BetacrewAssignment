const fs = require("fs");

// Save packets to a file
const savePacketsToFile = (packets) => {
  fs.writeFile(
    "packets.json",
    JSON.stringify(Object.values(packets), null, 2),
    (err) => {
      if (err) {
        console.error("Error writing to file:", err.message);
      } else {
        console.log("Packet data has been saved to packets.json");
      }
    }
  );
};

// Append new data to the existing file
const appendDataToFile = (newData) => {
  const data = fs.readFileSync("packets.json", { encoding: "utf8", flag: "r" });
  try {
    const existingData = data ? JSON.parse(data) : [];
    const updatedData = existingData.concat(newData);
    fs.writeFileSync(
      "packets.json",
      JSON.stringify(updatedData, null, 2),
      (err) => {
        if (err) {
          console.error("Error writing to file:", err.message);
        } else {
          console.log("Packet data has been appended to packets.json");
        }
      }
    );
  } catch (parseErr) {
    console.error("Error parsing JSON data:", parseErr.message);
  }
};

// Export functions
module.exports = {
  savePacketsToFile,
  appendDataToFile,
};
