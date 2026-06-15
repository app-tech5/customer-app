
const fs = require("fs");

function generatePointsFromRoutePath(routeCoordinates, stepsPerSegment = 20) {
  if (!Array.isArray(routeCoordinates) || routeCoordinates.length < 2) {
    return [];
  }

  const safeSteps = Math.max(1, Number(stepsPerSegment) || 1);
  const points = [];

  for (let i = 0; i < routeCoordinates.length - 1; i += 1) {
    const [startLngRaw, startLatRaw] = routeCoordinates[i] || [];
    const [endLngRaw, endLatRaw] = routeCoordinates[i + 1] || [];

    const startLat = Number(startLatRaw);
    const startLng = Number(startLngRaw);
    const endLat = Number(endLatRaw);
    const endLng = Number(endLngRaw);

    if (![startLat, startLng, endLat, endLng].every(Number.isFinite)) {
      continue;
    }

    for (let step = 0; step <= safeSteps; step += 1) {
      if (i > 0 && step === 0) continue;
      const t = step / safeSteps;
      points.push({
        latitude: startLat + (endLat - startLat) * t,
        longitude: startLng + (endLng - startLng) * t,
      });
    }
  }

  return points;
}

function printUsage() {
  
}

async function main() {
  const [
    ,
    ,
    driverLatArg,
    driverLngArg,
    customerLatArg,
    customerLngArg,
    stepsArg,
    outputFile,
  ] = process.argv;

  if (
    driverLatArg == null ||
    driverLngArg == null ||
    customerLatArg == null ||
    customerLngArg == null
  ) {
    printUsage();
    process.exit(1);
  }

  const driverLat = Number(driverLatArg);
  const driverLng = Number(driverLngArg);
  const customerLat = Number(customerLatArg);
  const customerLng = Number(customerLngArg);
  const stepsPerSegment = Number(stepsArg || 20);

  if (![driverLat, driverLng, customerLat, customerLng].every(Number.isFinite)) {
    throw new Error("Invalid coordinates. Please pass numeric values.");
  }

  const osrmUrl =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${driverLng},${driverLat};${customerLng},${customerLat}` +
    `?overview=full&geometries=geojson`;

  const response = await fetch(osrmUrl);
  if (!response.ok) {
    throw new Error(`OSRM request failed: HTTP ${response.status}`);
  }

  const data = await response.json();
  const routeCoordinates = data?.routes?.[0]?.geometry?.coordinates;
  if (!Array.isArray(routeCoordinates) || routeCoordinates.length < 2) {
    throw new Error("OSRM response has no usable route geometry.");
  }

  const points = generatePointsFromRoutePath(routeCoordinates, stepsPerSegment);
  const runnerJson = JSON.stringify(points, null, 2);

  const meta = `OSRM route vertices: ${routeCoordinates.length}, runner iterations: ${points.length} (driver ${driverLat},${driverLng} → customer ${customerLat},${customerLng}, steps/segment ${stepsPerSegment})`;

  if (outputFile) {
    fs.writeFileSync(outputFile, runnerJson, "utf8");
    console.error(meta);
    
  } else {
    console.error(meta);
    process.stdout.write(`${runnerJson}\n`);
  }
}

main().catch((error) => {
  console.error("Failed to generate route points:", error.message);
  process.exit(1);
});

