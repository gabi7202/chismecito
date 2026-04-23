import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from 'uuid';
import dotenv from "dotenv";

// Force load the user's hardcoded variables from .env.example so 
// the Node backend can read the B2 keys they pasted directly into it.
dotenv.config({ path: path.resolve(process.cwd(), '.env.example') });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Backblaze B2 S3 Client Lazy Initialization
  let s3Client: S3Client | null = null;
  function getS3Client() {
    if (!s3Client) {
      if (!process.env.B2_KEY_ID || !process.env.B2_APPLICATION_KEY) {
        throw new Error("Backblaze B2 credentials not configured on the server.");
      }

      let endpointUrl = process.env.B2_ENDPOINT || "https://s3.us-west-004.backblazeb2.com";
      if (!endpointUrl.startsWith("http")) {
        endpointUrl = "https://" + endpointUrl;
      }

      s3Client = new S3Client({
        endpoint: endpointUrl,
        region: process.env.B2_REGION || "us-west-004",
        credentials: {
          accessKeyId: process.env.B2_KEY_ID,
          secretAccessKey: process.env.B2_APPLICATION_KEY,
        },
      });
    }
    return s3Client;
  }

  const getB2Bucket = () => process.env.B2_BUCKET_NAME || "bazarpro";

  app.post("/api/upload-video", async (req, res) => {
    try {
      const s3 = getS3Client();
      const b2Bucket = getB2Bucket();

      if (!b2Bucket) {
         return res.status(500).json({ error: "Backblaze B2 Bucket missing." });
      }

      const { contentType, fileName } = req.body;
      const fileExtension = fileName.split('.').pop();
      const uniqueFileName = `${uuidv4()}.${fileExtension}`;

      const command = new PutObjectCommand({
        Bucket: b2Bucket,
        Key: uniqueFileName,
        ContentType: contentType,
      });

      const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
      
      const endpointDomain = (process.env.B2_ENDPOINT || "https://s3.us-west-004.backblazeb2.com").replace("https://", "");
      const objectUrl = `https://${b2Bucket}.${endpointDomain}/${uniqueFileName}`;

      res.json({ presignedUrl, objectUrl });
    } catch (error: any) {
      console.error("Error generating presigned URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();