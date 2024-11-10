const { generateSlug } = require("random-word-slugs");
const prisma = require("../prisma/prismaClient");
const { z } = require("zod");

// Get all playgrounds for a specific user
const getPlaygrounds = async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "User ID is required" });

  try {
    const playgrounds = await prisma.playgrounds.findMany({
      where: { userID: userId },
    });
    return res.status(200).json(playgrounds);
  } catch (error) {
    console.error("Error fetching playgrounds:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Get a specific playground by ID
const getPlaygroundById = async (req, res) => {
  const { id } = req.params;
  console.log("---> Fetching playground:", id);

  try {
    const playground = await prisma.playgrounds.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!playground) {
      return res.status(404).json({ error: "Playground not found" });
    }

    return res.status(200).json(playground);
  } catch (error) {
    console.error("Error fetching playground:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Create a new playground
const createPlayground = async (req, res) => {
  const { userId, env } = req.body; 

  try {
    const newPlayground = await prisma.playgrounds.create({
      data: {
        name: generateSlug(), 
        env,                  
        userID: userId,       
      },
    });

    return res.status(201).json({
      message: "Playground created successfully",
      playground: newPlayground,
    });
  } catch (error) {
    if (error.meta?.target?.includes("name")) {
      return res.status(409).json({ error: "Choose a different playground name." });
    }
    console.error("Error creating playground:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Delete a specific playground by ID
const deletePlayground = async (req, res) => {
  const { id } = req.params; 
  console.log("---> Deleting playground:", id);

  try {
    const playground = await prisma.playgrounds.findUnique({ where: { id } });
    if (!playground) return res.status(404).json({ error: "Playground not found" });

    await prisma.playgrounds.delete({ where: { id } });
    console.log("---> Playground Deleted:", id);

    return res.status(200).json({ message: "Playground deleted successfully" });
  } catch (error) {
    console.error("Error deleting playground:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};


module.exports = {
  getPlaygrounds,
  getPlaygroundById,
  createPlayground,
  deletePlayground,
};
