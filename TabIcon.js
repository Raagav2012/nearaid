import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

export default function TabIcon({ name, color }) {
  const p = { stroke: color, strokeWidth: 2, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      {name === 'alert' && <Path d="M2 12h5l2-6 4 12 2-6h7" {...p} />}
      {name === 'responder' && <Path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" {...p} />}
      {name === 'tutorials' && (
        <>
          <Circle cx="12" cy="12" r="9" {...p} />
          <Path d="M10 8.5l6 3.5-6 3.5z" {...p} />
        </>
      )}
      {name === 'settings' && (
        <>
          <Path d="M4 7h9M19 7h1M4 17h1M11 17h9" {...p} />
          <Circle cx="16" cy="7" r="2.5" {...p} />
          <Circle cx="8" cy="17" r="2.5" {...p} />
        </>
      )}
    </Svg>
  );
}
