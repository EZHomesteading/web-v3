import { Location } from "@prisma/client";
import { RouteResult } from "../../types/types";
import {
  AVERAGE_STOP_TIME,
  BUFFER_TIME,
  getCurrentTimeInSeconds,
  getLocationCloseTime,
  getLocationOpenTime,
  getServiceWindow,
  hasTimePassed,
  secondsToTimeString,
} from "../../utils/optimizer-utils";

const permute = <T>(arr: T[]): T[][] => {
  if (arr.length <= 1) return [arr];
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    const permutations = permute(rest);
    permutations.forEach((perm) => {
      result.push([arr[i], ...perm]);
    });
  }
  return result;
};
export const optimizeTimeRoute = async (
  startLocation: google.maps.LatLng,
  locations: Location[],
  endLocation: google.maps.LatLng,
  usePickupOrder: boolean = false,
  departureTime: number,
  selectedDate: Date,
  startDelay: number
): Promise<RouteResult> => {
  const directionsService = new google.maps.DirectionsService();

  try {
    if (usePickupOrder) {
      // If using manual order, just calculate with end location
      return await calculateRouteWithTimings(
        directionsService,
        startLocation,
        locations,
        endLocation,
        departureTime,
        selectedDate,
        false,
        false,
        startDelay
      );
    }

    // First, calculate basic distance matrix for initial sorting
    const matrix = await calculateDistanceMatrix(startLocation, locations);

    // Sort locations by a combination of time windows and distance
    const sortedLocations = [...locations].sort((a, b) => {
      const aWindow = getServiceWindow(a, selectedDate);
      const bWindow = getServiceWindow(b, selectedDate);

      // Calculate priority scores (lower is higher priority)
      const aScore = calculatePriorityScore(a, aWindow, matrix);
      const bScore = calculatePriorityScore(b, bWindow, matrix);

      return aScore - bScore;
    });

    // For routes with more than 3 locations, use chunk-based optimization
    if (locations.length > 3) {
      return await optimizeInChunks(
        directionsService,
        startLocation,
        sortedLocations,
        endLocation,
        departureTime,
        selectedDate,
        undefined,
        startDelay
      );
    }

    // For smaller routes, use standard optimization
    return await calculateRouteWithTimings(
      directionsService,
      startLocation,
      sortedLocations,
      endLocation,
      departureTime,
      selectedDate,
      true,
      false,
      startDelay
    );
  } catch (error) {
    throw error;
  }
};

// Helper function to calculate priority score for a location
const calculatePriorityScore = (
  location: Location,
  window: { openTime: number; closeTime: number; windowSize: number },
  matrix: { [key: string]: number }
): number => {
  const WINDOW_SIZE_WEIGHT = 0.6;
  const DISTANCE_WEIGHT = 0.4;

  // Normalize window size (smaller windows get higher priority)
  const windowScore = window.windowSize / (24 * 60); // Normalize to 0-1 range

  // Normalize distance (closer locations get higher priority)
  const distanceScore =
    matrix[location.id] / Math.max(...Object.values(matrix));

  // Combined score (lower is better)
  return windowScore * WINDOW_SIZE_WEIGHT + distanceScore * DISTANCE_WEIGHT;
};

// Calculate basic distance matrix
const calculateDistanceMatrix = async (
  start: google.maps.LatLng,
  locations: Location[]
): Promise<{ [key: string]: number }> => {
  const matrix: { [key: string]: number } = {};

  for (const location of locations) {
    const dest = new google.maps.LatLng(
      location.coordinates[1],
      location.coordinates[0]
    );
    const distance = google.maps.geometry.spherical.computeDistanceBetween(
      start,
      dest
    );
    matrix[location.id] = distance;
  }

  return matrix;
};

// Optimize route in chunks for better handling of larger routes
const optimizeInChunks = async (
  directionsService: google.maps.DirectionsService,
  startLocation: google.maps.LatLng,
  locations: Location[],
  endLocation: google.maps.LatLng,
  departureTime: number,
  selectedDate: Date,
  chunkSize: number = 5,
  startDelay: number
): Promise<RouteResult> => {
  let currentStart = startLocation;
  let currentTime = departureTime;
  let finalRoute: Location[] = [];
  let remainingLocations = [...locations];

  while (remainingLocations.length > 0) {
    // Take next chunk of locations
    const chunk = remainingLocations.slice(0, chunkSize);
    remainingLocations = remainingLocations.slice(chunkSize);

    // For last chunk, include end location
    const chunkEnd =
      remainingLocations.length === 0
        ? endLocation
        : new google.maps.LatLng(
            remainingLocations[0].coordinates[1],
            remainingLocations[0].coordinates[0]
          );

    // Optimize this chunk
    const chunkResult = await calculateRouteWithTimings(
      directionsService,
      currentStart,
      chunk,
      chunkEnd,
      currentTime,
      selectedDate,
      true,
      false,
      startDelay
    );

    // Update for next iteration
    finalRoute = [...finalRoute, ...chunkResult.route];
    currentTime += chunkResult.totalTime;
    currentStart = chunkEnd;
  }

  // Calculate final route with optimized order
  return await calculateRouteWithTimings(
    directionsService,
    startLocation,
    finalRoute,
    endLocation,
    departureTime,
    selectedDate,
    false,
    false,
    startDelay
  );
};

// const calculateFinalLeg = async (
//   directionsService: google.maps.DirectionsService,
//   intermediateResult: RouteResult,
//   endLocation: google.maps.LatLng
// ): Promise<RouteResult> => {
//   const lastLocation =
//     intermediateResult.route[intermediateResult.route.length - 1];
//   const lastLocationLatLng = new google.maps.LatLng(
//     lastLocation.coordinates[1],
//     lastLocation.coordinates[0]
//   );

//   const finalLeg = await new Promise<google.maps.DirectionsResult>(
//     (resolve, reject) => {
//       directionsService.route(
//         {
//           origin: lastLocationLatLng,
//           destination: endLocation,
//           travelMode: google.maps.TravelMode.DRIVING,
//           drivingOptions: {
//             departureTime: new Date(),
//             trafficModel: google.maps.TrafficModel.BEST_GUESS,
//           },
//         },
//         (response, status) => {
//           if (status === "OK" && response) resolve(response);
//           else reject(status);
//         }
//       );
//     }
//   );

//   return {
//     route: intermediateResult.route,
//     totalTime:
//       intermediateResult.totalTime +
//       (finalLeg.routes[0].legs[0].duration?.value || 0),
//     totalDistance:
//       intermediateResult.totalDistance +
//       (finalLeg.routes[0].legs[0].distance?.value || 0),
//     timings: {
//       ...intermediateResult.timings,
//       returnTime: finalLeg.routes[0].legs[0].duration?.value || 0,
//       totalTime:
//         intermediateResult.timings.totalTime +
//         (finalLeg.routes[0].legs[0].duration?.value || 0),
//       totalDistance:
//         intermediateResult.timings.totalDistance +
//         (finalLeg.routes[0].legs[0].distance?.value || 0),
//     },
//   };
// };

export const calculateRouteWithTimings = async (
  directionsService: google.maps.DirectionsService,
  startLocation: google.maps.LatLng,
  locations: Location[],
  endLocation: google.maps.LatLng,
  departureTime: number,
  selectedDate: Date, // Add this parameter
  optimize: boolean = false,
  skipEndOptimization: boolean = false,
  startDelay: number
): Promise<RouteResult> => {
  if (hasTimePassed(departureTime, selectedDate, startDelay)) {
    throw {
      type: "TIME_PASSED",
      message:
        "Departure time has already passed. Or you are not giving sellers enough notice.",
      details: {
        requestedTime: secondsToTimeString(departureTime),
        currentTime: secondsToTimeString(getCurrentTimeInSeconds()),
        sellerReq: startDelay,
      },
    };
  }
  const waypoints = locations.map((loc) => ({
    location: new google.maps.LatLng(loc.coordinates[1], loc.coordinates[0]),
    stopover: true,
  }));

  if (skipEndOptimization && waypoints.length > 0) {
    waypoints.pop();
  }

  const result = await new Promise<google.maps.DirectionsResult>(
    (resolve, reject) => {
      directionsService.route(
        {
          origin: startLocation,
          destination: endLocation,
          waypoints: waypoints,
          optimizeWaypoints: optimize && !skipEndOptimization,
          travelMode: google.maps.TravelMode.DRIVING,
          drivingOptions: {
            departureTime: new Date(Date.now() + departureTime * 1000),
            trafficModel: google.maps.TrafficModel.BEST_GUESS,
          },
        },
        (response, status) => {
          if (status === "OK" && response) resolve(response);
          else reject(status);
        }
      );
    }
  );

  const legs = result.routes[0].legs;
  const route =
    optimize && !skipEndOptimization && result.routes[0].waypoint_order
      ? result.routes[0].waypoint_order.map((index) => locations[index])
      : locations;

  let currentTime = departureTime;
  const segmentTimes: { [key: string]: number } = {};
  const distanceSegments: { [key: string]: number } = {};
  const suggestedPickupTimes: { [key: string]: string } = {};
  let totalTime = 0;
  let totalDistance = 0;

  // Process each location with the selected date
  for (let i = 0; i < route.length; i++) {
    const location = route[i];
    const leg = legs[i];
    const travelTime = leg.duration?.value || 0;
    const distance = leg.distance?.value || 0;

    const expectedArrival = currentTime + travelTime;

    if (hasTimePassed(expectedArrival, selectedDate, startDelay)) {
      throw {
        type: "TIME_PASSED",
        message: `Arrival time at ${location.name} has already passed`,
        details: {
          location,
          expectedArrival: secondsToTimeString(expectedArrival),
          currentTime: secondsToTimeString(getCurrentTimeInSeconds()),
        },
      };
    }

    const openTime = getLocationOpenTime(location, selectedDate) * 60;
    const closeTime = getLocationCloseTime(location, selectedDate) * 60;

    const earliestServiceStart = Math.max(
      expectedArrival + BUFFER_TIME,
      openTime
    );
    const serviceEndTime = earliestServiceStart + AVERAGE_STOP_TIME;

    // Check if we're arriving before opening time
    if (expectedArrival + BUFFER_TIME < openTime) {
      throw {
        type: "LOCATION_CLOSED",
        message: `${location.name} will not be open yet when we arrive`,
        location,
        details: {
          expectedArrival: secondsToTimeString(expectedArrival),
          serviceStart: secondsToTimeString(earliestServiceStart),
          serviceEnd: secondsToTimeString(serviceEndTime),
          openTime: secondsToTimeString(openTime),
          closeTime: secondsToTimeString(closeTime),
          willOpen: true,
        },
      };
    }

    // Check closing time
    if (serviceEndTime > closeTime) {
      throw {
        type: "LOCATION_CLOSED",
        message: `${location.name} would be closed at arrival or during service`,
        location,
        details: {
          expectedArrival: secondsToTimeString(expectedArrival),
          serviceStart: secondsToTimeString(earliestServiceStart),
          serviceEnd: secondsToTimeString(serviceEndTime),
          closeTime: secondsToTimeString(closeTime),
          openTime: secondsToTimeString(openTime),
          willOpen: false,
        },
      };
    }

    const waitTime = Math.max(0, openTime - expectedArrival);

    segmentTimes[location.id] = travelTime;
    distanceSegments[location.id] = distance;
    suggestedPickupTimes[location.id] =
      secondsToTimeString(earliestServiceStart);

    totalTime += travelTime + waitTime + AVERAGE_STOP_TIME;
    totalDistance += distance;

    currentTime = serviceEndTime;
  }

  // Add final leg if not skipping end optimization
  const returnLeg = legs[legs.length - 1];
  const returnTime = returnLeg.duration?.value || 0;
  const returnDistance = returnLeg.distance?.value || 0;
  totalTime += returnTime;
  totalDistance += returnDistance;

  return {
    route,
    totalTime,
    totalDistance,
    timings: {
      segmentTimes,
      distanceSegments,
      suggestedPickupTimes,
      returnTime,
      totalTime,
      totalDistance,
    },
  };
};
