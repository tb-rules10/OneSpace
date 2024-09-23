const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.createOrLoginUser = async (req, res) => {
  const { id, email, username } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { id } });

    if (!existingUser) {
      const newUser = await prisma.user.create({ data: { id, email, username } });
      return res.status(200).json(newUser);
    } else {
      return res.status(200).json(existingUser);
    }
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: "User with this email already exists" });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};
