"use client";

import React, { useState, useEffect, useMemo, useRef, Fragment } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Plane, Calendar, Maximize2, X, Eye, Info } from "lucide-react";
import { TimeHeader } from "./timeline/TimeHeader";
import { GateRow } from "./timeline/GateRow";
import { Legend } from "./timeline/Legend";
import {
  getCurrentAmsterdamTime,
  toAmsterdamTime,
  formatAmsterdamTime,
} from "@/lib/amsterdam-time";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface GateGanttData {
  gateID: string;
  pier: string;
  flights: Array<{
    flightName: string;
    flightNumber: string;
    scheduleDateTime: string;
    aircraftType: string;
    destination: string;
    primaryState: string;
    primaryStateReadable: string;
    isDelayed: boolean;
    delayMinutes: number;
    gate: string;
    actualOffBlockTime?: string;
    actualDateTime?: string;
    estimatedDateTime?: string;
    flightStates?: string[];
    expectedTimeBoarding?: string;
  }>;
}

interface GateGanttChartProps {
  gateData: GateGanttData[];
}

export function GateGanttChart({ gateData }: GateGanttChartProps) {
  // Use centralized Amsterdam time utility with periodic updates
  const [currentTime, setCurrentTime] = useState(() =>
    getCurrentAmsterdamTime(),
  );
  const [showAllGates, setShowAllGates] = useState(false);
  const [hoveredFlight, setHoveredFlight] = useState<any>(null);
  const [hoveredPosition, setHoveredPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<any>(null); // For dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  const [expandedGates, setExpandedGates] = useState<Set<string>>(new Set());

  // New state for dynamic features
  const [timeRangeHours, setTimeRangeHours] = useState<6 | 8 | 24>(() => {
    // Default: 6h for mobile, 8h for desktop
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1024 ? 8 : 6;
    }
    return 8;
  });
  const [viewDensity, setViewDensity] = useState<
    "compact" | "normal" | "expanded"
  >("compact");

  // Modal-specific ref for full-screen unified scrolling
  const modalContentScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    // Update current time every second for the clock
    const interval = setInterval(() => {
      setCurrentTime(getCurrentAmsterdamTime());
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);


  // Modal uses unified scrolling - no separate synchronization needed

  // Determine if flight is Intra-European (Schengen/EU) vs Intercontinental
  const isIntraEuropean = (destination: string): boolean => {
    const europeanCountries = [
      // EU + Schengen countries (common airport codes)
      "AMS",
      "BRU",
      "CDG",
      "FRA",
      "MAD",
      "BCN",
      "FCO",
      "MXP",
      "VIE",
      "ZUR",
      "ZRH",
      "MUC",
      "DUS",
      "HAM",
      "STR",
      "CGN",
      "LEJ",
      "NUE",
      "SXF",
      "TXL",
      "HAJ",
      "BER",
      "LHR",
      "LGW",
      "STN",
      "LTN",
      "LCY",
      "NWI",
      "MAN",
      "EDI",
      "GLA",
      "BHX",
      "LBA",
      "ARN",
      "CPH",
      "OSL",
      "BGO",
      "TRD",
      "SVG",
      "HEL",
      "TLL",
      "RIX",
      "VNO",
      "WAW",
      "KRK",
      "GDN",
      "WRO",
      "PRG",
      "BTS",
      "BUD",
      "SOF",
      "OTP",
      "LJU",
      "ZAG",
      "ATH",
      "SKG",
      "HER",
      "CFU",
      "LIS",
      "OPO",
      "DUB",
      "ORK",
      "REY",
      "KEF",
      "MME",
      "GOT",
      "LPI",
      "SPU",
      "LUX",
      "MRS",
      "TRN",
      "BLQ",
      "GVA",
      "BSL",
      "LIN",
      "MIL",
      "BRE",
      "SZG",
      "INN",
      "GRZ",
      "VCE",
      "TSF",
      "BLQ",
      "NAP",
      "CTA",
      "PMO",
      "CAG",
      "ALC",
      "AGP",
      "LEI",
      "BIO",
      "SDR",
      "VGO",
      "LCG",
      "TLS",
      "BOD",
      "NCE",
      "LYS",
      "MPL",
      "NTE",
      "RNS",
      "BIQ",
      "EXT",
      "LIG",
    ];
    return europeanCountries.includes(destination);
  };

  // Calculate flight timeline based on destination type and delays
  const getFlightTimeline = (flight: any) => {
    // API data is already in Amsterdam timezone, no conversion needed for flight times
    const scheduledTime = new Date(flight.scheduleDateTime);
    const currentTime = getCurrentAmsterdamTime();

    // Use actual off-block time if available (flight has departed), 
    // For cancelled flights, always use scheduled time (ignore delays)
    // otherwise use estimated time if delayed, otherwise use scheduled time
    // API data is already in Amsterdam timezone, no conversion needed
    const isCancelled = flight.primaryState === 'CNX' || flight.flightStates?.includes('CNX');
    const actualDepartureTime = flight.actualOffBlockTime
      ? new Date(flight.actualOffBlockTime)
      : isCancelled
      ? scheduledTime  // Cancelled flights stay at original time
      : flight.estimatedDateTime
      ? new Date(flight.estimatedDateTime)
      : scheduledTime;

    // Different gate occupation times based on flight type
    const isEuropean = isIntraEuropean(flight.destination);
    const gateOpenMinutes = isEuropean ? 45 : 60; // EU: 45min, Intercontinental: 60min

    // Calculate original and new gate open times
    const originalGateOpenTime = new Date(
      scheduledTime.getTime() - gateOpenMinutes * 60 * 1000,
    );
    const newGateOpenTime = new Date(
      actualDepartureTime.getTime() - gateOpenMinutes * 60 * 1000,
    );

    let gateOpenTime, gateCloseTime;

    // Check if flight has departed - use actualOffBlockTime if available
    const hasDeparted =
      (flight.flightStates && flight.flightStates.includes("DEP")) ||
      (flight.actualOffBlockTime &&
        new Date(flight.actualOffBlockTime) < currentTime);

    // Simple approach given API limitations
    gateOpenTime = originalGateOpenTime;

    // For departed flights use actual time, for cancelled use scheduled, for delayed use estimated, otherwise scheduled
    const departureTime = flight.actualOffBlockTime
      ? new Date(flight.actualOffBlockTime)
      : isCancelled
      ? scheduledTime  // Cancelled flights stay at original time
      : flight.estimatedDateTime
      ? new Date(flight.estimatedDateTime)
      : scheduledTime;

    // Standard gate close time: exactly at scheduled/estimated departure
    gateCloseTime = departureTime;

    // Dynamic extension logic for GTD flights without off-block time
    if (
      flight.primaryState === "GTD" &&
      !hasDeparted &&
      !flight.actualOffBlockTime &&
      currentTime > departureTime
    ) {
      // Dynamically extend to current time (no buffer)
      gateCloseTime = currentTime;
    } else if (hasDeparted && flight.actualOffBlockTime) {
      // Lock end time at actual off-block time
      gateCloseTime = new Date(flight.actualOffBlockTime);
    }

    return {
      startTime: gateOpenTime,
      endTime: gateCloseTime,
      scheduledTime: scheduledTime,
      actualDepartureTime: actualDepartureTime,
      originalGateOpenTime: originalGateOpenTime,
      newGateOpenTime: newGateOpenTime,
      currentPhase: flight.primaryState,
      isTimelineShifted: flight.isDelayed && flight.estimatedDateTime,
      isExtended: flight.isDelayed && currentTime >= originalGateOpenTime,
      flightType: isEuropean ? "European" : "Intercontinental",
      gateOpenMinutes: gateOpenMinutes,
      hasDeparted: hasDeparted,
      isStillAtGate: !hasDeparted && currentTime > scheduledTime,
    };
  };

  // Dynamic time range based on selected hours
  const { dynamicStartTime, dynamicEndTime } = useMemo(() => {
    if (!mounted) {
      const now = getCurrentAmsterdamTime();
      const start = new Date(now);
      const end = new Date(now);
      end.setTime(start.getTime() + timeRangeHours * 60 * 60 * 1000);
      return { dynamicStartTime: start, dynamicEndTime: end };
    }

    const now = getCurrentAmsterdamTime();
    let start, end;

    if (timeRangeHours === 24) {
      // Full day view: 05:00 to 00:00 (next day)
      start = new Date(now);
      start.setHours(5, 0, 0, 0); // 05:00 today

      end = new Date(now);
      end.setDate(end.getDate() + 1); // Next day
      end.setHours(0, 0, 0, 0); // 00:00 (midnight)
    } else {
      // Dynamic view: current time to +N hours
      start = new Date(now);
      start.setMinutes(0, 0, 0); // Round down to current hour

      end = new Date(start);
      end.setTime(start.getTime() + timeRangeHours * 60 * 60 * 1000);
    }

    console.log("Dynamic timeline range:", {
      hours: timeRangeHours,
      start: start.toISOString(),
      end: end.toISOString(),
      startTime: formatAmsterdamTime(start, "HH:mm"),
      endTime: formatAmsterdamTime(end, "HH:mm"),
    });

    return { dynamicStartTime: start, dynamicEndTime: end };
  }, [mounted, timeRangeHours]);

  // Generate time slots based on dynamic range with adaptive intervals
  const timeSlots = useMemo(() => {
    const slots = [];
    const totalMinutes = Math.ceil(
      (dynamicEndTime.getTime() - dynamicStartTime.getTime()) / (60 * 1000),
    );

    // Adjust interval based on time range for optimal display
    let intervalMinutes;
    if (timeRangeHours === 6) {
      intervalMinutes = 30; // 30-minute intervals for 6 hours
    } else if (timeRangeHours === 8) {
      intervalMinutes = 60; // 1-hour intervals for 8 hours
    } else {
      intervalMinutes = 120; // 2-hour intervals for full day
    }

    const totalIntervals = Math.ceil(totalMinutes / intervalMinutes);

    for (let i = 0; i <= totalIntervals; i++) {
      const slotTime = new Date(
        dynamicStartTime.getTime() + i * intervalMinutes * 60 * 1000,
      );
      slots.push(slotTime);
    }

    return slots;
  }, [mounted, dynamicStartTime, dynamicEndTime, timeRangeHours]);

  // Function to detect overlapping flights and create stacking layout
  const createFlightStacks = (flights: any[]) => {
    try {
      if (flights.length === 0) return [];

      // Get timelines for all flights
      const flightsWithTimelines = flights.map((flight) => ({
        ...flight,
        timeline: getFlightTimeline(flight),
      }));

      // Sort by start time
      flightsWithTimelines.sort(
        (a, b) =>
          a.timeline.startTime.getTime() - b.timeline.startTime.getTime(),
      );

      const stacks: any[][] = [];

      flightsWithTimelines.forEach((flight) => {
        // Find the first stack where this flight doesn't overlap with the last flight
        let assignedToStack = false;

        for (let i = 0; i < stacks.length; i++) {
          const lastFlightInStack = stacks[i][stacks[i].length - 1];

          // Check if current flight starts after the last flight in this stack ends
          if (flight.timeline.startTime >= lastFlightInStack.timeline.endTime) {
            stacks[i].push(flight);
            assignedToStack = true;
            break;
          }
        }

        // If no suitable stack found, create a new one
        if (!assignedToStack) {
          stacks.push([flight]);
        }
      });

      return stacks;
    } catch (error) {
      console.error("Error creating flight stacks:", error);
      // Return simple flat layout as fallback
      return flights.map((flight) => [flight]);
    }
  };

  // Filter and process gate data for the dynamic time range
  const processedGateData = useMemo(() => {
    try {
      const viewStartTime = dynamicStartTime;
      const viewEndTime = dynamicEndTime;

      const filteredData = gateData.map((gate) => {
        try {
          // Filter flights that are visible in current time window
          const visibleFlights = gate.flights.filter((flight) => {
            try {
              // Get the full gate timeline for this flight
              const timeline = getFlightTimeline(flight);

              // Show flight if any part of its gate timeline overlaps with view window
              return (
                timeline.endTime >= viewStartTime &&
                timeline.startTime <= viewEndTime
              );
            } catch (error) {
              console.error("Error processing flight timeline:", error, flight);
              return false;
            }
          });

          // Create stacking layout for this gate's flights
          const flightStacks = createFlightStacks(visibleFlights);

          return {
            ...gate,
            flights: visibleFlights,
            flightStacks: flightStacks,
            maxConcurrentFlights: Math.max(1, flightStacks.length), // Use number of stacks, not total flights
          };
        } catch (error) {
          console.error("Error processing gate:", error, gate);
          return {
            ...gate,
            flights: [],
            flightStacks: [],
            maxConcurrentFlights: 0,
          };
        }
      });

      // Show all gates or only gates with flights based on toggle
      const finalData = showAllGates
        ? filteredData
        : filteredData.filter((gate) => gate.flights.length > 0);

      return finalData.sort((a, b) => a.gateID.localeCompare(b.gateID));
    } catch (error) {
      console.error("Error processing gate data:", error);
      return [];
    }
  }, [mounted, gateData, dynamicStartTime, dynamicEndTime, showAllGates]);

  // Early return for loading state - prevent processing empty data
  if (!gateData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Gate Schedule Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  // Prevent hydration mismatch by showing loading until mounted
  if (!mounted) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Gate Schedule Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Initializing timeline...
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get status color for flight (trust API completely)
  const getStatusColor = (flight: any) => {
    // Use API status directly - no overrides
    const displayStatus = flight.primaryState;

    // If flight has departed (DEP or has actualOffBlockTime), always show as departed regardless of delay
    if (displayStatus === "DEP" || flight.actualOffBlockTime) {
      return "bg-gray-500 border-gray-700"; // Departed - GRAY
    }

    // Check if flight is delayed (but not departed)
    if (flight.isDelayed && flight.delayMinutes > 0) {
      return "bg-red-600 border-red-800"; // Delayed - DARK RED (highest priority)
    }

    switch (displayStatus) {
      case "BRD":
        return "bg-green-500 border-green-700"; // Boarding - GREEN
      case "GTO":
        return "bg-blue-500 border-blue-700"; // Gate Open - BLUE
      case "GCL":
        return "bg-yellow-500 border-yellow-700"; // Gate Closing - YELLOW (Normal priority)
      case "GTD":
        return "bg-orange-500 border-orange-700"; // Gate Closed - ORANGE (Normal priority)
      case "SCH":
        return "bg-purple-500 border-purple-700"; // Scheduled - PURPLE
      case "DEL":
        return "bg-red-600 border-red-800"; // Delayed state - DARK RED
      case "GCH":
        return "bg-amber-500 border-amber-700"; // Gate Change - AMBER (less important than delay)
      case "CNX":
        return "bg-[#BD2F0F] border-[#8B2209]"; // Cancelled - RED
      default:
        return "bg-[#222E50] border-[#1a2340]"; // Unknown - DARK BLUE
    }
  };

  // Calculate position and width for flight bar based on real timeline
  const getFlightBarStyle = (flight: any) => {
    const timeline = getFlightTimeline(flight);
    const viewStartTime = timeSlots[0];
    const viewEndTime = timeSlots[timeSlots.length - 1];

    const totalViewDuration = viewEndTime.getTime() - viewStartTime.getTime();

    // Flight starts when gate opens, ends at departure + 10min
    const flightStartOffset =
      timeline.startTime.getTime() - viewStartTime.getTime();
    const flightEndOffset =
      timeline.endTime.getTime() - viewStartTime.getTime();

    const leftPercent = Math.max(
      0,
      (flightStartOffset / totalViewDuration) * 100,
    );
    const rightPercent = Math.min(
      100,
      (flightEndOffset / totalViewDuration) * 100,
    );
    const widthPercent = rightPercent - leftPercent;

    return {
      left: `${leftPercent}%`,
      width: `${Math.max(widthPercent, 3)}%`, // Minimum 3% for better visibility
      minWidth: "80px", // Ensure better readability
    };
  };

  // Calculate current time position with enhanced precision
  const getCurrentTimePosition = () => {
    const now = currentTime;

    if (!timeSlots || timeSlots.length < 2)
      return { position: 0, isVisible: false };

    // Find which interval the current time falls into
    let intervalIndex = -1;
    for (let i = 0; i < timeSlots.length - 1; i++) {
      if (now >= timeSlots[i] && now < timeSlots[i + 1]) {
        intervalIndex = i;
        break;
      }
    }

    // Handle edge cases
    if (now < timeSlots[0]) {
      return { position: 0, isVisible: true };
    }
    if (now >= timeSlots[timeSlots.length - 1]) {
      intervalIndex = timeSlots.length - 2;
    }

    if (intervalIndex === -1) return { position: 0, isVisible: false };

    // Calculate position within the current interval
    const intervalStart = timeSlots[intervalIndex];
    const intervalEnd = timeSlots[intervalIndex + 1];
    const intervalDuration = intervalEnd.getTime() - intervalStart.getTime();
    const offsetInInterval = now.getTime() - intervalStart.getTime();
    const percentageInInterval = offsetInInterval / intervalDuration;

    // Calculate pixel position
    // Each interval is one column, so position = intervalIndex + percentageInInterval
    const totalIntervals = timeSlots.length - 1;
    const position =
      ((intervalIndex + percentageInInterval) / totalIntervals) * 100;

    return { position, isVisible: true };
  };

  const handleFlightHover = (flight: any, event: React.MouseEvent) => {
    setHoveredFlight(flight);
    setHoveredPosition({ x: event.clientX, y: event.clientY });
  };

  const handleFlightLeave = () => {
    setHoveredFlight(null);
    setHoveredPosition(null);
  };

  const handleFlightClick = (flight: any, gate?: any) => {
    // Enhance flight data with gate information including pier
    const enhancedFlight = {
      ...flight,
      pier: gate?.pier || flight.pier || "N/A",
    };
    setSelectedFlight(enhancedFlight);
    setIsDialogOpen(true);
  };

  const toggleGateExpansion = (gateId: string) => {
    setExpandedGates((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(gateId)) {
        newExpanded.delete(gateId);
      } else {
        newExpanded.add(gateId);
      }
      return newExpanded;
    });
  };

  // Render Gantt chart content - reusable for both normal and full screen views
  const renderGanttContent = (isFullScreen = false) => {
    if (isFullScreen) {
      // Modal version - unified scrolling
      return (
        <div
          className="w-full h-full overflow-y-auto overflow-x-hidden"
          ref={modalContentScrollRef}
        >
          <div className="w-full">
            {/* Time Header - Part of scrollable content */}
            <div className="sticky top-0 bg-white z-10 border-b border-gray-200">
              <div className="h-8 relative bg-gray-50">
                {/* Grey vertical lines with integrated time labels */}
                <div className="absolute inset-0 flex px-6">
                  {timeSlots.slice(0, -1).map((_, index) => (
                    <div
                      key={index}
                      className="border-l border-gray-200 flex-1 relative"
                    >
                      {/* Time label at the start of each interval */}
                      <span className="absolute -left-6 top-1 text-[10px] xs:text-xs text-gray-700 font-medium bg-gray-50 px-1">
                        {timeSlots[index].toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                          timeZone: "Europe/Amsterdam",
                        })}
                      </span>
                    </div>
                  ))}
                  {/* Last time label */}
                  <div className="relative">
                    <span className="absolute -right-6 top-1 text-[10px] xs:text-xs text-gray-700 font-medium bg-gray-50 px-1">
                      {timeSlots[timeSlots.length - 1].toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                        timeZone: "Europe/Amsterdam",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Gates Content */}
            <div className="w-full">
              {processedGateData.map((gate) => (
                <div
                  key={gate.gateID}
                  className="border-b border-gray-100 last:border-b-0"
                >
                  {/* Gate Label Row - Sticky Left */}
                  <div className="flex items-center py-2 px-3 bg-gray-50 border-b border-gray-200 sticky left-0 z-10 shadow-sm">
                    <div className="w-16 text-sm font-medium text-gray-900 flex-shrink-0">
                      {gate.gateID}
                    </div>
                    <div className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                      Pier {gate.pier} • {gate.flights.length} flight
                      {gate.flights.length !== 1 ? "s" : ""}
                    </div>
                  </div>

                  {/* Timeline Bar - Responsive Height Based on Stacks */}
                  <div
                    className="relative bg-white flex border-b border-gray-100"
                    style={{
                      height: `${Math.max(48, ((gate as any).flightStacks?.length || 0) * (viewDensity === "compact" ? 24 : viewDensity === "expanded" ? 48 : 36) + 12)}px`,
                    }}
                  >
                    {/* Grid Background - Full Width */}
                    <div className="absolute inset-0 flex px-6">
                      {timeSlots.slice(0, -1).map((_, index) => (
                        <div
                          key={index}
                          className="border-l border-gray-200 flex-1"
                        />
                      ))}
                    </div>

                    {/* Flight Stacks - Positioned Absolutely */}
                    <div className="absolute inset-0 px-6">
                      {((gate as any).flightStacks || []).map(
                        (stack: any[], stackIndex: number) => (
                          <React.Fragment key={stackIndex}>
                            {stack.map((flight, flightIndex) => {
                              const timeline = getFlightTimeline(flight);
                              const barDuration =
                                timeline.endTime.getTime() -
                                timeline.startTime.getTime();

                              // Calculate positions for both scheduled and actual departure times
                              const scheduledDepartureOffset =
                                timeline.scheduledTime.getTime() -
                                timeline.startTime.getTime();
                              const scheduledDeparturePercent =
                                (scheduledDepartureOffset / barDuration) * 100;

                              const actualDepartureOffset =
                                timeline.actualDepartureTime.getTime() -
                                timeline.startTime.getTime();
                              const actualDeparturePercent =
                                (actualDepartureOffset / barDuration) * 100;

                              // Calculate vertical position based on stack index and view density
                              const densityConfig = {
                                compact: { barHeight: 20, barGap: 24 },
                                normal: { barHeight: 30, barGap: 36 },
                                expanded: { barHeight: 40, barGap: 48 },
                              };
                              const { barHeight, barGap } =
                                densityConfig[viewDensity];
                              const barTop = 6 + stackIndex * barGap;

                              return (
                                <div
                                  key={`${stackIndex}-${flightIndex}`}
                                  className={`absolute rounded border cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md hover:z-10 ${getStatusColor(flight)}`}
                                  style={{
                                    ...getFlightBarStyle(flight),
                                    top: `${barTop}px`,
                                    height: `${barHeight}px`,
                                  }}
                                  onMouseEnter={(e) =>
                                    handleFlightHover(flight, e)
                                  }
                                  onMouseLeave={handleFlightLeave}
                                  onMouseMove={(e) =>
                                    setHoveredPosition({
                                      x: e.clientX,
                                      y: e.clientY,
                                    })
                                  }
                                  onClick={() =>
                                    handleFlightClick(flight, gate)
                                  }
                                  title={(() => {
                                    const timeline = getFlightTimeline(flight);
                                    if (
                                      timeline.isStillAtGate &&
                                      flight.primaryState === "GTD"
                                    ) {
                                      return `${flight.flightName} - Still at gate`;
                                    }
                                    return flight.flightName;
                                  })()}
                                >
                                  <div className="h-full flex items-center justify-center text-white text-xs font-medium px-1 overflow-hidden">
                                    <span className="truncate">{flight.flightName}</span>
                                    {/* Show indicator if flight is still at gate past scheduled time */}
                                    {(() => {
                                      const timeline =
                                        getFlightTimeline(flight);
                                      if (
                                        timeline.isStillAtGate &&
                                        flight.primaryState === "GTD"
                                      ) {
                                        // Calculate approximate width to determine which label to show
                                        const barStyle = getFlightBarStyle(flight);
                                        const widthPercent = parseFloat(barStyle.width);
                                        
                                        // Adaptive text based on available width
                                        let labelText = "AT GATE";
                                        if (widthPercent < 8) {
                                          labelText = "AG";
                                        } else if (widthPercent < 12) {
                                          labelText = "@GATE";
                                        }
                                        
                                        return (
                                          <span 
                                            className="ml-1 px-0.5 py-0.5 bg-white bg-opacity-30 rounded text-[8px] font-bold animate-pulse flex-shrink-0"
                                            title="Still at gate"
                                          >
                                            {labelText}
                                          </span>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </div>

                                  {/* Departure Time Indicators */}
                                  {timeline.isTimelineShifted && (
                                    /* Original scheduled time (dashed gray) - only show if delayed */
                                    <div
                                      className="absolute top-1 bottom-1 w-0.5 border-l-2 border-dashed border-gray-400"
                                      style={{
                                        left: `${Math.max(0, Math.min(100, scheduledDeparturePercent))}%`,
                                      }}
                                      title={`Original: ${timeline.scheduledTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Amsterdam" })}`}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </React.Fragment>
                        ),
                      )}

                      {/* Current Time Indicator - Simple Line */}
                      {(() => {
                        const { position, isVisible } =
                          getCurrentTimePosition();

                        if (!isVisible) return null;

                        return (
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
                            style={{
                              left: `${position}%`,
                              transform: "translateX(-0.5px)",
                            }}
                          />
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ))}

              {/* No Data State */}
              {processedGateData.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Plane className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  {showAllGates ? (
                    <div>
                      <p>No gates available</p>
                      <p className="text-xs">No gate data found</p>
                    </div>
                  ) : (
                    <div>
                      <p>
                        No gates with upcoming flights in the selected time
                        range
                      </p>
                      <p className="text-xs">
                        Try selecting a longer time range or toggle "Show all
                        gates"
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Main component version - no horizontal scrolling
    const containerClass = "w-full";
    const headerClass = "sticky top-0 bg-white z-10 border-b border-gray-200";
    const contentClass = "overflow-x-hidden";

    return (
      <div className={containerClass}>
        {/* Time Header */}
        <div className={headerClass}>
          <div className="h-8 relative bg-gray-50">
            {/* Grey vertical lines with integrated time labels */}
            <div className="absolute inset-0 flex px-6">
              {timeSlots.slice(0, -1).map((_, index) => (
                <div
                  key={index}
                  className="border-l border-gray-200 flex-1 relative"
                >
                  {/* Time label at the start of each interval */}
                  <span className="absolute -left-6 top-1 text-[10px] xs:text-xs text-gray-700 font-medium bg-gray-50 px-1">
                    {timeSlots[index].toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                      timeZone: "Europe/Amsterdam",
                    })}
                  </span>
                </div>
              ))}
              {/* Last time label */}
              <div className="relative">
                <span className="absolute -right-6 top-1 text-[10px] xs:text-xs text-gray-700 font-medium bg-gray-50 px-1">
                  {timeSlots[timeSlots.length - 1].toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                    timeZone: "Europe/Amsterdam",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Gates Content */}
        <div className={contentClass}>
          <div className="w-full">
            {processedGateData.map((gate) => (
              <div
                key={gate.gateID}
                className="border-b border-gray-100 last:border-b-0"
              >
                {/* Gate Label Row - Sticky Left */}
                <div className="flex items-center py-2 px-3 bg-gray-50 border-b border-gray-200 sticky left-0 z-10 shadow-sm">
                  <div className="w-16 text-sm font-medium text-gray-900 flex-shrink-0">
                    {gate.gateID}
                  </div>
                  <div className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                    Pier {gate.pier} • {gate.flights.length} flight
                    {gate.flights.length !== 1 ? "s" : ""}
                  </div>
                </div>

                {/* Timeline Bar - Responsive Height Based on Stacks */}
                <div
                  className="relative bg-white flex border-b border-gray-100"
                  style={{
                    height: `${Math.max(48, ((gate as any).flightStacks?.length || 0) * (viewDensity === "compact" ? 24 : viewDensity === "expanded" ? 48 : 36) + 12)}px`,
                  }}
                >
                  {/* Grid Background - Full Width */}
                  <div className="absolute inset-0 flex px-6">
                    {timeSlots.slice(0, -1).map((_, index) => (
                      <div
                        key={index}
                        className="border-l border-gray-200 flex-1"
                      />
                    ))}
                  </div>

                  {/* Flight Stacks - Positioned Absolutely */}
                  <div className="absolute inset-0 px-6">
                    {((gate as any).flightStacks || []).map(
                      (stack: any[], stackIndex: number) => (
                        <React.Fragment key={stackIndex}>
                          {stack.map((flight, flightIndex) => {
                            const timeline = getFlightTimeline(flight);
                            const barDuration =
                              timeline.endTime.getTime() -
                              timeline.startTime.getTime();

                            // Calculate positions for both scheduled and actual departure times
                            const scheduledDepartureOffset =
                              timeline.scheduledTime.getTime() -
                              timeline.startTime.getTime();
                            const scheduledDeparturePercent =
                              (scheduledDepartureOffset / barDuration) * 100;

                            const actualDepartureOffset =
                              timeline.actualDepartureTime.getTime() -
                              timeline.startTime.getTime();
                            const actualDeparturePercent =
                              (actualDepartureOffset / barDuration) * 100;

                            // Calculate vertical position based on stack index and view density
                            const densityConfig = {
                              compact: { barHeight: 20, barGap: 24 },
                              normal: { barHeight: 30, barGap: 36 },
                              expanded: { barHeight: 40, barGap: 48 },
                            };
                            const { barHeight, barGap } =
                              densityConfig[viewDensity];
                            const barTop = 6 + stackIndex * barGap;

                            return (
                              <div
                                key={`${stackIndex}-${flightIndex}`}
                                className={`absolute rounded border cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md hover:z-10 ${getStatusColor(flight)}`}
                                style={{
                                  ...getFlightBarStyle(flight),
                                  top: `${barTop}px`,
                                  height: `${barHeight}px`,
                                }}
                                onMouseEnter={(e) =>
                                  handleFlightHover(flight, e)
                                }
                                onMouseLeave={handleFlightLeave}
                                onMouseMove={(e) =>
                                  setHoveredPosition({
                                    x: e.clientX,
                                    y: e.clientY,
                                  })
                                }
                                onClick={() => handleFlightClick(flight, gate)}
                                title={(() => {
                                  const timeline = getFlightTimeline(flight);
                                  if (
                                    timeline.isStillAtGate &&
                                    flight.primaryState === "GTD"
                                  ) {
                                    return `${flight.flightName} - Still at gate`;
                                  }
                                  return flight.flightName;
                                })()}
                              >
                                <div className="h-full flex items-center justify-center text-white text-xs font-medium px-1 overflow-hidden">
                                  <span className="truncate">{flight.flightName}</span>
                                  {/* Show indicator if flight is still at gate past scheduled time */}
                                  {(() => {
                                    const timeline = getFlightTimeline(flight);
                                    if (
                                      timeline.isStillAtGate &&
                                      flight.primaryState === "GTD"
                                    ) {
                                      // Calculate approximate width to determine which label to show
                                      const barStyle = getFlightBarStyle(flight);
                                      const widthPercent = parseFloat(barStyle.width);
                                      
                                      // Adaptive text based on available width
                                      let labelText = "AT GATE";
                                      if (widthPercent < 8) {
                                        labelText = "AG";
                                      } else if (widthPercent < 12) {
                                        labelText = "@GATE";
                                      }
                                      
                                      return (
                                        <span 
                                          className="ml-1 px-0.5 py-0.5 bg-white bg-opacity-30 rounded text-[8px] font-bold animate-pulse flex-shrink-0"
                                          title="Still at gate"
                                        >
                                          {labelText}
                                        </span>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>

                                {/* Departure Time Indicators */}
                                {timeline.isTimelineShifted && (
                                  /* Original scheduled time (dashed gray) - only show if delayed */
                                  <div
                                    className="absolute top-1 bottom-1 w-0.5 border-l-2 border-dashed border-gray-400"
                                    style={{
                                      left: `${Math.max(0, Math.min(100, scheduledDeparturePercent))}%`,
                                    }}
                                    title={`Original: ${timeline.scheduledTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Amsterdam" })}`}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </React.Fragment>
                      ),
                    )}

                    {/* Current Time Indicator - Simple Line */}
                    {(() => {
                      const { position, isVisible } = getCurrentTimePosition();

                      if (!isVisible) return null;

                      return (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
                          style={{
                            left: `${position}%`,
                            transform: "translateX(-0.5px)",
                          }}
                        />
                      );
                    })()}
                  </div>
                </div>
              </div>
            ))}

            {/* No Data State */}
            {processedGateData.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Plane className="w-8 h-8 mx-auto mb-2 opacity-50" />
                {showAllGates ? (
                  <div>
                    <p>No gates available</p>
                    <p className="text-xs">No gate data found</p>
                  </div>
                ) : (
                  <div>
                    <p>
                      No gates with upcoming flights in the selected time range
                    </p>
                    <p className="text-xs">
                      Try selecting a longer time range or toggle "Show all
                      gates"
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Fragment>
      <Card className="w-full max-w-full overflow-hidden">
        <CardHeader className="pb-2 px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <CardTitle className="text-base sm:text-lg">
                Gate Schedule Timeline
              </CardTitle>
              {/* Live Amsterdam Time Clock */}
              <div className="flex items-center gap-1 ml-3 px-2 py-1 bg-blue-50 rounded-md">
                <Clock className="w-3 h-3 text-blue-600" />
                <span className="text-sm font-mono font-medium text-blue-700">
                  {currentTime.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: false,
                    timeZone: "Europe/Amsterdam",
                  })}
                </span>
                <span className="text-xs text-blue-600 ml-1">AMS</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
              {/* Time Range Selector */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-700">
                  Time Range:
                </label>
                <select
                  value={timeRangeHours}
                  onChange={(e) =>
                    setTimeRangeHours(Number(e.target.value) as 6 | 12 | 24)
                  }
                  className="text-xs px-2 py-1 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value={6}>Next 6 hours</option>
                  <option value={8}>Next 8 hours</option>
                  <option value={24}>Full day (05:00-00:00)</option>
                </select>
              </div>


              {/* All Gates Toggle */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-700 whitespace-nowrap">
                  Show all gates
                </label>
                <button
                  onClick={() => setShowAllGates(!showAllGates)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                    showAllGates ? "bg-blue-600" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      showAllGates ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Full Screen Toggle - Only on large screens */}
              <button
                onClick={() => setIsFullScreenOpen(true)}
                className="hidden lg:inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
              >
                <Eye className="h-4 w-4" />
                View All
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-600">
            {showAllGates
              ? `All gates • ${processedGateData.length} gates displayed • ${processedGateData.filter((g) => g.flights.length > 0).length} with flights`
              : `Gates with flights only • ${processedGateData.length} gates displayed • ${
                  processedGateData.filter((g) => 
                    g.flights.some((f: any) => 
                      f.flightStates?.includes('BRD') || 
                      f.flightStates?.includes('GTO') ||
                      f.flightStates?.includes('GCL') ||
                      f.flightStates?.includes('GTD')
                    )
                  ).length
                } active`}
            {" • Timeline shows "}
            {timeRangeHours === 6
              ? "30-minute"
              : timeRangeHours === 8
                ? "1-hour"
                : "2-hour"}
            {" intervals"}
          </p>
        </CardHeader>

        <CardContent className="p-0">
          {/* Mobile and Medium Screen Card View - Monday.com style */}
          <div className="block lg:hidden">
            <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {processedGateData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Plane className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No active gates</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {processedGateData.map((gate) => {
                    const isExpanded = expandedGates.has(gate.gateID);
                    return (
                      <div key={gate.gateID} className="p-2 sm:p-3 md:p-4">
                        <div
                          className="flex items-center justify-between mb-2 cursor-pointer select-none"
                          onClick={() => toggleGateExpansion(gate.gateID)}
                        >
                          <div className="flex items-center gap-2">
                            <svg
                              className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                            <span className="font-semibold text-xs sm:text-sm">
                              {gate.gateID}
                            </span>
                            <span className="text-[10px] sm:text-xs text-gray-500">
                              Pier {gate.pier}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] sm:text-xs text-gray-600">
                              {gate.flights.length} flights
                            </span>
                            {gate.flights.some(
                              (f: any) => f.publicFlightState === "DEL",
                            ) && (
                              <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">
                                Delays
                              </span>
                            )}
                          </div>
                        </div>
                        {isExpanded ? (
                          <div className="space-y-1.5 sm:space-y-2 ml-5 animate-in fade-in-0 slide-in-from-top-1 duration-200">
                            {gate.flights.map((flight, idx) => {
                              const timeline = getFlightTimeline(flight);
                              return (
                                <div
                                  key={idx}
                                  className={`rounded-lg p-1.5 sm:p-2 text-white text-[10px] sm:text-xs ${getStatusColor(flight)} cursor-pointer hover:opacity-90 transition-opacity`}
                                  onClick={() =>
                                    handleFlightClick(flight, gate)
                                  }
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1 sm:gap-2">
                                      <span className="font-medium">
                                        {flight.flightName}
                                      </span>
                                      <span className="opacity-90 truncate max-w-[80px] sm:max-w-[120px]">
                                        {flight.destination}
                                      </span>
                                      {/* Show AT GATE indicator */}
                                      {timeline.isStillAtGate && flight.primaryState === "GTD" && (
                                        <span className="ml-1 px-0.5 py-0.5 bg-white bg-opacity-30 rounded text-[8px] font-bold animate-pulse">
                                          @GATE
                                        </span>
                                      )}
                                    </div>
                                    {flight.isDelayed && (
                                      <span className="text-[9px] sm:text-[10px] bg-red-600 bg-opacity-30 px-1 sm:px-1.5 py-0.5 rounded">
                                        +{flight.delayMinutes}m
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between mt-0.5 sm:mt-1 text-[9px] sm:text-[10px] opacity-80">
                                    <span>
                                      {timeline.startTime.toLocaleTimeString(
                                        "en-US",
                                        {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                          hour12: false,
                                        },
                                      )}{" "}
                                      -{" "}
                                      {timeline.endTime.toLocaleTimeString(
                                        "en-US",
                                        {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                          hour12: false,
                                        },
                                      )}
                                    </span>
                                    <span>{flight.publicFlightState}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : gate.flights.length > 0 ? (
                          <div className="ml-5 mt-1 flex items-center gap-2 text-[10px] sm:text-xs text-gray-500">
                            <span>
                              Next: {gate.flights[0].flightName} →{" "}
                              {gate.flights[0].destination}
                            </span>
                            <span className="text-gray-400">
                              {getFlightTimeline(
                                gate.flights[0],
                              ).startTime.toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              })}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Desktop Gantt Chart - Only on Large Screens */}
          <div className="hidden lg:block h-[500px] lg:h-[600px] xl:h-[700px] 2xl:h-[800px] overflow-y-auto overflow-x-hidden relative">
            {renderGanttContent(false)}
          </div>

          {/* Legend - Using the Legend component */}
          <Legend />
        </CardContent>

        {/* Hover Tooltip */}
        {hoveredFlight &&
          hoveredPosition &&
          (() => {
            const timeline = getFlightTimeline(hoveredFlight);
            return (
              <div
                className="fixed z-50 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-xs max-w-xs pointer-events-none"
                style={{
                  left: `${hoveredPosition.x + 10}px`,
                  top: `${hoveredPosition.y - 10}px`,
                  transform: "translateY(-100%)",
                }}
              >
                <div className="font-medium flex items-center gap-2">
                  {hoveredFlight.flightName}
                  {timeline.isStillAtGate && hoveredFlight.primaryState === "GTD" && (
                    <span className="px-1.5 py-0.5 bg-orange-600 bg-opacity-30 rounded text-[10px] font-bold animate-pulse">
                      STILL AT GATE
                    </span>
                  )}
                </div>
                <div className="text-gray-300">
                  {hoveredFlight.destination} • {hoveredFlight.aircraftType}
                </div>

                {/* Enhanced Departure Times with Timeline Info */}
                <div className="border-t border-gray-600 pt-1 mt-1">
                  <div className="text-gray-400 text-xs">Flight Times:</div>

                  {/* Original Scheduled Time */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-xs">
                      Original Scheduled:
                    </span>
                    <span className="text-gray-300">
                      {timeline.scheduledTime.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                        timeZone: "Europe/Amsterdam",
                      })}
                    </span>
                  </div>

                  {/* Actual/Estimated Departure Time */}
                  <div className="flex justify-between items-center">
                    <span className="text-yellow-300 text-xs">
                      Actual Departure:
                    </span>
                    <span className="text-yellow-300 font-medium">
                      {timeline.actualDepartureTime.toLocaleTimeString(
                        "en-US",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                          timeZone: "Europe/Amsterdam",
                        },
                      )}
                    </span>
                  </div>

                  {/* Show delay if exists */}
                  {hoveredFlight.isDelayed &&
                    hoveredFlight.delayMinutes > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-red-300 text-xs">Delay:</span>
                        <span className="text-red-300 font-medium">
                          +{hoveredFlight.delayMinutes}min
                        </span>
                      </div>
                    )}

                  {/* Gate Timeline Info */}
                  <div className="border-t border-gray-700 pt-1 mt-1">
                    <div className="text-gray-400 text-xs">Gate Timeline:</div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-300 text-xs">Gate Opens:</span>
                      <span className="text-blue-300">
                        {timeline.startTime.toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                          timeZone: "Europe/Amsterdam",
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-300 text-xs">
                        Gate Closes:
                      </span>
                      <span className="text-blue-300">
                        {timeline.endTime.toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                          timeZone: "Europe/Amsterdam",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs">Status:</span>
                  <span
                    className={`text-xs ${hoveredFlight.isDelayed ? "text-red-300" : "text-green-300"}`}
                  >
                    {hoveredFlight.primaryStateReadable}
                  </span>
                </div>

                {/* Click hint */}
                <div className="border-t border-gray-600 pt-1 mt-1 text-center">
                  <span className="text-gray-400 text-xs italic">
                    Click for details
                  </span>
                </div>
              </div>
            );
          })()}
      </Card>

      {/* Full Screen Modal */}
      {isFullScreenOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white sm:rounded-lg shadow-xl w-full h-full sm:w-[calc(100%-2rem)] sm:h-[calc(100%-2rem)] sm:max-h-[calc(100vh-2rem)] flex flex-col">
            <div className="flex flex-col p-3 sm:p-6 border-b bg-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0" />
                  <h2 className="text-base sm:text-xl font-semibold text-gray-900">
                    Gate Schedule Timeline
                  </h2>
                  <span className="hidden sm:inline text-sm text-gray-500">
                    ({processedGateData.length} gates •{" "}
                    {processedGateData.filter((g) => g.flights.length > 0).length}{" "}
                    with flights)
                  </span>
                </div>
                <button
                  onClick={() => setIsFullScreenOpen(false)}
                  className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                  aria-label="Close fullscreen"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                </button>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                {/* Time Range Selector */}
                <div className="flex items-center gap-1 sm:gap-2">
                  <label className="text-[10px] sm:text-xs font-medium text-gray-700 whitespace-nowrap">
                    Time:
                  </label>
                  <select
                    value={timeRangeHours}
                    onChange={(e) =>
                      setTimeRangeHours(Number(e.target.value) as 6 | 8 | 24)
                    }
                    className="text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value={6}>6h</option>
                    <option value={8}>8h</option>
                    <option value={24}>24h</option>
                  </select>
                </div>

                {/* Controls in full screen */}
                <div className="flex items-center gap-1 sm:gap-2">
                  <label className="text-[10px] sm:text-xs font-medium text-gray-700 whitespace-nowrap">
                    All gates
                  </label>
                  <button
                    onClick={() => setShowAllGates(!showAllGates)}
                    className={`relative inline-flex h-4 w-7 sm:h-5 sm:w-9 items-center rounded-full transition-colors cursor-pointer ${
                      showAllGates ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-2.5 w-2.5 sm:h-3 sm:w-3 transform rounded-full bg-white transition-transform ${
                        showAllGates ? "translate-x-4 sm:translate-x-5" : "translate-x-0.5 sm:translate-x-1"
                      }`}
                    />
                  </button>
                </div>

              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              {renderGanttContent(true)}
            </div>

            {/* Legend in full screen */}
            <Legend />
          </div>
        </div>
      )}

      {/* Flight Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-w-[calc(100vw-2rem)] sm:max-h-[90vh] max-h-[85vh] overflow-y-auto rounded-2xl sm:rounded-lg mx-2 sm:mx-auto">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base sm:text-xl font-bold">
              Flight {selectedFlight?.flightName} Details
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {selectedFlight?.destination} • {selectedFlight?.aircraftType}
            </DialogDescription>
          </DialogHeader>

          {selectedFlight &&
            (() => {
              const timeline = getFlightTimeline(selectedFlight);
              // Calculate actual delay from timeline data
              const actualDelayMinutes = Math.max(0, 
                Math.round((timeline.actualDepartureTime.getTime() - timeline.scheduledTime.getTime()) / (1000 * 60))
              );
              // Use calculated delay or API delay, whichever is greater
              const delayMinutes = Math.max(selectedFlight.delayMinutes || 0, actualDelayMinutes);

              return (
                <div className="space-y-3 sm:space-y-6">
                  {/* Flight Information */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <h3 className="font-semibold text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">
                        Flight Information
                      </h3>
                      <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Flight Number:</span>
                          <span className="font-medium">
                            {selectedFlight.flightName}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Destination:</span>
                          <span className="font-medium">
                            {selectedFlight.destination}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Aircraft Type:</span>
                          <span className="font-medium">
                            {selectedFlight.aircraftType}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Gate:</span>
                          <span className="font-medium">
                            {selectedFlight.gate}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Pier:</span>
                          <span className="font-medium">
                            {selectedFlight.pier}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">
                        Status Information
                      </h3>
                      <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Status:</span>
                          <span
                            className={`font-medium ${selectedFlight.isDelayed ? "text-red-600" : "text-green-600"}`}
                          >
                            {selectedFlight.primaryState === 'DEP' ? 'Departed' : 
                             selectedFlight.primaryState === 'BRD' ? 'Boarding' :
                             selectedFlight.primaryState === 'GTO' ? 'Gate Open' :
                             selectedFlight.primaryState === 'GCL' ? 'Gate Closing' :
                             selectedFlight.primaryState === 'GTD' ? 'Gate Closed' :
                             selectedFlight.primaryState === 'SCH' ? 'Scheduled' :
                             selectedFlight.primaryState === 'DEL' ? 'Delayed' :
                             selectedFlight.primaryState === 'CNX' ? 'Cancelled' :
                             selectedFlight.primaryState === 'GCH' ? 'Gate Change' :
                             selectedFlight.primaryStateReadable}
                          </span>
                        </div>
                        {/* Show all flight states */}
                        {selectedFlight.flightStates &&
                          selectedFlight.flightStates.length > 1 && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">All States:</span>
                              <span className="text-right">
                                {selectedFlight.flightStatesReadable.join(", ")}
                              </span>
                            </div>
                          )}
                        {/* Show gate change explicitly if present */}
                        {selectedFlight.flightStates &&
                          selectedFlight.flightStates.includes("GCH") && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">
                                Gate Changed:
                              </span>
                              <span className="font-medium text-amber-600">
                                Yes
                              </span>
                            </div>
                          )}
                        {delayMinutes > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Delay:</span>
                            <span className="font-medium text-red-600">
                              {delayMinutes > 60
                                ? `${Math.floor(delayMinutes / 60)}h ${delayMinutes % 60}m`
                                : `${delayMinutes}min`}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-500">Flight Type:</span>
                          <span className="font-medium">
                            {isIntraEuropean(selectedFlight.destination)
                              ? "Intra-European"
                              : "Intercontinental"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Departure Times - Added to Status section */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <h3 className="font-semibold text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">
                        Departure Times
                      </h3>
                      <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Scheduled:</span>
                          <span className="font-medium">
                            {timeline.scheduledTime.toLocaleTimeString(
                              "en-US",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                                timeZone: "Europe/Amsterdam",
                              },
                            )}
                          </span>
                        </div>
                        {selectedFlight.actualOffBlockTime ? (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Actual:</span>
                            <span className={`font-medium ${selectedFlight.isDelayed ? "text-red-600" : ""}`}>
                              {new Date(selectedFlight.actualOffBlockTime).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                  timeZone: "Europe/Amsterdam",
                                },
                              )}
                            </span>
                          </div>
                        ) : selectedFlight.isDelayed && timeline.actualDepartureTime ? (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Estimated:</span>
                            <span className="font-medium text-orange-600">
                              {timeline.actualDepartureTime.toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                  timeZone: "Europe/Amsterdam",
                                },
                              )}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Timeline Information */}
                  <div>
                    <h3 className="font-semibold text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">
                      Timeline Details
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-2 sm:p-4 space-y-2 sm:space-y-3">
                      <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                        <div>
                          <span className="text-gray-500 block mb-1">
                            Scheduled Departure:
                          </span>
                          <span className="font-medium">
                            {timeline.scheduledTime.toLocaleTimeString(
                              "en-US",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                                timeZone: "Europe/Amsterdam",
                              },
                            )}{" "}
                            AMS
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 block mb-1">
                            {selectedFlight.isDelayed
                              ? "Estimated Departure:"
                              : "Actual Departure:"}
                          </span>
                          <span
                            className={`font-medium ${selectedFlight.isDelayed ? "text-red-600" : ""}`}
                          >
                            {timeline.actualDepartureTime.toLocaleTimeString(
                              "en-US",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                                timeZone: "Europe/Amsterdam",
                              },
                            )}{" "}
                            AMS
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 block mb-1">
                            Gate Opens:
                          </span>
                          <span className="font-medium">
                            {timeline.startTime.toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                              timeZone: "Europe/Amsterdam",
                            })}{" "}
                            AMS
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 block mb-1">
                            Gate Closes:
                          </span>
                          <span className="font-medium">
                            {timeline.endTime.toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                              timeZone: "Europe/Amsterdam",
                            })}{" "}
                            AMS
                          </span>
                        </div>
                      </div>

                      {/* Visual Timeline */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`absolute h-full ${getStatusColor(selectedFlight)}`}
                            style={{
                              left: "0%",
                              width: "100%",
                            }}
                          />
                          {timeline.isTimelineShifted && (
                            <>
                              <div
                                className="absolute top-1 bottom-1 w-0.5 border-l-2 border-dashed border-gray-400"
                                style={{
                                  left: `${
                                    ((timeline.scheduledTime.getTime() -
                                      timeline.startTime.getTime()) /
                                      (timeline.endTime.getTime() -
                                        timeline.startTime.getTime())) *
                                    100
                                  }%`,
                                }}
                              />
                              <div
                                className="absolute top-0 bottom-0 w-0.5 bg-gray-400"
                                style={{
                                  left: `${
                                    ((timeline.actualDepartureTime.getTime() -
                                      timeline.startTime.getTime()) /
                                      (timeline.endTime.getTime() -
                                        timeline.startTime.getTime())) *
                                    100
                                  }%`,
                                }}
                              />
                            </>
                          )}
                          {/* Current Time Indicator */}
                          {(() => {
                            const currentTimeOffset =
                              currentTime.getTime() -
                              timeline.startTime.getTime();
                            const totalDuration =
                              timeline.endTime.getTime() -
                              timeline.startTime.getTime();
                            const currentTimePercent =
                              (currentTimeOffset / totalDuration) * 100;

                            // Debug logging
                            console.log("Dialog Timeline Debug:", {
                              currentTime: currentTime.toISOString(),
                              startTime: timeline.startTime.toISOString(),
                              endTime: timeline.endTime.toISOString(),
                              currentTimePercent,
                              flight: selectedFlight?.flightName,
                            });

                            // Show indicator if current time is within a reasonable range (extend beyond exact bounds)
                            if (
                              currentTimePercent >= -10 &&
                              currentTimePercent <= 110
                            ) {
                              return (
                                <div
                                  className="absolute top-0 bottom-0 w-1 bg-red-500 z-30 shadow-lg"
                                  style={{
                                    left: `${Math.max(0, Math.min(100, currentTimePercent))}%`,
                                  }}
                                  title={`Current Time: ${currentTime.toLocaleTimeString(
                                    "en-US",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: false,
                                      timeZone: "Europe/Amsterdam",
                                    },
                                  )} AMS (${currentTimePercent.toFixed(1)}%)`}
                                />
                              );
                            }
                            return null;
                          })()}
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Gate Opens</span>
                          <span>Departure</span>
                          <span>Gate Closes</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Notes */}
                  {selectedFlight.flightStates &&
                    selectedFlight.flightStates.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-sm text-gray-600 mb-2">
                          Flight States
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedFlight.flightStates.map(
                            (state: string, index: number) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                              >
                                {state}
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                </div>
              );
            })()}
        </DialogContent>
      </Dialog>
    </Fragment>
  );
}
