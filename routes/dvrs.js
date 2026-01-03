const express = require("express");
const router = express.Router();
const dvrController = require("../controllers/dvrController");

router.get("/", dvrController.getAllDvrsPaginated);
router.post("/add", dvrController.addDvr);
router.put("/:id", dvrController.updateDvr);
router.delete("/:id", dvrController.deleteDvr);

router.get("/edit/:id", async (req, res) => {
  const dvrId = req.params.id;

  // Get DVR with associated cameras and location name
  const dvr = await dvrController.getDvrWithCamerasById(dvrId); // Custom function you define
  if (!dvr) return res.status(404).send("DVR not found");

  res.render("dvr_view", { dvr, user:req.user });
});

router.get("/add", dvrController.renderAddDvrForm);

module.exports = router;
