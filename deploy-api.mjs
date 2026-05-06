import * as ftp from "basic-ftp";
import fs from "fs";
import path from "path";

// Charger .env du repo racine
const envPath = path.resolve(".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2].trim();
  }
}

const HOST = process.env.FTP_HOST || "ftp.genius-universe.com";
const USER = process.env.FTP_USER_API || "apieducative@genius-universe.com";
const PASS = process.env.FTP_PASS_API;

if (!PASS) {
  console.error("[ERREUR] FTP_PASS_API manquant dans .env");
  process.exit(1);
}

// Liste des fichiers a uploader (chemin local => chemin distant)
// Le serveur LWS a la structure : app.js, src/, package.json a la racine du compte FTP
const FILES = [
  ["api-v2/src/controllers/contenu.controller.js", "src/controllers/contenu.controller.js"],
  ["api-v2/src/middlewares/auth.js", "src/middlewares/auth.js"],
  ["api-v2/src/routes/contenu.routes.js", "src/routes/contenu.routes.js"],
];

async function deploy() {
  const client = new ftp.Client(60000);
  client.ftp.verbose = false;
  try {
    console.log("[FTP] Connexion API LWS...");
    await client.access({ host: HOST, user: USER, password: PASS, secure: false });
    console.log("[FTP] Connecte");

    for (const [local, remote] of FILES) {
      const remoteDir = path.dirname(remote);
      if (remoteDir !== ".") {
        await client.ensureDir("/" + remoteDir);
      }
      console.log("  + upload:", remote);
      await client.uploadFrom(local, remote.startsWith("/") ? remote : "/" + remote);
    }

    // Toucher tmp/restart.txt pour redemarrer Passenger
    console.log("[FTP] Restart Passenger...");
    await client.ensureDir("/tmp");
    fs.writeFileSync("/tmp/restart_marker.txt", "");
    await client.uploadFrom("/tmp/restart_marker.txt", "/tmp/restart.txt");

    console.log("\n[OK] Deploiement API termine");
    console.log("URL: https://apieducative.genius-universe.com");
  } catch (err) {
    console.error("[ERREUR]", err.message);
    process.exit(1);
  } finally {
    client.close();
  }
}

deploy();
