import { createServer } from "./utils/server";

const port = process.env.PORT || 3000;

createServer()
  .then((server) => {
    server.listen(port, () => {
      console.info(`Listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error(`Error: ${err}`);
  });
