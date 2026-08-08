import { useEffect, useState } from "react";

function App() {
  const [status, setStatus] = useState<string>("Checking connection...");

  useEffect(() => {
    fetch("http://localhost:5000/api/health")
      .then((res) => res.json())
      .then((data) => setStatus(data.message))
      .catch(() => setStatus("Could not reach backend"));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <h1 className="text-3xl font-bold">Job Tracker — {status}</h1>
    </div>
  );
}

export default App;
