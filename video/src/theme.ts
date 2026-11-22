export const theme = {
  // Paleta serwisu: zieleń ZUS, złoto i granat.
  green: '#007834',
  gold: '#e8a33d',
  navy: '#1d2b3a',
  red: '#c1121f',
  paper: '#ffffff',
  ink: '#1d2b3a',
  muted: '#5b6a63',
  font: '"IBM Plex Sans", system-ui, sans-serif',
}

export const ease = {
  // Jedna krzywa dla całego filmu, żeby ruch był spójny.
  smooth: (value: number) => 1 - Math.pow(1 - value, 3),
  inOut: (value: number) => (value < 0.5 ? 4 * value ** 3 : 1 - Math.pow(-2 * value + 2, 3) / 2),
}