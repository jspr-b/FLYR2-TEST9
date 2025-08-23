import React, { useMemo } from 'react';

interface FlightState {
  flightStates: string[];
}

interface FlightStatusComponentProps {
  flight: {
    publicFlightState: FlightState;
  };
}

const FlightStatusComponent: React.FC<FlightStatusComponentProps> = ({ flight }) => {
  const metrics = useMemo(() => {
    const states = flight?.publicFlightState?.flightStates || [];
    
    const hasState = (state: string) => states.includes(state);
    
    return {
      isOperational: hasState('SCH') && !hasState('CNX'),
      isDelayed: hasState('DEL'),
      isBoarding: hasState('BRD'),
      hasGateChange: hasState('GCH')
    };
  }, [flight?.publicFlightState?.flightStates]);

  return (
    <div className="mt-4 space-y-2">
      <div className="text-sm font-medium text-gray-700">Operational Impact:</div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-gray-600">Flight Status</div>
          <div className={`text-lg font-bold ${metrics.isOperational ? 'text-green-600' : 'text-red-600'}`}>
            {metrics.isOperational ? 'Operational' : 'Cancelled'}
          </div>
        </div>
        
        <div>
          <div className="text-xs text-gray-600">Delay Status</div>
          <div className={`text-lg font-bold ${metrics.isDelayed ? 'text-amber-600' : 'text-blue-600'}`}>
            {metrics.isDelayed ? 'Delayed' : 'On Time'}
          </div>
        </div>
        
        <div>
          <div className="text-xs text-gray-600">Boarding Status</div>
          <div className={`text-lg font-bold ${metrics.isBoarding ? 'text-green-600' : 'text-gray-600'}`}>
            {metrics.isBoarding ? 'Boarding' : 'Not Boarding'}
          </div>
        </div>
        
        <div>
          <div className="text-xs text-gray-600">Gate Change</div>
          <div className={`text-lg font-bold ${metrics.hasGateChange ? 'text-orange-600' : 'text-blue-600'}`}>
            {metrics.hasGateChange ? 'Changed' : 'No Change'}
          </div>
        </div>
      </div>
      
      <div className="text-xs text-gray-500 mt-2">
        Flight status determined based on current flight states received from API
      </div>
    </div>
  );
};

export default FlightStatusComponent;