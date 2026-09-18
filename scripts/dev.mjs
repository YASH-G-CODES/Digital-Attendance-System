import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const npmProcess = (args, cwd) => process.platform === "win32"
  ? spawn("cmd.exe", ["/d", "/s", "/c", `npm ${args.join(" ")}`], { cwd, stdio: "inherit" })
  : spawn("npm", args, { cwd, stdio: "inherit" });
const python = process.platform === "win32"
  ? path.join(root, "face-service", "venv", "Scripts", "python.exe")
  : path.join(root, "face-service", "venv", "bin", "python");

const services = [
  npmProcess(["start"], path.join(root, "server")),
  spawn(python, ["-m", "uvicorn", "app:app", "--host", "127.0.0.1", "--port", "8000"], { cwd: path.join(root, "face-service"), stdio: "inherit" }),
  npmProcess(["run", "dev", "--", "--host", "127.0.0.1"], path.join(root, "client")),
];

console.log("\nDigital Attendance System is starting. Open http://localhost:5173\n");

const stop = () => {
  for (const service of services) service.kill();
  process.exit();
};

process.on("SIGINT", stop);
process.on("SIGTERM", stop);
services.forEach((service) => service.on("error", (error) => console.error("Service failed to start:", error.message)));
