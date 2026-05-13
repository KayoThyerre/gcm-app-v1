import "dotenv/config";
import { env } from "./config/env";
import { app } from "./app";

const HOST = "0.0.0.0";

app.listen(env.PORT, HOST, () => {
  console.log(`Servidor rodando em http://${HOST}:${env.PORT}`);
});
