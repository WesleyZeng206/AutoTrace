export const floorToMinute = (value: Date) => {
  const next = new Date(value)
  next.setSeconds(0, 0)
  return next
}

export const ceilToMinute = (value: Date) => {
  const next = new Date(value)
  const needsBump = next.getSeconds() !== 0 || next.getMilliseconds() !== 0
  next.setSeconds(0, 0)
  
  if (needsBump) {
    next.setMinutes(next.getMinutes() + 1)
  }
  return next
}

export const normalizeWindow = (start: Date, end: Date) => ({
  start: floorToMinute(start),
  end: ceilToMinute(end),
})
