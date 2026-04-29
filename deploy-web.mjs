import * as ftp from "basic-ftp";
import fs from "fs";
import path from "path";

const HOST = "ftp.genius-universe.com";
const USER = "edo@genius-universe.com";
const PASS = "EducPlatform2024BurkinaFaso";
const LOCAL_DIR = "./web-app/dist";
const REMOTE_DIR = "/";

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

    // Upload vite.svg
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
