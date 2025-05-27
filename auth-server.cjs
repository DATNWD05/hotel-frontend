const jsonServer = require("json-server");
const auth = require("json-server-auth");
const cors = require("cors");

const server = jsonServer.create();
const router = jsonServer.router("db.json");
const middlewares = jsonServer.defaults();

server.db = router.db;

server.use(cors());
server.use(middlewares);
server.use(auth);
server.use(router);

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`✅ JSON Server Auth running at http://localhost:${PORT}`);
});
