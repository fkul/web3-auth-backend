import { Router } from "express";
import { generateNonce, SiweMessage } from "siwe";

const router = Router();

export const auth = () => {
  router.get("/nonce", (req, res) => {
    req.session.nonce = generateNonce();
    res.send(req.session.nonce);
  });

  router.post("/validate", async (req, res) => {
    try {
      const { message, signature } = req.body;
      const siweMessage = new SiweMessage(message);
      const fields = await siweMessage.validate(signature);

      if (fields.nonce !== req.session.nonce) {
        return res.status(422).end("Invalid nonce");
      }

      req.session.siwe = fields;
      req.session.save(() => res.end());
    } catch (e) {
      res.status(401).end();
    }
  });

  router.get("/me", (req, res) => {
    const address = req.session.siwe?.address;
    address ? res.send(address) : res.status(401).end();
  });

  router.post("/sign-out", async (req, res) => {
    req.session.destroy(() => res.end());
  });

  return router;
};
