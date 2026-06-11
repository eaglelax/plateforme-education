import * as ftp from "basic-ftp";
import fs from "fs";
import path from "path";

// Charger .env du repo racine si present
const envPath = path.resolve(".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2].trim();
  }
}

const HOST = process.env.FTP_HOST || "ftp.genius-universe.com";
const USER = process.env.FTP_USER_WEB || "edo@genius-universe.com";
const PASS = process.env.FTP_PASS_WEB;
const LOCAL_DIR = "./web-app/dist";
const REMOTE_DIR = "/";

if (!PASS) {
  console.error("[ERREUR] FTP_PASS_WEB manquant.");
  console.error("Ajoute FTP_PASS_WEB=xxx dans .env (a la racine) ou en variable d'environnement.");
  process.exit(1);
}

async function deploy() {
  const client = new ftp.Client(60000);
  client.ftp.verbose = false;

  try {
    console.log("[FTP] Connexion a", HOST);
    await client.access({
      host: HOST,
      user: USER,
      password: PASS,
      secure: false,
    });
    console.log("[FTP] Connecte avec succes");

    // Lister anciens assets pour les nettoyer
    console.log("[FTP] Nettoyage anciens assets...");
    try {
      await client.cd("/assets");
      const oldFiles = await client.list();
      for (const f of oldFiles) {
        if (f.type === 1 && (f.name.startsWith("index-") || f.name.endsWith(".js") || f.name.endsWith(".css"))) {
          try {
            await client.remove(f.name);
            console.log("  - supprime:", f.name);
          } catch (e) {
            console.log("  ! impossible de supprimer:", f.name);
          }
        }
      }
      await client.cd("/");
    } catch (e) {
      console.log("[FTP] Pas de dossier /assets a nettoyer");
    }

    // Upload index.html
    console.log("[FTP] Upload index.html");
    await client.uploadFrom(path.join(LOCAL_DIR, "index.html"), "index.html");

    // Upload assets/
    console.log("[FTP] Upload assets/");
    await client.ensureDir("/assets");
    const assetsDir = path.join(LOCAL_DIR, "assets");
    const assetFiles = fs.readdirSync(assetsDir);
    for (const file of assetFiles) {
      const local = path.join(assetsDir, file);
      console.log("  + upload:", file);
      await client.uploadFrom(local, file);
    }
    await client.cd("/");

    // Upload favicon ANKA (et anciens éventuels pour compat)
    if (fs.existsSync(path.join(LOCAL_DIR, "anka-favicon.svg"))) {
      console.log("[FTP] Upload anka-favicon.svg");
      await client.uploadFrom(path.join(LOCAL_DIR, "anka-favicon.svg"), "anka-favicon.svg");
    }
    if (fs.existsSync(path.join(LOCAL_DIR, "vite.svg"))) {
      await client.uploadFrom(path.join(LOCAL_DIR, "vite.svg"), "vite.svg");
    }

    console.log("\n[OK] Deploiement reussi");
    console.log("URL: http://edo.genius-universe.com");
  } catch (err) {
    console.error("[ERREUR]", err.message);
    process.exit(1);
  } finally {
    client.close();
  }
}

deploy();
