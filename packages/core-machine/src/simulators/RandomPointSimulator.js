export function startRandomPointSimulator(session, intervalMs = 20) {
  const timer = setInterval(() => {
    session.ingest({
      x: Math.random() * 10000,
      y: Math.random() * 10000,
    });
  }, intervalMs);

  return () => clearInterval(timer);
}
