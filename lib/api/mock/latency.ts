// Simulate 150–600ms of network latency so the mock feels real and loading
// states actually render.
export function latency(min = 150, max = 600): Promise<void> {
  const ms = Math.floor(min + Math.random() * (max - min));
  return new Promise((resolve) => setTimeout(resolve, ms));
}
