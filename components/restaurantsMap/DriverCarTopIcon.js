import React from 'react'
import Svg, { Path } from 'react-native-svg'
import {
  DRIVER_CAR_TOP_PATH_D,
  DRIVER_CAR_TOP_VIEWBOX,
} from '../../assets/maps/driverCarTop'

const VIEWBOX_WIDTH = 313

export default function DriverCarTopIcon({ size, color }) {
  const strokeW = Math.max(3, (1.6 * VIEWBOX_WIDTH) / size)
  return (
    <Svg
      width={size}
      height={size}
      viewBox={DRIVER_CAR_TOP_VIEWBOX}
      preserveAspectRatio="xMidYMid meet"
    >
      <Path
        d={DRIVER_CAR_TOP_PATH_D}
        fill="#ffffff"
        fillRule="evenodd"
        clipRule="evenodd"
        stroke={color}
        strokeWidth={strokeW}
        strokeMiterlimit={22.926}
      />
    </Svg>
  )
}
